import { focusManager } from "@tanstack/react-query";

type PendingLookup = {
  start: () => Promise<void>;
  cancel: () => void;
};

// Chat can mount dozens of drops at once. Reserve API capacity for navigation,
// metadata and messages instead of starting one context request per card at once.
const LOOKUP_START_INTERVAL_MS = 250;
const MAX_CONCURRENT_LOOKUPS = 2;

export function createCompetitionContextScheduler() {
  const pending = new Set<PendingLookup>();
  let active = 0;
  let nextStartAt = 0;
  let timer: ReturnType<typeof setTimeout> | undefined;
  let paused = false;

  function pump() {
    if (paused || pending.size === 0) {
      clearTimeout(timer);
      timer = undefined;
      return;
    }
    if (active >= MAX_CONCURRENT_LOOKUPS || timer !== undefined) return;

    const delay = Math.max(0, nextStartAt - performance.now());
    if (delay > 0) {
      timer = setTimeout(() => {
        timer = undefined;
        pump();
      }, delay);
      return;
    }

    const lookup = pending.values().next().value;
    if (!lookup) return;
    pending.delete(lookup);
    active++;
    nextStartAt = performance.now() + LOOKUP_START_INTERVAL_MS;
    void lookup.start().finally(() => {
      active--;
      pump();
    });
    pump();
  }

  function schedule<T>(
    request: () => Promise<T>,
    signal?: AbortSignal
  ): Promise<T> {
    if (signal?.aborted) return Promise.reject(signal.reason);

    return new Promise<T>((resolve, reject) => {
      const lookup: PendingLookup = {
        start: async () => {
          signal?.removeEventListener("abort", lookup.cancel);
          try {
            resolve(await request());
          } catch (error) {
            reject(error);
          }
        },
        cancel: () => {
          pending.delete(lookup);
          signal?.removeEventListener("abort", lookup.cancel);
          reject(signal?.reason);
          pump();
        },
      };
      signal?.addEventListener("abort", lookup.cancel, { once: true });
      pending.add(lookup);
      pump();
    });
  }

  return {
    schedule,
    setPaused(value: boolean) {
      paused = value;
      pump();
    },
  };
}

let dropContextScheduler:
  | ReturnType<typeof createCompetitionContextScheduler>
  | undefined;

/** Bind focus only when a context lookup is actually requested, not on import. */
export function scheduleDropCompetitionContext<T>(
  request: () => Promise<T>,
  signal?: AbortSignal
): Promise<T> {
  if (!dropContextScheduler) {
    const scheduler = createCompetitionContextScheduler();
    scheduler.setPaused(!focusManager.isFocused());
    focusManager.subscribe((focused) => scheduler.setPaused(!focused));
    dropContextScheduler = scheduler;
  }
  return dropContextScheduler.schedule(request, signal);
}
