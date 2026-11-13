import { asE2eeApiError } from "../api-errors";
import {
  decodeReadSync,
  encodeReadSync,
  newReadSyncId,
  pagePositions,
  type ReadPosition,
  type ReadSyncPayload,
  type ReadSyncType,
} from "../read-sync-payload";
import type { StoredGroup, StoredReadSync } from "../records";
import {
  checkpoint,
  DAY_MS,
  isActive,
  ownDeviceKey,
  persistStored,
  type EngineContext,
  type ReadSyncHooks,
  requireMls,
} from "./context";
import { E2eeError } from "./errors";
import { recountUnread } from "./history";
import { sleep } from "./runtime";
import type { GroupRuntime } from "./store";
import { catchUpGroup } from "./sync";

/**
 * Read-state sync between one user's own devices (D175, design P60).
 *
 * Each profile keeps one "self" MLS group whose members are only its own
 * devices. Reading a chat queues its read position; a batch goes out as one
 * fixed-size message a little later. Other devices take the higher of what
 * they have and what they receive, per chat, never going back. The server
 * relays ciphertext of one size and learns neither which chats nor how far.
 */

/** P60 §4: a batch goes out 20–40 s after the first unsent read. */
const SEND_DELAY_MS = 20_000;
const SEND_JITTER_MS = 20_000;
/** At most one batch every 15 s, except when the page is hidden. */
const MIN_SPACING_MS = 15_000;
const RETRY_MS = 60_000;
/** P60 §5: any device answers a hello after 60–120 s if nobody else did. */
const HELLO_ANSWER_MS = 60_000;
const HELLO_JITTER_MS = 60_000;
/** Snapshot pages are paced at most 10 a second. */
const PAGE_SPACING_MS = 100;
/** A device creates a self group at most once a day. */
const CREATE_EVERY_MS = DAY_MS;
/**
 * P60 §2 rule 1: a device with siblings waits this long to be added to
 * their self group before it creates one of its own.
 */
const JOIN_WAIT_MS = 2 * 60_000;
/** Received positions kept for chats this device has not joined. */
const MAX_RECEIVED = 2000;

const TIMER_SEND = "read-sync:send";
const TIMER_APPLY = "read-sync:apply";
const TIMER_ANSWER = "read-sync:answer";
const TIMER_SNAPSHOT = "read-sync:snapshot";
const TIMER_HELLO = "read-sync:hello";

const isSelfGroup = (record: StoredGroup): boolean =>
  record.metadata.kind === "self";

/**
 * Runs `step` for each item, one after another. Sends go out in order on
 * purpose: each runs in the engine's serial queue, and a burst would only
 * queue there and count against the per-device message rate limit.
 */
const inOrder = <T>(
  items: readonly T[],
  step: (item: T, index: number) => Promise<void>
): Promise<void> =>
  items.reduce<Promise<void>>(
    (previous, item, index) => previous.then(() => step(item, index)),
    Promise.resolve()
  );

const activeSelfGroups = (ctx: EngineContext): GroupRuntime[] =>
  [...ctx.store.groups.values()].filter(
    (runtime) => isActive(runtime) && isSelfGroup(runtime.record)
  );

/**
 * The canonical self group: the active one with the lowest handle. Group
 * handles break creation races, so device clocks never matter (P60 §2).
 */
function canonicalSelfGroup(ctx: EngineContext): GroupRuntime | null {
  return activeSelfGroups(ctx).reduce<GroupRuntime | null>(
    (best, runtime) =>
      !best || runtime.record.g < best.record.g ? runtime : best,
    null
  );
}

/**
 * The handoff from `group` to `canonical` is verified when every other
 * device of `group` is also in `canonical` (or already leaving): leaving
 * `group` then cuts nobody off (P60 §2 rule 3).
 */
function handedOver(
  group: GroupRuntime,
  canonical: GroupRuntime,
  own: string
): boolean {
  const moved = new Set(canonical.record.members.map((m) => m.deviceKey));
  return group.record.members.every(
    (member) =>
      member.deviceKey === own ||
      moved.has(member.deviceKey) ||
      group.record.leaving.includes(member.deviceKey)
  );
}

interface ReadSyncDeps {
  /** Creates a self group of this device and its trusted siblings. */
  createSelfGroup: () => Promise<string>;
  /** Removes only this device from a group (an older self group). */
  leaveThisDevice: (g: string) => Promise<void>;
}

export class ReadSync implements ReadSyncHooks {
  private readonly ctx: EngineContext;
  private readonly deps: ReadSyncDeps;
  private readonly recount = new Set<string>();
  private flushing: Promise<void> | null = null;
  private lastSentAt = 0;
  /** The device whose hello is waiting for a snapshot, if any. */
  private helloFrom: string | null = null;

  constructor(ctx: EngineContext, deps: ReadSyncDeps) {
    this.ctx = ctx;
    this.deps = deps;
  }

  /** Whether this build creates self groups and sends positions. */
  private get enabled(): boolean {
    return this.ctx.options.readSync === true;
  }

  private state(): StoredReadSync {
    const device = this.ctx.device;
    if (!device) {
      return { unsent: [] };
    }
    device.readSync ??= { unsent: [] };
    return device.readSync;
  }

  private persistDevice(): Promise<void> {
    const device = this.ctx.device;
    if (!device) {
      return Promise.resolve();
    }
    return persistStored(this.ctx, (expectedVersion) =>
      this.ctx.storage.writeBatch(this.ctx.profileId, {
        device,
        expectedVersion,
      })
    );
  }

  /** Background work: tracked for idle(), errors stay local. */
  private run(task: () => Promise<unknown>): void {
    void this.ctx.tasks.track(
      (async () => {
        try {
          await task();
        } catch {
          // Read sync is best effort: the next read or sync pass retries.
        }
      })()
    );
  }

  // -------------------------------------------------------------------------
  // Sending
  // -------------------------------------------------------------------------

  /** A chat's read position moved forward on this device (markRead). */
  noteRead(g: string): void {
    const runtime = this.ctx.store.groups.get(g);
    if (!this.enabled || !runtime || isSelfGroup(runtime.record)) {
      return;
    }
    const state = this.state();
    if (!state.unsent.includes(runtime.record.g)) {
      state.unsent = [...state.unsent, runtime.record.g];
      this.run(() => this.persistDevice());
    }
    this.schedule(SEND_DELAY_MS + this.ctx.random() * SEND_JITTER_MS);
  }

  private schedule(delayMs: number): void {
    const spacing = this.lastSentAt + MIN_SPACING_MS - this.ctx.now();
    this.ctx.timers.arm(TIMER_SEND, Math.max(delayMs, spacing), () => {
      this.run(() => this.flush());
    });
  }

  /** Sends what is waiting now (the page or app was hidden). */
  flushNow(): Promise<void> {
    this.ctx.timers.cancel(TIMER_SEND);
    return this.flush();
  }

  flush(): Promise<void> {
    this.flushing ??= this.flushOnce().finally(() => {
      this.flushing = null;
    });
    return this.flushing;
  }

  private async flushOnce(): Promise<void> {
    const state = this.state();
    if (!this.enabled || state.unsent.length === 0) {
      return;
    }
    const targets = this.sendTargets();
    if (targets.length === 0) {
      return;
    }
    const batch = new Set(state.unsent);
    const positions: ReadPosition[] = [];
    for (const g of batch) {
      const runtime = this.ctx.store.groups.get(g);
      if (
        runtime &&
        !isSelfGroup(runtime.record) &&
        runtime.record.readSeq > 0
      ) {
        positions.push([g, runtime.record.readSeq]);
      }
    }
    const pages = pagePositions(positions);
    try {
      await inOrder(targets, (target) =>
        inOrder(pages, (page) => this.send(target, "read", page))
      );
    } catch {
      this.ctx.timers.arm(TIMER_SEND, RETRY_MS, () => {
        this.run(() => this.flush());
      });
      return;
    }
    this.lastSentAt = this.ctx.now();
    const sent = new Map(positions);
    // Chats read while this batch went out, and chats read further since
    // it was built, stay queued for the next batch.
    state.unsent = state.unsent.filter((g) => {
      if (!batch.has(g)) {
        return true;
      }
      const seq = sent.get(g);
      const runtime = this.ctx.store.groups.get(g);
      return (
        seq !== undefined &&
        runtime !== undefined &&
        runtime.record.readSeq > seq
      );
    });
    await this.persistDevice();
  }

  /**
   * Where read state goes: the canonical self group, and each older one
   * whose handoff to it is not verified yet, so a sibling not yet added to
   * the canonical group still hears (P60 §2 rule 3). Only groups this
   * device may send into: every member one of this profile's devices and
   * none waiting for the user's "Add device" (rule 2).
   */
  private sendTargets(): GroupRuntime[] {
    const canonical = canonicalSelfGroup(this.ctx);
    const own = this.ctx.device?.deviceKey;
    if (!canonical || !own) {
      return [];
    }
    return [
      canonical,
      ...activeSelfGroups(this.ctx).filter(
        (runtime) =>
          runtime !== canonical && !handedOver(runtime, canonical, own)
      ),
    ].filter(
      (runtime) =>
        !runtime.record.pendingCommit &&
        runtime.record.members.every(
          (member) =>
            member.profileId === this.ctx.profileId &&
            this.ctx.store.findUntrusted(member.deviceKey) === null
        )
    );
  }

  /** Sends one payload; nothing at all goes out with the flag off. */
  private send(
    runtime: GroupRuntime,
    t: ReadSyncType,
    r: readonly ReadPosition[],
    s?: ReadSyncPayload["s"]
  ): Promise<void> {
    const body = encodeReadSync({
      v: 1,
      t,
      id: newReadSyncId(),
      ts: this.ctx.now(),
      r,
      ...(s ? { s } : {}),
    });
    return this.enabled
      ? this.sendRetrying(runtime, body, 2)
      : Promise.resolve();
  }

  /** A commit can win the race for the epoch: encrypt again and resend. */
  private async sendRetrying(
    runtime: GroupRuntime,
    body: Uint8Array,
    retries: number
  ): Promise<void> {
    try {
      await this.sendOnce(runtime, body);
    } catch (error) {
      const stale = asE2eeApiError(error)?.code === "E2EE_EPOCH_STALE";
      if (!stale || retries === 0) {
        throw error;
      }
      await this.sendRetrying(runtime, body, retries - 1);
    }
  }

  /** Encrypts and submits one payload (8.7: state saved before submit). */
  private sendOnce(runtime: GroupRuntime, body: Uint8Array): Promise<void> {
    return this.ctx.queue.run(async () => {
      await catchUpGroup(this.ctx, runtime);
      if (!isActive(runtime)) {
        throw new E2eeError("E2EE_CONVERSATION_INACTIVE");
      }
      const g = runtime.record.g;
      const sealed = requireMls(this.ctx).encryptMessage(g, body);
      await checkpoint(this.ctx, { groups: [runtime] });
      const sent = await this.ctx.api.sendMessage(g, {
        epoch: sealed.epoch,
        data: sealed.data,
        epoch_fp: sealed.epoch_fp,
        sender_device_key: ownDeviceKey(this.ctx),
      });
      // Our own ciphertext cannot be decrypted here: skip it in the log.
      runtime.record.sentSeqs.push(sent.seq);
      await checkpoint(this.ctx, { groups: [runtime], skipWasm: true });
    });
  }

  /** Every position this device knows, in snapshot pages (P60 §5). */
  private async sendSnapshot(runtime: GroupRuntime): Promise<void> {
    const pages = pagePositions([...this.knownPositions()]);
    if (pages.length === 0) {
      pages.push([]);
    }
    const id = newReadSyncId();
    await inOrder(pages, async (page, index) => {
      if (index > 0) {
        await sleep(this.ctx.scheduler, PAGE_SPACING_MS);
      }
      await this.send(runtime, "snap", page, [id, index + 1, pages.length]);
    });
  }

  /** Read positions of joined chats, and received ones for the others. */
  private knownPositions(): Map<string, number> {
    const best = new Map<string, number>();
    for (const group of this.ctx.store.groups.values()) {
      const record = group.record;
      if (isSelfGroup(record)) {
        // Positions for chats this device has not joined are passed on too.
        for (const [g, seq] of Object.entries(
          record.readSync?.received ?? {}
        )) {
          best.set(g, Math.max(best.get(g) ?? 0, seq));
        }
      } else if (record.readSeq > 0) {
        best.set(record.g, Math.max(best.get(record.g) ?? 0, record.readSeq));
      }
    }
    return best;
  }

  private scheduleSnapshot(g: string, key: string, delayMs: number): void {
    if (!this.enabled) {
      return;
    }
    this.ctx.timers.arm(key, delayMs, () => {
      this.run(async () => {
        const runtime = this.sendTargets().find((item) => item.record.g === g);
        if (runtime) {
          await this.sendSnapshot(runtime);
        }
      });
    });
  }

  // -------------------------------------------------------------------------
  // Receiving (inside the serial queue, while a log page is processed)
  // -------------------------------------------------------------------------

  receive(
    runtime: GroupRuntime,
    body: Uint8Array,
    senderDeviceKey: string
  ): void {
    const payload = decodeReadSync(body);
    if (!payload || senderDeviceKey === ownDeviceKey(this.ctx)) {
      return;
    }
    const record = runtime.record;
    const received = { ...(record.readSync?.received ?? {}) };
    for (const [g, seq] of payload.r) {
      if (g === record.g) {
        continue;
      }
      const known = received[g];
      if (known !== undefined || Object.keys(received).length < MAX_RECEIVED) {
        received[g] = Math.max(known ?? 0, seq);
      }
    }
    record.readSync = { received };
    if (payload.t === "snap" && senderDeviceKey !== this.helloFrom) {
      // Someone else answered the hello: no need to answer it too.
      this.helloFrom = null;
      this.ctx.timers.cancel(TIMER_ANSWER);
    } else if (payload.t === "hello" && this.enabled) {
      this.helloFrom = senderDeviceKey;
      this.ctx.timers.arm(
        TIMER_ANSWER,
        HELLO_ANSWER_MS + this.ctx.random() * HELLO_JITTER_MS,
        () => {
          this.helloFrom = null;
          this.scheduleSnapshot(record.g, TIMER_SNAPSHOT, 0);
        },
        false
      );
    }
    this.scheduleApply();
  }

  /** P60 default: your own message from another device marks the chat read. */
  ownMessage(runtime: GroupRuntime, seq: number): void {
    if (!this.enabled || seq <= runtime.record.readSeq) {
      return;
    }
    runtime.record.readSeq = seq;
    this.recount.add(runtime.record.g);
    this.scheduleApply();
  }

  devicesAdded(g: string): void {
    this.scheduleSnapshot(g, TIMER_SNAPSHOT, 0);
  }

  /**
   * A self group joined: say hello, so a sibling sends its state, and pass
   * on what this device knows (it may come from an older self group or a
   * restored backup). Any group joined: received positions may now apply.
   */
  joined(runtime: GroupRuntime): void {
    if (isSelfGroup(runtime.record) && this.enabled) {
      const g = runtime.record.g;
      this.ctx.timers.arm(TIMER_HELLO, 0, () => {
        this.run(async () => {
          const current = this.sendTargets().find(
            (item) => item.record.g === g
          );
          if (!current) {
            return;
          }
          await this.send(current, "hello", []);
          if (this.knownPositions().size > 0) {
            await this.sendSnapshot(current);
          }
        });
      });
    }
    this.scheduleApply();
  }

  private scheduleApply(): void {
    this.ctx.timers.arm(TIMER_APPLY, 0, () => {
      this.run(() => this.apply());
    });
  }

  // -------------------------------------------------------------------------
  // Applying
  // -------------------------------------------------------------------------

  /**
   * Moves read positions forward from what self groups received (P60 §3):
   * per chat the highest, capped once at the server's last_seq listed after
   * receipt, never backwards. Applied entries are consumed, so the cap is
   * never lifted later; chats not joined yet keep their entry.
   */
  async apply(): Promise<void> {
    const candidates = await this.ctx.queue.run(() =>
      Promise.resolve(this.candidates())
    );
    // Listed after receipt: a legitimate position is never above it.
    const lastSeq =
      candidates.size > 0
        ? await this.listLastSeq()
        : new Map<string, number>();
    await this.ctx.queue.run(async () => {
      const touched = new Map<string, GroupRuntime>();
      for (const [g, seq] of lastSeq ? candidates : []) {
        const runtime = this.ctx.store.groups.get(g);
        if (!runtime || isSelfGroup(runtime.record)) {
          continue;
        }
        const cap = lastSeq?.get(g) ?? runtime.record.cursor;
        const position = Math.min(seq, cap);
        if (position > runtime.record.readSeq) {
          runtime.record.readSeq = position;
          touched.set(g, runtime);
        }
      }
      for (const g of this.recount) {
        const runtime = this.ctx.store.groups.get(g);
        if (runtime) {
          touched.set(g, runtime);
        }
      }
      this.recount.clear();
      const selfGroups = this.consumeReceived(lastSeq ? candidates : null);
      if (touched.size === 0 && selfGroups.length === 0) {
        return;
      }
      const groups = [...touched.values()];
      await checkpoint(this.ctx, {
        groups: [...groups, ...selfGroups],
        skipWasm: true,
      });
      await inOrder(groups, (runtime) => recountUnread(this.ctx, runtime));
      if (groups.length > 0) {
        await checkpoint(this.ctx, { groups, skipWasm: true });
      }
    });
  }

  /** Positions received for joined chats that would move them forward. */
  private candidates(): Map<string, number> {
    const out = new Map<string, number>();
    for (const runtime of this.ctx.store.groups.values()) {
      if (!isSelfGroup(runtime.record)) {
        continue;
      }
      for (const [g, seq] of Object.entries(
        runtime.record.readSync?.received ?? {}
      )) {
        const target = this.ctx.store.groups.get(g);
        if (target && seq > target.record.readSeq) {
          out.set(g, Math.max(out.get(g) ?? 0, seq));
        }
      }
    }
    return out;
  }

  /**
   * Drops received entries of joined chats that were applied (`applied`:
   * the candidates of this pass, null when the listing failed) or no longer
   * move the chat forward. Entries that arrived meanwhile stay for the next
   * pass. Returns the self groups whose record changed.
   */
  private consumeReceived(
    applied: ReadonlyMap<string, number> | null
  ): GroupRuntime[] {
    const changed: GroupRuntime[] = [];
    for (const runtime of this.ctx.store.groups.values()) {
      const received = runtime.record.readSync?.received;
      if (!isSelfGroup(runtime.record) || !received) {
        continue;
      }
      const kept = Object.fromEntries(
        Object.entries(received).filter(([g, seq]) => {
          const target = this.ctx.store.groups.get(g);
          if (!target) {
            return true;
          }
          const covered = Math.max(target.record.readSeq, applied?.get(g) ?? 0);
          return seq > covered;
        })
      );
      if (Object.keys(kept).length !== Object.keys(received).length) {
        runtime.record.readSync = { received: kept };
        changed.push(runtime);
      }
    }
    return changed;
  }

  /** The device's groups and their last_seq; null when the list failed. */
  private async listLastSeq(): Promise<Map<string, number> | null> {
    try {
      const groups = await this.ctx.api.getDeviceGroups(ownDeviceKey(this.ctx));
      return new Map(
        groups.map((item) => [item.group.toLowerCase(), item.last_seq])
      );
    } catch {
      return null;
    }
  }

  // -------------------------------------------------------------------------
  // Self-group lifecycle (after every full sync pass)
  // -------------------------------------------------------------------------

  async afterSync(): Promise<void> {
    await this.apply();
    const canonical = canonicalSelfGroup(this.ctx);
    if (canonical) {
      await this.joinedSelfGroup();
      await this.leaveHandedOver(canonical);
      if (
        this.enabled &&
        this.state().unsent.length > 0 &&
        !this.ctx.timers.has(TIMER_SEND)
      ) {
        this.schedule(0);
      }
      return;
    }
    if (this.enabled && (await this.mayCreate())) {
      const state = this.state();
      state.createdAt = this.ctx.now();
      delete state.waitingSince;
      await this.persistDevice();
      await this.deps.createSelfGroup();
    }
  }

  /** In a self group now: no longer waiting to be added to one. */
  private async joinedSelfGroup(): Promise<void> {
    const state = this.state();
    if (state.waitingSince !== undefined) {
      delete state.waitingSince;
      await this.persistDevice();
    }
  }

  /**
   * P60 §2 rule 1: a device with no active self group creates one after a
   * full sync (pending Welcomes processed first), at most once a day. With
   * siblings it first waits to be added to theirs, and creates its own only
   * if that stalls for JOIN_WAIT_MS (rule 3 then settles which one stays).
   */
  private async mayCreate(): Promise<boolean> {
    const device = this.ctx.device;
    if (!device?.registered) {
      return false;
    }
    const now = this.ctx.now();
    const createdAt = device.readSync?.createdAt;
    if (createdAt !== undefined && now - createdAt < CREATE_EVERY_MS) {
      return false;
    }
    const siblings = (
      await this.ctx.directory.getProfileDevices(this.ctx.profileId)
    ).filter(
      (item) =>
        item.device_key.toLowerCase() !== device.deviceKey &&
        item.revoked_at === null
    );
    if (siblings.length === 0) {
      return true;
    }
    const state = this.state();
    if (state.waitingSince === undefined) {
      state.waitingSince = now;
      await this.persistDevice();
    }
    return now - state.waitingSince >= JOIN_WAIT_MS;
  }

  /**
   * P60 §2 rule 3: once every other device of an older self group is also
   * in the canonical one, this device leaves the older group, for itself
   * only. A device never added to the canonical group is never cut off.
   */
  private async leaveHandedOver(canonical: GroupRuntime): Promise<void> {
    const own = this.ctx.device?.deviceKey;
    if (!own || !canonical.record.members.some((m) => m.deviceKey === own)) {
      return;
    }
    const older = activeSelfGroups(this.ctx).filter(
      (runtime) => runtime !== canonical && handedOver(runtime, canonical, own)
    );
    await inOrder(older, (runtime) =>
      this.deps.leaveThisDevice(runtime.record.g).catch(() => undefined)
    );
  }
}
