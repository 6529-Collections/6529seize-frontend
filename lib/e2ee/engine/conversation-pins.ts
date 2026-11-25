import {
  isConversationPin,
  mergeConversationPins,
  type ConversationPin,
} from "../conversation-pins";
import { getConversationThreadKey } from "../dm-conversations";
import { newReadSyncId } from "../read-sync-payload";
import type { StoredConversationPins } from "../records";
import { checkpoint, type EngineContext } from "./context";
import { E2eeError } from "./errors";
import type { GroupRuntime } from "./store";

const EMPTY: StoredConversationPins = { versions: {}, unsent: [] };

/** Per-profile inbox preferences persisted with this encryption device. */
export class ConversationPins {
  constructor(private readonly ctx: EngineContext) {}

  private get state(): StoredConversationPins {
    return this.ctx.device?.conversationPins ?? EMPTY;
  }

  isPinned = (thread: string): boolean =>
    this.state.versions[thread]?.[3] === true;

  snapshot(): ConversationPin[] {
    return Object.values(this.state.versions);
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

  set(g: string, pinned: boolean): Promise<boolean> {
    return this.ctx.queue.run(async () => {
      const conversation = this.ctx.store.getConversation(g);
      if (!conversation) throw new E2eeError("E2EE_CONVERSATION_INACTIVE");
      const thread = getConversationThreadKey(conversation, this.ctx.profileId);
      if (this.isPinned(thread) === pinned) return false;
      const current = this.state.versions[thread];
      const update: ConversationPin = [
        thread,
        (current?.[1] ?? 0) + 1,
        newReadSyncId(),
        pinned,
      ];
      if (!isConversationPin(update)) throw new E2eeError("E2EE_PIN_INVALID");
      await this.merge([update]);
      return true;
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
  }

  /** Keep the update beside the cursor until both can be saved to disk. */
  receive(runtime: GroupRuntime, pins: readonly ConversationPin[]): void {
    if (pins.length === 0) return;
    runtime.record.receivedPins = mergeConversationPins(
      runtime.record.receivedPins ?? {},
      pins
    );
  }

  apply(): Promise<void> {
    return this.ctx.queue.run(async () => {
      const received = [...this.ctx.store.groups.values()].flatMap(
        (runtime) => {
          const pins = runtime.record.receivedPins;
          return pins ? [{ runtime, pins }] : [];
        }
      );
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
      throw error;
    }
  }
}
