import { Capacitor } from "@capacitor/core";

type E2eePlatform = "web" | "desktop" | "phone";

const DESKTOP_GRANT_ORIGIN = "6529 Desktop";

const isElectron = (): boolean =>
  typeof navigator !== "undefined" &&
  typeof navigator.userAgent === "string" &&
  navigator.userAgent.includes("Electron");

/** Device platform recorded with an encrypted-messages device (contract 4.1). */
export function detectE2eePlatform(): E2eePlatform {
  if (isElectron()) {
    return "desktop";
  }
  try {
    if (Capacitor.isNativePlatform()) {
      return "phone";
    }
  } catch {
    // Capacitor is unavailable outside the native shells.
  }
  return "web";
}

/**
 * The origin shown inside the wallet signature (contract 2.1): the host the
 * user sees, or "6529 Desktop" in the desktop app.
 */
export function getE2eeGrantOrigin(platform: E2eePlatform): string {
  if (platform === "desktop") {
    return DESKTOP_GRANT_ORIGIN;
  }
  try {
    return globalThis.location.host;
  } catch {
    return "";
  }
}

/**
 * Safari (desktop and iOS WebKit outside the 6529 app) may evict script
 * storage after 7 days without a visit, which would erase local history.
 */
export function isSafariBrowser(): boolean {
  if (typeof navigator === "undefined") {
    return false;
  }
  const ua = navigator.userAgent;
  return (
    /Safari\//.test(ua) &&
    !/(Chrome|Chromium|CriOS|FxiOS|EdgiOS|Edg|OPR|Android|Electron)\//.test(ua)
  );
}
