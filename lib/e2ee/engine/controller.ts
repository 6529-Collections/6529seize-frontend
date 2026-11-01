import { asE2eeApiError } from "../api";
import type { ApiE2eeDeviceGroup } from "../api-types";
import { type EngineContext, isActive, ownDeviceKey } from "./context";
import { RetryableError } from "./errors";
import {
  groupChanges,
  noteStallFor,
  clearStallFor,
  otherAddDelayMs,
  repairRoster,
  requiredChangesPlanner,
  rosterDelayMs,
  runGroupCommit,
  STALL_RETRY_MS,
} from "./maintenance";
import { sleep } from "./runtime";
import { sendNext } from "./send";
import { processInbox, tryCatchUp } from "./sync";

/** Orchestration: sync passes, maintenance, outbox flushing, timers, wakes. */

export const POLL_OPEN_MS = 5_000;
const POLL_IDLE_MS = 30_000;
const MAINTAIN_EVERY_MS = 10 * 60_000;
const WAKE_DEBOUNCE_MS = 50;
const WS_QUIET_MS = 60_000;

const isNetworkish = (error: unknown): boolean => {
  if (error instanceof RetryableError) {
    return true;
  }
  const apiError = asE2eeApiError(error);
  return (
    apiError !== null &&
    (apiError.status === 0 || apiError.status >= 500 || apiError.status === 429)
  );
};

const swallowNetwork = async (task: Promise<unknown>): Promise<void> => {
  try {
    await task;
  } catch (error) {
    if (!isNetworkish(error)) {
      throw error;
    }
  }
};

interface ControllerHooks {
  /** Refreshes /e2ee/me (devices + KeyPackage pool). */
  refreshMe: () => Promise<void>;
  /** Called when the server reports this device revoked. */
  onOwnRevoked: () => Promise<void>;
  /** Called after every sync pass (e.g. resolve new members' profiles). */
  afterSync: () => Promise<void>;
}

export class EngineController {
  private readonly ctx: EngineContext;
  private readonly hooks: ControllerHooks;
  private syncRun: Promise<void> | null = null;
  private syncAgain = false;
  private readonly flushes = new Map<string, Promise<void>>();
  private readonly flushAgain = new Set<string>();
  private readonly maintainedAt = new Map<string, number>();
  private lastFullSyncAt = 0;
  private unsubscribeWake: (() => void) | null = null;

  constructor(ctx: EngineContext, hooks: ControllerHooks) {
    this.ctx = ctx;
    this.hooks = hooks;
  }

  private isReady(): boolean {
    return (
      !this.ctx.disposed &&
      this.ctx.store.status === "ready" &&
      this.ctx.mls !== null
    );
  }

  private syncRepeat(): boolean {
    return this.syncAgain && this.isReady();
  }

  /** Background work is tracked (idle()) and never throws. */
  private background(task: () => Promise<unknown>): void {
    const promise = (async () => {
      try {
        await task();
      } catch (error) {
        if (!this.ctx.disposed) {
          this.ctx.store.error =
            error instanceof Error ? error.message : "E2EE_BACKGROUND";
          this.ctx.store.touch();
        }
      }
    })();
    void this.ctx.tasks.track(promise);
  }

  // -------------------------------------------------------------------------
  // Sync
  // -------------------------------------------------------------------------

  syncAll(): Promise<void> {
    if (this.syncRun) {
      this.syncAgain = true;
      return this.syncRun;
    }
    const run = (async () => {
      do {
        this.syncAgain = false;
        await this.syncOnce();
      } while (this.syncRepeat());
    })().finally(() => {
      this.syncRun = null;
    });
    this.syncRun = run;
    return this.ctx.tasks.track(run);
  }

  private async deviceGroups(): Promise<ApiE2eeDeviceGroup[] | null> {
    try {
      return await this.ctx.api.getDeviceGroups(ownDeviceKey(this.ctx));
    } catch (error) {
      const apiError = asE2eeApiError(error);
      if (apiError?.code === "E2EE_NOT_YOUR_DEVICE") {
        await this.hooks.onOwnRevoked();
        return null;
      }
      if (isNetworkish(error)) {
        return null;
      }
      throw error;
    }
  }

  private async syncOnce(): Promise<void> {
    if (!this.isReady()) {
      return;
    }
    this.lastFullSyncAt = this.ctx.now();
    await this.pullInbox();
    if (!this.isReady()) {
      return;
    }
    const serverGroups = await this.deviceGroups();
    if (!this.isReady()) {
      return;
    }
    const lastSeq = new Map(
      (serverGroups ?? []).map((item) => [
        item.group.toLowerCase(),
        item.last_seq,
      ])
    );
    for (const [g, runtime] of [...this.ctx.store.groups]) {
      if (!isActive(runtime)) {
        continue;
      }
      const known = lastSeq.get(g);
      const behind = known === undefined || known > runtime.record.cursor;
      await this.guard(
        this.syncGroup(g, { fetch: behind || serverGroups === null })
      );
    }
    if (this.ctx.now() - this.ctx.lastMeAt >= MAINTAIN_EVERY_MS) {
      await this.guard(this.hooks.refreshMe());
    }
    await this.guard(this.hooks.afterSync());
  }

  /** One group's (or the pool's) failure must not stop the whole pass. */
  private async guard(task: Promise<unknown>): Promise<void> {
    try {
      await task;
    } catch (error) {
      if (this.ctx.disposed) {
        return;
      }
      this.ctx.store.error =
        error instanceof Error ? error.message : "E2EE_SYNC";
      this.ctx.store.touch();
    }
  }

  private async pullInbox(): Promise<void> {
    if (!this.isReady()) {
      return;
    }
    try {
      await swallowNetwork(this.ctx.queue.run(() => processInbox(this.ctx)));
    } catch (error) {
      // Revoked from another device before its WS hint arrived: the inbox is
      // the first own-device call of a pass, so handle it here, not as an error.
      if (asE2eeApiError(error)?.code === "E2EE_NOT_YOUR_DEVICE") {
        await this.hooks.onOwnRevoked();
        return;
      }
      throw error;
    }
  }

  /** Catch up one group, then run due maintenance and flush its outbox. */
  async syncGroup(
    g: string,
    options: { fetch: boolean } = { fetch: true }
  ): Promise<void> {
    const runtime = this.ctx.store.groups.get(g);
    if (!this.isReady() || !isActive(runtime)) {
      return;
    }
    const changed = options.fetch
      ? await this.ctx.queue.run(() => tryCatchUp(this.ctx, runtime))
      : false;
    const due =
      changed ||
      runtime.record.selfUpdateRequested ||
      runtime.record.rosterCheckNeeded ||
      this.ctx.now() - (this.maintainedAt.get(g) ?? 0) >= MAINTAIN_EVERY_MS;
    if (due && isActive(runtime)) {
      await this.maintain(g);
    }
    if (runtime.outbox.size > 0 && isActive(runtime)) {
      await this.flush(g);
    }
  }

  // -------------------------------------------------------------------------
  // Maintenance (8.2, 8.4, 8.5)
  // -------------------------------------------------------------------------

  private armRetry(g: string): void {
    this.ctx.timers.arm(`retry:${g}`, STALL_RETRY_MS, () => {
      this.background(async () => {
        await this.maintain(g);
        await this.flush(g);
      });
    });
  }

  async maintain(g: string): Promise<void> {
    const runtime = this.ctx.store.groups.get(g);
    if (!this.isReady() || !isActive(runtime)) {
      return;
    }
    this.maintainedAt.set(g, this.ctx.now());
    await runGroupCommit(
      this.ctx,
      g,
      requiredChangesPlanner({
        ctx: this.ctx,
        includeOtherAdds: false,
        allowSelfUpdate: true,
      }),
      () => {
        this.armRetry(g);
      }
    );
    await this.scheduleFollowUps(g);
  }

  private async scheduleFollowUps(g: string): Promise<void> {
    const runtime = this.ctx.store.groups.get(g);
    if (!this.isReady() || !isActive(runtime)) {
      return;
    }
    let otherAdds = 0;
    try {
      const changes = await this.ctx.queue.run(() =>
        groupChanges(this.ctx, runtime, { onlyOwnAdds: false })
      );
      otherAdds = changes.otherAdds.length;
    } catch (error) {
      if (!isNetworkish(error)) {
        throw error;
      }
    }
    if (otherAdds > 0) {
      this.ctx.timers.arm(`adds:${g}`, otherAddDelayMs(this.ctx), () => {
        this.background(() => this.addOtherDevices(g));
      });
    }
    if (runtime.record.rosterCheckNeeded) {
      this.ctx.timers.arm(`roster:${g}`, rosterDelayMs(this.ctx), () => {
        this.background(() => this.rosterCheck(g));
      });
    }
  }

  /** 8.4: other members' devices after the random delay, re-checked. */
  async addOtherDevices(g: string): Promise<void> {
    if (!this.isReady()) {
      return;
    }
    await runGroupCommit(
      this.ctx,
      g,
      requiredChangesPlanner({
        ctx: this.ctx,
        includeOtherAdds: true,
        allowSelfUpdate: false,
      }),
      () => {
        this.armRetry(g);
      }
    );
    const runtime = this.ctx.store.groups.get(g);
    if (runtime?.record.rosterCheckNeeded) {
      this.ctx.timers.arm(`roster:${g}`, rosterDelayMs(this.ctx), () => {
        this.background(() => this.rosterCheck(g));
      });
    }
  }

  async rosterCheck(g: string): Promise<void> {
    const runtime = this.ctx.store.groups.get(g);
    if (!this.isReady() || !isActive(runtime)) {
      return;
    }
    await swallowNetwork(
      this.ctx.queue.run(async () => {
        await tryCatchUp(this.ctx, runtime);
        if (isActive(runtime)) {
          await repairRoster(this.ctx, runtime);
        }
      })
    );
  }

  // -------------------------------------------------------------------------
  // Outbox (8.3)
  // -------------------------------------------------------------------------

  flush(g: string): Promise<void> {
    const running = this.flushes.get(g);
    if (running) {
      this.flushAgain.add(g);
      return running;
    }
    const run = (async () => {
      do {
        this.flushAgain.delete(g);
        await this.flushOnce(g);
      } while (this.flushAgain.has(g) && this.isReady());
    })().finally(() => {
      this.flushes.delete(g);
    });
    this.flushes.set(g, run);
    return this.ctx.tasks.track(run);
  }

  private async flushOnce(g: string): Promise<void> {
    let attempt = 0;
    while (this.isReady()) {
      const runtime = this.ctx.store.groups.get(g);
      if (!isActive(runtime) || runtime.outbox.size === 0) {
        return;
      }
      const commit = await runGroupCommit(
        this.ctx,
        g,
        requiredChangesPlanner({
          ctx: this.ctx,
          includeOtherAdds: false,
          allowSelfUpdate: false,
        }),
        () => {
          this.armRetry(g);
        }
      );
      if (commit.kind === "delayed") {
        return;
      }
      const step = await this.ctx.queue.run(() => sendNext(this.ctx, runtime));
      if (step === "failed") {
        if (noteStallFor(this.ctx, runtime)) {
          this.armRetry(g);
          return;
        }
        await sleep(
          this.ctx.scheduler,
          Math.min(STALL_RETRY_MS, 250 * 2 ** attempt)
        );
        attempt += 1;
        continue;
      }
      clearStallFor(this.ctx, runtime);
      attempt = 0;
      if (step === "empty" || step === "inactive") {
        return;
      }
    }
  }

  // -------------------------------------------------------------------------
  // Wake events (5) and polling
  // -------------------------------------------------------------------------

  startBackground(): void {
    const subscribe = this.ctx.options.onWake;
    if (subscribe && !this.unsubscribeWake) {
      this.unsubscribeWake = subscribe((event) => {
        this.onWake(event);
      });
    }
    this.armPoll();
  }

  /** Stops wake events and polling; startBackground() resumes both. */
  stopBackground(): void {
    this.unsubscribeWake?.();
    this.unsubscribeWake = null;
    this.ctx.timers.cancel("poll");
  }

  /**
   * Re-arms the poll timer now, at the cadence for the current state. Called
   * when a conversation opens so its 5 s polling starts at once instead of
   * after the idle 30 s timer armed earlier.
   */
  restartPolling(): void {
    if (this.isReady()) {
      this.armPoll();
    }
  }

  private armPoll(): void {
    // Not ready (wiped, expired, disposed): a poll in flight does not re-arm.
    if (this.ctx.options.polling === false || !this.isReady()) {
      return;
    }
    const wsQuiet = this.ctx.now() - this.ctx.lastWakeAt > WS_QUIET_MS;
    const open = this.openConversation();
    const ms = open && wsQuiet ? POLL_OPEN_MS : POLL_IDLE_MS;
    this.ctx.timers.arm(
      "poll",
      ms,
      () => {
        this.background(async () => {
          try {
            await this.pollOnce(open);
          } finally {
            this.armPoll();
          }
        });
      },
      false
    );
  }

  private openConversation(): string | null {
    const g = this.ctx.openConversation;
    return g !== null && this.ctx.now() <= this.ctx.openUntil ? g : null;
  }

  private async pollOnce(open: string | null): Promise<void> {
    if (!this.isReady()) {
      return;
    }
    if (open && this.ctx.now() - this.lastFullSyncAt < POLL_IDLE_MS) {
      await this.syncGroup(open);
      return;
    }
    await this.syncAll();
  }

  private debounce(key: string, task: () => Promise<unknown>): void {
    this.ctx.timers.arm(key, WAKE_DEBOUNCE_MS, () => {
      this.background(task);
    });
  }

  onWake(event: { type: string; data: unknown }): void {
    if (!this.isReady()) {
      return;
    }
    this.ctx.lastWakeAt = this.ctx.now();
    const data = (
      typeof event.data === "object" && event.data !== null ? event.data : {}
    ) as Record<string, unknown>;
    const group =
      typeof data["group"] === "string" ? data["group"].toLowerCase() : null;
    const profileId =
      typeof data["profile_id"] === "string" ? data["profile_id"] : null;
    const deviceKey =
      typeof data["device_key"] === "string"
        ? data["device_key"].toLowerCase()
        : null;
    switch (event.type) {
      case "E2EE_GROUP_EVENT":
      case "E2EE_ROSTER_CHANGED":
        if (group) {
          this.debounce(`sync:${group}`, () => this.syncGroup(group));
        }
        break;
      case "E2EE_WELCOME":
        this.debounce("inbox", () => this.syncAll());
        break;
      case "E2EE_DEVICE_ADDED":
      case "E2EE_DEVICE_REVOKED":
        if (profileId && deviceKey) {
          this.onDeviceEvent(
            event.type === "E2EE_DEVICE_REVOKED",
            profileId,
            deviceKey
          );
        }
        break;
      default:
        break;
    }
  }

  /**
   * Device added/revoked (5): invalidates caches and flags the affected
   * groups. Returns those groups; schedules their maintenance unless the
   * caller runs it (`schedule` false).
   */
  onDeviceEvent(
    revoked: boolean,
    profileId: string,
    deviceKey: string,
    schedule = true
  ): string[] {
    this.ctx.directory.invalidateProfile(profileId);
    this.ctx.directory.invalidateDevice(deviceKey);
    if (revoked && deviceKey === this.ctx.device?.deviceKey) {
      this.background(() => this.hooks.onOwnRevoked());
      return [];
    }
    if (profileId === this.ctx.profileId && schedule) {
      this.background(() => this.hooks.refreshMe());
    }
    const affected: string[] = [];
    for (const [g, runtime] of this.ctx.store.groups) {
      const member = runtime.record.members.some(
        (leaf) => leaf.profileId === profileId
      );
      if (!isActive(runtime) || !member) {
        continue;
      }
      if (revoked && profileId === this.ctx.profileId) {
        runtime.record.selfUpdateRequested = true;
      }
      affected.push(g);
      if (schedule) {
        this.debounce(`maintain:${g}`, () => this.maintain(g));
      }
    }
    return affected;
  }
}
