import type { DesktopUpdater } from "@/types/desktop-shell";

export type DesktopUpdateCheckResult = "current" | "available" | "failed";

// The Desktop host allows up to two minutes for release-feed requests.
const UPDATE_CHECK_TIMEOUT_MS = 125_000;
const pendingChecks = new WeakMap<
  DesktopUpdater,
  Promise<DesktopUpdateCheckResult>
>();

/** Startup and manual checks share one request because replies are broadcast. */
export function checkDesktopUpdates(
  updater: DesktopUpdater
): Promise<DesktopUpdateCheckResult> {
  const pending = pendingChecks.get(updater);
  if (pending) return pending;

  const check = new Promise<DesktopUpdateCheckResult>((resolve) => {
    function finish(result: DesktopUpdateCheckResult) {
      clearTimeout(timeout);
      updater.offUpdateAvailable(onAvailable);
      updater.offUpdateNotAvailable(onNotAvailable);
      updater.offUpdateError(onError);
      resolve(result);
    }
    const onAvailable = () => finish("available");
    const onNotAvailable = () => finish("current");
    const onError = () => finish("failed");
    const timeout = setTimeout(onError, UPDATE_CHECK_TIMEOUT_MS);

    updater.onUpdateAvailable(onAvailable);
    updater.onUpdateNotAvailable(onNotAvailable);
    updater.onUpdateError(onError);
    try {
      updater.checkUpdates();
    } catch {
      onError();
    }
  }).finally(() => {
    pendingChecks.delete(updater);
  });
  pendingChecks.set(updater, check);
  return check;
}
