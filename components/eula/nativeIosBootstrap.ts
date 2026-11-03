import { NATIVE_IOS_COOKIE } from "@/constants/constants";

const NATIVE_IOS_COOKIE_MAX_AGE_SECONDS = 365 * 24 * 60 * 60;

// Runs as a synchronous inline head script (app/layout.tsx) so a first launch
// reloads with the marker before downloading the app JS. Capacitor's native
// bridge, injected at document start, already provides getPlatform() there.
// Do not infer iOS from a bare webkit message handler: other in-app browsers
// register one, and this cookie restricts purchasing for a year.
export const NATIVE_IOS_BOOTSTRAP_SCRIPT = `(() => {
  try {
    const capacitor = globalThis.Capacitor;
    const customPlatform = globalThis.CapacitorCustomPlatform?.name;
    const platform =
      typeof capacitor?.getPlatform === "function"
        ? capacitor.getPlatform()
        : customPlatform;
    if (platform !== "ios") return;

    const marker = ${JSON.stringify(`${NATIVE_IOS_COOKIE}=true`)};
    const hasMarker = document.cookie
      .split(";")
      .some((entry) => entry.trim() === marker);
    if (hasMarker) return;

    document.cookie =
      marker + ${JSON.stringify(
        `; Path=/; Max-Age=${NATIVE_IOS_COOKIE_MAX_AGE_SECONDS}; SameSite=Lax`
      )};
    const markerPersisted = document.cookie
      .split(";")
      .some((entry) => entry.trim() === marker);
    if (!markerPersisted) return;

    globalThis.location.reload();
  } catch {
    // React's native detection remains the fail-closed fallback.
  }
})();`;
