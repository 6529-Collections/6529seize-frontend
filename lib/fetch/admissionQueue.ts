type AdmissionQueueOptions = {
  /** Callers admitted at once; defaults to one. */
  readonly concurrency?: number | undefined;
  readonly maxPending: number;
  readonly waitMs: number;
};

type AdmissionFailureKind = "full" | "timeout" | "aborted";
type ReleaseAdmission = () => void;
type PendingAdmission = {
  readonly expiresAt: number;
  readonly grant: () => void;
  readonly fail: (kind: AdmissionFailureKind) => void;
};

export class AdmissionQueueError extends Error {
  readonly kind: AdmissionFailureKind;

  constructor(kind: AdmissionFailureKind) {
    super("Resource admission unavailable.");
    this.name = "AdmissionQueueError";
    this.kind = kind;
  }
}

/**
 * Bounds resource-heavy work without starting downloads for queued callers:
 * at most `concurrency` callers run at once, and at most `maxPending` wait.
 */
export class AdmissionQueue {
  private active = 0;
  private readonly pending: PendingAdmission[] = [];
  private readonly concurrency: number;
  private readonly maxPending: number;
  private readonly waitMs: number;

  constructor({ concurrency = 1, maxPending, waitMs }: AdmissionQueueOptions) {
    if (!Number.isSafeInteger(concurrency) || concurrency < 1) {
      throw new RangeError("concurrency must be a positive safe integer.");
    }
    if (!Number.isSafeInteger(maxPending) || maxPending < 0) {
      throw new RangeError("maxPending must be a nonnegative safe integer.");
    }
    if (!Number.isSafeInteger(waitMs) || waitMs < 1 || waitMs > 2_147_483_647) {
      throw new RangeError(
        "waitMs must be a positive supported timer duration."
      );
    }
    this.concurrency = concurrency;
    this.maxPending = maxPending;
    this.waitMs = waitMs;
  }

  acquire(signal?: AbortSignal): Promise<ReleaseAdmission> {
    if (signal?.aborted) {
      return Promise.reject(new AdmissionQueueError("aborted"));
    }
    if (this.active < this.concurrency) {
      this.active += 1;
      return Promise.resolve(this.createRelease());
    }
    if (this.pending.length >= this.maxPending) {
      return Promise.reject(new AdmissionQueueError("full"));
    }

    return new Promise((resolve, reject) => {
      const pending: PendingAdmission = {
        expiresAt: Date.now() + this.waitMs,
        grant: () => {
          cleanup();
          resolve(this.createRelease());
        },
        fail: (kind) => {
          cleanup();
          reject(new AdmissionQueueError(kind));
        },
      };
      const timeout = setTimeout(() => {
        this.removePending(pending, "timeout");
      }, this.waitMs);
      const onAbort = () => this.removePending(pending, "aborted");
      const cleanup = () => {
        clearTimeout(timeout);
        signal?.removeEventListener("abort", onAbort);
      };
      this.pending.push(pending);
      signal?.addEventListener("abort", onAbort, { once: true });
    });
  }

  private removePending(
    pending: PendingAdmission,
    kind: AdmissionFailureKind
  ): void {
    const index = this.pending.indexOf(pending);
    if (index !== -1) {
      this.pending.splice(index, 1);
      pending.fail(kind);
    }
  }

  private createRelease(): ReleaseAdmission {
    let released = false;
    return () => {
      if (released) {
        return;
      }
      released = true;

      let pending = this.pending.shift();
      while (pending) {
        // Enforce the deadline even if a busy event loop delayed its timer.
        if (pending.expiresAt <= Date.now()) {
          pending.fail("timeout");
          pending = this.pending.shift();
          continue;
        }
        // The released slot passes straight to the next caller.
        pending.grant();
        return;
      }
      this.active -= 1;
    };
  }
}
