import {
  comparePinPositions,
  isConversationPin,
  isConversationPinRank,
  mergeConversationPins,
  mergeConversationPinRanks,
  pinPosition,
  type ConversationPin,
  type ConversationPinRank,
  type PinChanges,
  type PinRankVersions,
} from "../conversation-pins";
import {
  getConversationThreadKey,
  groupConversationThreads,
} from "../dm-conversations";
import {
  encodeReadSync,
  newReadSyncId,
  PIN_RANKS_PER_PAYLOAD,
  PINS_PER_PAYLOAD,
  type PinSyncPayload,
} from "../read-sync-payload";
import type { StoredConversationPins } from "../records";
import { checkpoint, type EngineContext } from "./context";
import { E2eeError } from "./errors";
import { sleep } from "./runtime";
import { trustsSelfMember } from "./self-groups";
import type { GroupRuntime } from "./store";

const EMPTY: StoredConversationPins = { versions: {}, unsent: [] };
const EMPTY_RANKS: PinRankVersions = {};
const PAGE_SPACING_MS = 100;
// A small pin batch plus its ranks fits in one padded envelope.
const MIXED_PAGE_SIZE = 6;

function collectReceivedPins(
  batches: readonly {
    pins: StoredConversationPins["versions"] | undefined;
    ranks: StoredConversationPins["ranks"];
  }[]
): PinChanges {
  return {
    pins: batches.flatMap(({ pins }) => Object.values(pins ?? {})),
    ranks: batches.flatMap(({ ranks }) => Object.values(ranks ?? {})),
  };
}

function rankOrder(
  ordered: readonly ConversationPin[],
  ranks: PinRankVersions,
  replaceAll: boolean
): ConversationPinRank[] {
  // A shared revision and random ID make concurrent reorders choose one winner.
  const revision =
    Object.values(ranks).reduce(
      (current, rank) => Math.max(current, rank[1]),
      0
    ) + 1;
  const id = newReadSyncId();
  return ordered.flatMap((pin, position) => {
    if (!replaceAll && pinPosition(ranks, pin) === position) return [];
    const rank: ConversationPinRank = [pin, revision, id, position];
    if (!isConversationPinRank(rank)) throw new E2eeError("E2EE_PIN_INVALID");
    return [rank];
  });
}

interface PinSyncDeps {
  readonly targets: () => readonly GroupRuntime[];
  readonly send: (runtime: GroupRuntime, body: Uint8Array) => Promise<void>;
  readonly changed: () => void;
}

/** Per-profile inbox preferences persisted with this encryption device. */
export class ConversationPins {
  private lastExchange: {
    readonly group: string;
    readonly deviceKeys: ReadonlySet<string>;
  } | null = null;

  constructor(
    private readonly ctx: EngineContext,
    private readonly deps: PinSyncDeps
  ) {}

  private get state(): StoredConversationPins {
    return this.ctx.device?.conversationPins ?? EMPTY;
  }

  pinForThread = (
    thread: string
  ): { pinned: true; pinPosition?: number } | undefined => {
    const state = this.state;
    const pin = state.versions[thread];
    if (!pin?.[3]) return undefined;
    const position = pinPosition(state.ranks ?? EMPTY_RANKS, pin);
    return position === undefined
      ? { pinned: true }
      : { pinned: true, pinPosition: position };
  };

  private snapshot(): Promise<PinChanges> {
    return this.ctx.queue.run(() => {
      const { versions, ranks } = this.known();
      return Promise.resolve({
        pins: Object.values(versions),
        ranks: Object.values(ranks),
      });
    });
  }

  /** Include decisions already received while their local apply is queued. */
  private known() {
    return this.mergeVersions(
      this.state,
      collectReceivedPins(this.receivedBatches())
    );
  }

  private mergeVersions(
    state: StoredConversationPins,
    { pins, ranks }: PinChanges
  ) {
    return {
      versions: mergeConversationPins(state.versions, pins),
      ranks: mergeConversationPinRanks(state.ranks ?? EMPTY_RANKS, ranks),
    };
  }

  private receivedBatches() {
    return [...this.ctx.store.groups.values()].flatMap((runtime) => {
      const { receivedPins: pins, receivedPinRanks: ranks } = runtime.record;
      return pins || ranks ? [{ runtime, pins, ranks }] : [];
    });
  }

  pending(): PinChanges | null {
    const { versions, unsent, ranks, unsentRanks } = this.state;
    const pins = unsent.flatMap((thread) => {
      const pin = versions[thread];
      return pin ? [pin] : [];
    });
    const rankUpdates = (unsentRanks ?? []).flatMap((thread) => {
      const rank = ranks?.[thread];
      return rank ? [rank] : [];
    });
    return pins.length > 0 || rankUpdates.length > 0
      ? { pins, ranks: rankUpdates }
      : null;
  }

  hasPending(): boolean {
    return (
      this.state.unsent.length > 0 || (this.state.unsentRanks?.length ?? 0) > 0
    );
  }

  set(g: string, pinned: boolean): Promise<void> {
    return this.ctx.queue.run(async () => {
      if (this.ctx.store.status !== "ready" || !this.ctx.mls) {
        throw new E2eeError("E2EE_NOT_READY");
      }
      const conversation = this.ctx.store.getConversation(g.toLowerCase());
      if (!conversation) throw new E2eeError("E2EE_CONVERSATION_INACTIVE");
      const thread = getConversationThreadKey(conversation, this.ctx.profileId);
      const known = this.known();
      const current = known.versions[thread];
      if ((current?.[3] === true) === pinned) return;
      const update: ConversationPin = [
        thread,
        (current?.[1] ?? 0) + 1,
        newReadSyncId(),
        pinned,
      ];
      if (!isConversationPin(update)) throw new E2eeError("E2EE_PIN_INVALID");
      const ranks = pinned
        ? rankOrder([...this.orderedPins(known), update], known.ranks, false)
        : [];
      await this.merge({ pins: [update], ranks });
    });
  }

  move(thread: string, target: string): Promise<void> {
    return this.ctx.queue.run(async () => {
      if (this.ctx.store.status !== "ready" || !this.ctx.mls) {
        throw new E2eeError("E2EE_NOT_READY");
      }
      const known = this.known();
      const ordered = this.orderedPins(known);
      const from = ordered.findIndex(([key]) => key === thread);
      const to = ordered.findIndex(([key]) => key === target);
      if (from < 0 || to < 0 || from === to) return;
      const [moved] = ordered.splice(from, 1);
      ordered.splice(to, 0, moved!);
      await this.merge({
        pins: [],
        ranks: rankOrder(ordered, known.ranks, true),
      });
    });
  }

  private orderedPins({
    versions,
    ranks,
  }: {
    versions: StoredConversationPins["versions"];
    ranks: PinRankVersions;
  }): ConversationPin[] {
    const threads = groupConversationThreads(
      this.ctx.store.getConversations(),
      this.ctx.profileId
    );
    const recency = new Map(threads.map(({ key }, index) => [key, index]));
    return Object.values(versions)
      .filter((pin) => pin[3])
      .sort(
        (a, b) =>
          comparePinPositions(
            pinPosition(ranks, a),
            pinPosition(ranks, b),
            a[0],
            b[0]
          ) ||
          (recency.get(a[0]) ?? threads.length) -
            (recency.get(b[0]) ?? threads.length) ||
          Number(a[0] > b[0]) - Number(a[0] < b[0])
      );
  }

  /** Called inside the queue, including when restoring an encrypted backup. */
  async merge(updates: PinChanges): Promise<void> {
    const state = this.state;
    const { versions, ranks } = this.mergeVersions(state, updates);
    if (versions === state.versions && ranks === (state.ranks ?? EMPTY_RANKS))
      return;
    const unsent = [
      ...new Set([...state.unsent, ...updates.pins.map(([thread]) => thread)]),
    ];
    const unsentRanks = [
      ...new Set([
        ...(state.unsentRanks ?? []),
        ...updates.ranks.map(([[thread]]) => thread),
      ]),
    ];
    await this.write({ versions, unsent, ranks, unsentRanks });
    this.ctx.store.touch();
    this.deps.changed();
  }

  receive(
    runtime: GroupRuntime,
    payload: PinSyncPayload,
    senderKey: string
  ): void {
    const { g, members } = runtime.record;
    const sender = members.find((member) => member.deviceKey === senderKey);
    if (!sender || !trustsSelfMember(this.ctx, runtime, sender)) return;

    const ranks = payload.ranks ?? [];
    if (payload.pins.length > 0 || ranks.length > 0) {
      // Keep the update beside the cursor until both can be saved to disk.
      if (payload.pins.length > 0) {
        runtime.record.receivedPins = mergeConversationPins(
          runtime.record.receivedPins ?? {},
          payload.pins
        );
      }
      if (ranks.length > 0) {
        runtime.record.receivedPinRanks = mergeConversationPinRanks(
          runtime.record.receivedPinRanks ?? EMPTY_RANKS,
          ranks
        );
      }
      this.ctx.timers.arm("pin-sync:apply", 0, () => {
        this.run(() => this.apply());
      });
    }
    if (payload.request && this.ctx.options.readSync === true) {
      this.ctx.timers.arm(`pin-sync:snapshot:${g}`, 0, () => {
        this.run(async () => {
          await this.apply();
          const target = this.deps
            .targets()
            .find((item) => item.record.g === g);
          if (target) await this.send(target, await this.snapshot());
        });
      });
    }
  }

  apply(): Promise<void> {
    return this.ctx.queue.run(async () => {
      const received = this.receivedBatches();
      if (received.length === 0 || !this.ctx.device) return;
      const state = this.state;
      const { versions, ranks } = this.mergeVersions(
        state,
        collectReceivedPins(received)
      );
      for (const { runtime } of received) {
        delete runtime.record.receivedPins;
        delete runtime.record.receivedPinRanks;
      }
      try {
        await this.write(
          { ...state, versions, ranks },
          received.map(({ runtime }) => runtime)
        );
      } catch (error) {
        for (const { runtime, pins, ranks: receivedRanks } of received) {
          if (pins) runtime.record.receivedPins = pins;
          if (receivedRanks) runtime.record.receivedPinRanks = receivedRanks;
        }
        throw error;
      }
      if (
        versions !== state.versions ||
        ranks !== (state.ranks ?? EMPTY_RANKS)
      ) {
        this.ctx.store.touch();
      }
    });
  }

  acknowledge(sent: PinChanges): Promise<void> {
    return this.ctx.queue.run(async () => {
      const state = this.state;
      const sentIds = new Set(sent.pins.map((update) => update[2]));
      const sentRanks = new Map(
        sent.ranks.map(([[thread], , id]) => [thread, id])
      );
      const unsent = state.unsent.filter(
        (thread) => !sentIds.has(state.versions[thread]?.[2] ?? "")
      );
      const pendingRanks = state.unsentRanks ?? [];
      // A newer reorder can replace a rank while this batch is in flight.
      const unsentRanks = pendingRanks.filter((thread) => {
        const current = state.ranks?.[thread];
        return current !== undefined && current[2] !== sentRanks.get(thread);
      });
      if (
        unsent.length !== state.unsent.length ||
        unsentRanks.length !== pendingRanks.length
      ) {
        await this.write({ ...state, unsent, unsentRanks });
      }
    });
  }

  hasSibling(runtime: GroupRuntime): boolean {
    return runtime.record.members.some(
      (member) => member.deviceKey !== this.ctx.device?.deviceKey
    );
  }

  async send(
    runtime: GroupRuntime,
    { pins, ranks }: PinChanges,
    request = false
  ): Promise<void> {
    if (this.ctx.options.readSync !== true) return;
    let first = true;
    const sendPage = async (page: Pick<PinSyncPayload, "pins" | "ranks">) => {
      if (!first) await sleep(this.ctx.scheduler, PAGE_SPACING_MS);
      await this.deps.send(
        runtime,
        encodeReadSync({
          v: 1,
          t: "pins",
          ...page,
          ...(request && first ? { request: true } : {}),
        })
      );
      first = false;
    };
    if (pins.length <= MIXED_PAGE_SIZE && ranks.length <= MIXED_PAGE_SIZE) {
      if (request || pins.length > 0 || ranks.length > 0) {
        await sendPage({ pins, ...(ranks.length ? { ranks } : {}) });
      }
      return;
    }
    for (let start = 0; start < pins.length; start += PINS_PER_PAYLOAD) {
      await sendPage({ pins: pins.slice(start, start + PINS_PER_PAYLOAD) });
    }
    for (let start = 0; start < ranks.length; start += PIN_RANKS_PER_PAYLOAD) {
      await sendPage({
        pins: [],
        ranks: ranks.slice(start, start + PIN_RANKS_PER_PAYLOAD),
      });
    }
  }

  /** Only current devices can read a snapshot. Share again when one joins. */
  exchange(runtime: GroupRuntime): void {
    const { g, members } = runtime.record;
    const previous = this.lastExchange;
    const sameRoster =
      previous?.group === g &&
      members.length === previous.deviceKeys.size &&
      members.every(({ deviceKey }) => previous.deviceKeys.has(deviceKey));
    if (
      this.ctx.options.readSync !== true ||
      sameRoster ||
      !this.hasSibling(runtime) ||
      !this.deps.targets().includes(runtime)
    ) {
      return;
    }
    const exchange = {
      group: g,
      deviceKeys: new Set(members.map(({ deviceKey }) => deviceKey)),
    };
    // Remember the roster before sending so the next pass sees changes
    // that happen during the exchange.
    this.lastExchange = exchange;
    this.run(async () => {
      try {
        await this.send(runtime, await this.snapshot(), true);
      } catch (error) {
        if (this.lastExchange === exchange) this.lastExchange = null;
        throw error;
      }
    });
  }

  private run(task: () => Promise<void>): void {
    void this.ctx.tasks.track(task().catch(() => undefined));
  }

  private async write(
    state: StoredConversationPins,
    groups: GroupRuntime[] = []
  ): Promise<void> {
    const device = this.ctx.device;
    if (!device || this.ctx.disposed) throw new E2eeError("E2EE_NOT_READY");
    const previous = device.conversationPins;
    device.conversationPins = state;
    try {
      await checkpoint(this.ctx, { device, groups, skipWasm: true });
    } catch (error) {
      if (previous) device.conversationPins = previous;
      else delete device.conversationPins;
      this.ctx.store.touch();
      throw error;
    }
  }
}
