const IDLE_DEADLINE_MS = 5000;
const FALLBACK_DELAY_MS = 3000;

// Runs low-priority work once the browser is idle. Safari and the iOS app
// webview have no requestIdleCallback, so they fall back to a short delay.
// Call it from an effect so it only ever runs after hydration.
export function runWhenIdle(task: () => void): void {
  if (typeof globalThis.requestIdleCallback === "function") {
    globalThis.requestIdleCallback(() => task(), {
      timeout: IDLE_DEADLINE_MS,
    });
    return;
  }

  globalThis.setTimeout(task, FALLBACK_DELAY_MS);
}
