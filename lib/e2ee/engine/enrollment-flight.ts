import type { E2eeEngineStatus } from "../types";
import type { EngineContext } from "./context";
import { enrollDevice, hasLoginGrant } from "./enroll";
import { errorMessage } from "./errors";
import { loadGroups, setStatus } from "./setup";

export const NEEDS_ENROLLMENT = "needs-enrollment" satisfies E2eeEngineStatus;

/** What enrollment needs from the engine around the device registration. */
interface EnrollmentHooks {
  /** 8.8: renews an enrolled device's grant when due (one prompt). */
  renew: () => Promise<void>;
  /** device-limit: lists the profile's devices for the limit screen. */
  loadDevicesAtLimit: () => Promise<void>;
  /** Refreshes /e2ee/me once the device is registered. */
  refreshMe: () => Promise<void>;
  /** Starts background sync for the enrolled device. */
  start: () => void;
}

/**
 * Device enrollment (NC8 sign-in grant and the separate grant prompt), run
 * single-flight: a caller that arrives during an enrollment waits for it
 * and reads the outcome from the status; only the starting caller sees its
 * error.
 */
export class EnrollmentFlight {
  /** The enrollment in progress; concurrent callers share its outcome. */
  private current: Promise<void> | null = null;

  constructor(
    private readonly ctx: EngineContext,
    private readonly hooks: EnrollmentHooks
  ) {}

  /**
   * NC8: the sign-in signature already granted this browser's MLS key, so
   * enrollment needs no wallet prompt; finish it now. If the server refuses
   * the sign-in grant, drop that device: enroll() then falls back to the
   * separate grant prompt with a fresh key.
   */
  async startFromLoginGrant(): Promise<void> {
    if (!(await this.takeLoginGrantDevice())) {
      return;
    }
    // Runs in the background so engine start never waits on the network;
    // the status is "enrolling" from here until it settles.
    void this.ctx.tasks.track(this.enrollFromLoginGrant());
  }

  /**
   * NC8: the gate's combined sign-in stored this browser's key while this
   * engine waited for enrollment (holding the engine lock). The sign-in
   * writes without a state version and keeps it, so this engine's next
   * write still passes its version check.
   */
  async withLoginGrant(): Promise<E2eeEngineStatus> {
    if (this.current) {
      // Another caller is already enrolling: report its final status, not
      // "enrolling".
      await this.current.catch(() => undefined);
    } else if (
      this.ctx.store.status === NEEDS_ENROLLMENT &&
      (await this.takeLoginGrantDevice())
    ) {
      await this.enrollFromLoginGrant();
    }
    return this.ctx.store.status;
  }

  /** Enrolls this device; `allowPrompt` permits the separate grant prompt. */
  run(allowPrompt: boolean): Promise<void> {
    if (this.current) {
      return this.current.catch(() => undefined);
    }
    const run = this.enrollOnce(allowPrompt).finally(() => {
      this.current = null;
    });
    this.current = run;
    return run;
  }

  /**
   * Whether storage holds an unregistered device a combined sign-in stored.
   * Any key this engine still holds from an earlier attempt is released,
   * so enrollment loads the stored device's own key state.
   */
  private takeLoginGrantDevice(): Promise<boolean> {
    return this.ctx.queue.run(async () => {
      const stored = await this.ctx.storage.getDevice(this.ctx.profileId);
      if (!hasLoginGrant(stored) || stored.registered) {
        return false;
      }
      if (this.ctx.device?.deviceKey !== stored.deviceKey) {
        this.ctx.mls?.dispose();
        this.ctx.mls = null;
        this.ctx.device = null;
        this.ctx.lastState = null;
      }
      return true;
    });
  }

  private async enrollFromLoginGrant(): Promise<void> {
    try {
      await this.run(false);
    } catch {
      // A rejected sign-in grant was dropped: enroll() asks for the separate
      // grant signature. Any other failure leaves the pending device, and
      // enroll() retries it without a prompt.
      if (!this.ctx.disposed && this.ctx.store.status === "error") {
        setStatus(this.ctx, NEEDS_ENROLLMENT, this.ctx.store.error);
      }
    }
  }

  private async enrollOnce(allowPrompt: boolean): Promise<void> {
    const status = this.ctx.store.status;
    if (status === "ready") {
      if (allowPrompt) {
        await this.hooks.renew();
      }
      return;
    }
    if (status === "enrolling" || status === "unsupported") {
      return;
    }
    setStatus(this.ctx, "enrolling");
    try {
      // enrollDevice first checks the stored device's suite and retires an
      // earlier-suite device (D172): inside this single flight and the
      // queue, so concurrent callers never retire or enroll twice.
      const ready = await this.ctx.queue.run(() =>
        enrollDevice(this.ctx, { allowPrompt })
      );
      if (!ready) {
        if (this.ctx.store.status === "enrolling") {
          // Nothing to enroll without a prompt (sign-in grant path).
          setStatus(this.ctx, NEEDS_ENROLLMENT);
          return;
        }
        // device-limit: list the profile's devices so the screen can show them.
        await this.hooks.loadDevicesAtLimit();
        return;
      }
      await loadGroups(this.ctx);
      // The new device is on the current suite: the move is done (D172).
      this.ctx.store.upgrade = null;
      setStatus(this.ctx, "ready");
      try {
        await this.hooks.refreshMe();
      } catch {
        // Retried by the background pass.
      }
      this.hooks.start();
    } catch (error) {
      const code = errorMessage(error);
      setStatus(
        this.ctx,
        code === "E2EE_SIGNATURE_REJECTED" ||
          code === "E2EE_SIGNATURE_FAILED" ||
          code === "E2EE_LOGIN_GRANT_REJECTED"
          ? NEEDS_ENROLLMENT
          : "error",
        code
      );
      throw error;
    }
  }
}
