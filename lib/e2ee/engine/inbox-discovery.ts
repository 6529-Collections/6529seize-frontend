import type { ApiE2eeDeviceInboxStatus } from "@/generated/models/ApiE2eeDeviceInboxStatus";
import { asE2eeApiError } from "../api-errors";
import {
  E2EE_INITIAL_INBOX_WAIT_MS,
  type E2eeInitialSyncStatus,
} from "../types";
import { type EngineContext, ownDeviceKey } from "./context";
import { requestWithDeadline } from "./runtime";

const WAIT_TIMER = "initial-inbox-wait";
const AWAITING_INVITATION = "awaiting-invitation";

function statusFromResponse({
  has_pending_chats: pending,
  has_queued_welcomes: queued,
}: ApiE2eeDeviceInboxStatus): E2eeInitialSyncStatus {
  // Legacy replies only provide the combined hint. Require an explicit
  // false to interpret a positive hint as a roster gap alone.
  if (queued === true || (pending && queued === undefined)) return "pending";
  return pending ? "waiting" : "complete";
}

interface InboxDiscoveryHooks {
  readonly isReady: () => boolean;
  readonly onOwnRevoked: () => Promise<void>;
}

/** Tracks the first inbox check separately from ongoing Welcome delivery. */
export class InboxDiscovery {
  constructor(
    private readonly ctx: EngineContext,
    private readonly hooks: InboxDiscoveryHooks
  ) {}

  private get status(): E2eeInitialSyncStatus {
    return this.ctx.store.initialSyncStatus;
  }

  private get settled(): boolean {
    return this.status === "complete" || this.status === AWAITING_INVITATION;
  }

  private publish(status: E2eeInitialSyncStatus): void {
    if (this.status === status) return;
    this.ctx.store.initialSyncStatus = status;
    this.ctx.store.touch();
  }

  begin(recheck: boolean): void {
    if (recheck && this.status === AWAITING_INVITATION) {
      // Recheck once without restarting the grace period for a roster gap.
      this.publish("delayed");
    } else if (this.status === "failed" || this.status === "pending") {
      this.update("pending");
    }
  }

  update(status: E2eeInitialSyncStatus): void {
    if (!this.hooks.isReady() || this.settled) return;
    if (this.status === "delayed" && status === "pending") return;
    const next =
      this.status === "delayed" && status === "waiting"
        ? AWAITING_INVITATION
        : status;
    if (next === "pending" || next === "waiting") {
      this.ctx.timers.arm(WAIT_TIMER, E2EE_INITIAL_INBOX_WAIT_MS, () => {
        this.update(
          this.status === "waiting" ? AWAITING_INVITATION : "delayed"
        );
      });
    } else {
      this.stop();
    }
    this.publish(next);
  }

  stop(): void {
    this.ctx.timers.cancel(WAIT_TIMER);
  }

  async confirm(): Promise<void> {
    if (!this.hooks.isReady() || this.settled) return;
    // A usable inbox has no need for empty-state confirmation after the wait.
    if (this.status === "delayed" && this.ctx.store.getConversations().length) {
      return;
    }
    const deviceKey = ownDeviceKey(this.ctx);
    const isCurrent = () =>
      this.hooks.isReady() && this.ctx.device?.deviceKey === deviceKey;
    try {
      const response = await requestWithDeadline(
        this.ctx.scheduler,
        E2EE_INITIAL_INBOX_WAIT_MS,
        (signal) => this.ctx.api.getDeviceInboxStatus(deviceKey, signal)
      );
      if (isCurrent()) this.update(statusFromResponse(response));
    } catch (error) {
      if (!isCurrent()) return;
      if (asE2eeApiError(error)?.code === "E2EE_NOT_YOUR_DEVICE") {
        await this.hooks.onOwnRevoked();
      }
      if (isCurrent()) this.update("failed");
    }
  }
}
