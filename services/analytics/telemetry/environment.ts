import { Capacitor } from "@capacitor/core";
import type { FingerprintTraits } from "./fingerprint";
import type { Browser, Device, Platform } from "./wire";

/** Browser family and major version from the user agent. Only these leave. */
export function detectBrowser(userAgent: string): {
  browser: Browser;
  major: string;
} {
  const match = (pattern: RegExp) => pattern.exec(userAgent)?.[1] ?? "";
  if (/Edg(e|A|iOS)?\//.test(userAgent))
    return { browser: "edge", major: match(/Edg(?:e|A|iOS)?\/(\d+)/) };
  if (/(Firefox|FxiOS)\//.test(userAgent))
    return { browser: "firefox", major: match(/(?:Firefox|FxiOS)\/(\d+)/) };
  if (/(Chrome|CriOS|Chromium)\//.test(userAgent))
    return {
      browser: "chrome",
      major: match(/(?:Chrome|CriOS|Chromium)\/(\d+)/),
    };
  if (/Safari\//.test(userAgent) || /AppleWebKit\//.test(userAgent))
    return { browser: "safari", major: match(/Version\/(\d+)/) };
  return { browser: "other", major: "" };
}

export function detectPlatform(): Platform {
  try {
    const platform = Capacitor.getPlatform();
    if (platform === "ios" || platform === "android") return platform;
  } catch {
    /* Treated as web. */
  }
  return navigator.userAgent.includes("Electron") ? "desktop" : "web";
}

export function detectDevice(): Device {
  const width = globalThis.innerWidth || 0;
  if (width < 768) return "mobile";
  const coarse =
    typeof globalThis.matchMedia === "function" &&
    globalThis.matchMedia("(pointer: coarse)").matches;
  return coarse && width < 1400 ? "tablet" : "desktop";
}

export function readFingerprintTraits(device: Device): FingerprintTraits {
  const { browser, major } = detectBrowser(navigator.userAgent);
  let timeZone = "";
  try {
    timeZone = Intl.DateTimeFormat().resolvedOptions().timeZone;
  } catch {
    /* No time zone. */
  }
  return {
    timeZone,
    language: navigator.languages[0] ?? navigator.language,
    screenWidth: screen.width,
    screenHeight: screen.height,
    device,
    browser,
    browserMajor: major,
  };
}
