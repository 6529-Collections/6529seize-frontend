import {
  isConversationPin,
  mergeConversationPins,
  type ConversationPin,
} from "../conversation-pins";
import { getConversationThreadKey } from "../dm-conversations";
import {
  encodeReadSync,
  newReadSyncId,
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
const PAGE_SPACING_MS = 100;

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

  isPinned = (thread: string): boolean =>
    this.state.versions[thread]?.[3] === true;

  private snapshot(): Promise<ConversationPin[]> {
    return this.ctx.queue.run(() =>
      Promise.resolve(Object.values(this.versionsWithReceivedPins()))
    );
  }

  /** Include decisions already received while their local apply is queued. */
  private versionsWithReceivedPins() {
    const received = this.receivedBatches().flatMap(({ pins }) =>
      Object.values(pins)
    );
    return mergeConversationPins(this.state.versions, received);
  }

  private receivedBatches() {
    return [...this.ctx.store.groups.values()].flatMap((runtime) => {
      const pins = runtime.record.receivedPins;
      return pins ? [{ runtime, pins }] : [];
    });
  }

  pending(): ConversationPin[] {
    const { versions, unsent } = this.state;
    return unsent.flatMap((thread) => {
      const pin = versions[thread];
      return pin ? [pin] : [];
    });
  }

  hasPending(): boolean {
    return this.state.unsent.length > 0;
  }

  set(g: string, pinned: boolean): Promise<void> {
    return this.ctx.queue.run(async () => {
      if (this.ctx.store.status !== "ready" || !this.ctx.mls) {
        throw new E2eeError("E2EE_NOT_READY");
      }
      const conversation = this.ctx.store.getConversation(g.toLowerCase());
      if (!conversation) throw new E2eeError("E2EE_CONVERSATION_INACTIVE");
      const thread = getConversationThreadKey(conversation, this.ctx.profileId);
      const current = this.versionsWithReceivedPins()[thread];
      if ((current?.[3] === true) === pinned) return;
      const update: ConversationPin = [
        thread,
        (current?.[1] ?? 0) + 1,
        newReadSyncId(),
        pinned,
      ];
      if (!isConversationPin(update)) throw new E2eeError("E2EE_PIN_INVALID");
      await this.merge([update]);
    });
  }

  /** Called inside the queue, including when restoring an encrypted backup. */
  async merge(updates: readonly ConversationPin[]): Promise<void> {
    const state = this.state;
    const versions = mergeConversationPins(state.versions, updates);
    if (versions === state.versions) return;
    const unsent = [
      ...new Set([...state.unsent, ...updates.map(([thread]) => thread)]),
    ];
    await this.write({ versions, unsent });
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

    if (payload.pins.length > 0) {
      // Keep the update beside the cursor until both can be saved to disk.
      runtime.record.receivedPins = mergeConversationPins(
        runtime.record.receivedPins ?? {},
        payload.pins
      );
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
      const updates = received.flatMap(({ pins }) => Object.values(pins));
      const state = this.state;
      const versions = mergeConversationPins(state.versions, updates);
      for (const { runtime } of received) delete runtime.record.receivedPins;
      try {
        await this.write(
          { versions, unsent: state.unsent },
          received.map(({ runtime }) => runtime)
        );
      } catch (error) {
        for (const { runtime, pins } of received) {
          runtime.record.receivedPins = pins;
        }
        throw error;
      }
      if (versions !== state.versions) this.ctx.store.touch();
    });
  }

  acknowledge(sent: readonly ConversationPin[]): Promise<void> {
    return this.ctx.queue.run(async () => {
      const state = this.state;
      const sentIds = new Set(sent.map((update) => update[2]));
      const unsent = state.unsent.filter(
        (thread) => !sentIds.has(state.versions[thread]?.[2] ?? "")
      );
      if (unsent.length !== state.unsent.length) {
        await this.write({ ...state, unsent });
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
    pins: readonly ConversationPin[],
    request = false
  ): Promise<void> {
    if (this.ctx.options.readSync !== true) return;
    const count = request ? Math.max(1, pins.length) : pins.length;
    for (let start = 0; start < count; start += PINS_PER_PAYLOAD) {
      if (start > 0) await sleep(this.ctx.scheduler, PAGE_SPACING_MS);
      await this.deps.send(
        runtime,
        encodeReadSync({
          v: 1,
          t: "pins",
          pins: pins.slice(start, start + PINS_PER_PAYLOAD),
          ...(request && start === 0 ? { request: true } : {}),
        })
      );
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
