import { NATIVE_IOS_COOKIE } from "@/constants/constants";

const NATIVE_IOS_COOKIE_MAX_AGE_SECONDS = 365 * 24 * 60 * 60;

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
