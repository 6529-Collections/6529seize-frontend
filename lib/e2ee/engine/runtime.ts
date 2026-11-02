import type { E2eeScheduler, E2eeTimerHandle } from "../types";

/**
 * Serial operation queue: every WASM call and state mutation runs inside one
 * task at a time so MLS state never interleaves across awaits. Tasks must not
 * enqueue (and await) other tasks.
 */
export class SerialQueue {
  private tail: Promise<void> = Promise.resolve();
  private pending = 0;

  run<T>(task: () => Promise<T>): Promise<T> {
    this.pending += 1;
    const result = this.tail.then(task);
    this.tail = result.then(
      () => undefined,
      () => undefined
    );
    return result.finally(() => {
      this.pending -= 1;
    });
  }

  get size(): number {
    return this.pending;
  }

  async drain(): Promise<void> {
    while (this.pending > 0) {
      await this.tail;
    }
  }
}

/** Tracks background promises so tests (and dispose) can wait for them. */
export class TaskTracker {
  private readonly inFlight = new Set<Promise<unknown>>();

  track<T>(promise: Promise<T>): Promise<T> {
    this.inFlight.add(promise);
    void promise
      .catch(() => undefined)
      .finally(() => {
        this.inFlight.delete(promise);
      });
    return promise;
  }

  async drain(): Promise<void> {
    while (this.inFlight.size > 0) {
      await Promise.allSettled([...this.inFlight]);
    }
  }

  get size(): number {
    return this.inFlight.size;
  }
}

export function createDefaultScheduler(): E2eeScheduler {
  const timers = new Map<number, ReturnType<typeof setTimeout>>();
  let nextId = 1;
  return {
    setTimeout(fire, ms) {
      const id = nextId;
      nextId += 1;
      timers.set(
        id,
        globalThis.setTimeout(() => {
          timers.delete(id);
          fire();
        }, ms)
      );
      return { id };
    },
    clearTimeout(handle: E2eeTimerHandle) {
      const timer = timers.get(handle.id);
      if (timer !== undefined) {
        globalThis.clearTimeout(timer);
        timers.delete(handle.id);
      }
    },
  };
}

/** Named one-shot timers: re-arming a key replaces (or keeps) the old one. */
export class TimerSet {
  private readonly timers = new Map<string, E2eeTimerHandle>();
  private readonly scheduler: E2eeScheduler;
  private disposed = false;

  constructor(scheduler: E2eeScheduler) {
    this.scheduler = scheduler;
  }

  /** Arms `key` unless it is already armed (keepExisting) or replaces it. */
  arm(key: string, ms: number, fire: () => void, keepExisting = true): void {
    if (this.disposed) {
      return;
    }
    const existing = this.timers.get(key);
    if (existing) {
      if (keepExisting) {
        return;
      }
      this.scheduler.clearTimeout(existing);
    }
    const handle = this.scheduler.setTimeout(
      () => {
        this.timers.delete(key);
        if (!this.disposed) {
          fire();
        }
      },
      Math.max(0, ms)
    );
    this.timers.set(key, handle);
  }

  has(key: string): boolean {
    return this.timers.has(key);
  }

  cancel(key: string): void {
    const existing = this.timers.get(key);
    if (existing) {
      this.scheduler.clearTimeout(existing);
      this.timers.delete(key);
    }
  }

  /** Cancels every armed timer; unlike dispose(), later arms still run. */
  cancelAll(): void {
    for (const handle of this.timers.values()) {
      this.scheduler.clearTimeout(handle);
    }
    this.timers.clear();
  }

  dispose(): void {
    this.disposed = true;
    this.cancelAll();
  }
}

export const sleep = (scheduler: E2eeScheduler, ms: number): Promise<void> =>
  new Promise<void>((resolve) => {
    scheduler.setTimeout(resolve, ms);
  });
