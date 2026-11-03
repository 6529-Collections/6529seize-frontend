/**
 * Which download to offer first. The server guesses from the User-Agent
 * header, so the first paint already shows the right button; the browser
 * then refines a Linux guess with its client hints, which name the CPU.
 */
export type VisitorSystem = "mac" | "windows" | "linux" | "other";
export type VisitorCpu = "x64" | "arm64" | null;

export type VisitorPlatform = {
  readonly system: VisitorSystem;
  readonly cpu: VisitorCpu;
};

const OTHER: VisitorPlatform = { system: "other", cpu: null };

export function detectFromUserAgent(
  userAgent: string | null | undefined
): VisitorPlatform {
  if (!userAgent) {
    return OTHER;
  }
  // Phones, tablets and Chromebooks run none of the installers. Android's
  // User-Agent also says "Linux", so it is ruled out first.
  if (/iPhone|iPad|iPod|Android|CrOS/i.test(userAgent)) {
    return OTHER;
  }
  if (/Windows NT/i.test(userAgent)) {
    return { system: "windows", cpu: null };
  }
  if (/Macintosh|Mac OS X/i.test(userAgent)) {
    return { system: "mac", cpu: null };
  }
  if (/Linux|X11/i.test(userAgent)) {
    if (/aarch64|arm64/i.test(userAgent)) {
      return { system: "linux", cpu: "arm64" };
    }
    // Chromium writes "Linux x86_64" on every Linux computer, ARM ones too,
    // so only other browsers are believed. Chromium's client hints say
    // what the CPU is.
    if (
      /x86_64|amd64/i.test(userAgent) &&
      !/Chrome\/|Chromium\//.test(userAgent)
    ) {
      return { system: "linux", cpu: "x64" };
    }
    return { system: "linux", cpu: null };
  }
  return OTHER;
}

/**
 * Chromium's client hints: `navigator.userAgentData.platform`, and the
 * `architecture` and `bitness` of `getHighEntropyValues`.
 */
export function detectFromClientHints(
  platform: string,
  architecture: string | undefined,
  bitness: string | undefined,
  fallback: VisitorPlatform
): VisitorPlatform {
  switch (platform.toLowerCase()) {
    case "macos":
      return { system: "mac", cpu: null };
    case "windows":
      return { system: "windows", cpu: null };
    case "linux": {
      if (bitness === "64" && architecture === "arm") {
        return { system: "linux", cpu: "arm64" };
      }
      if (bitness === "64" && architecture === "x86") {
        return { system: "linux", cpu: "x64" };
      }
      return { system: "linux", cpu: null };
    }
    case "android":
    case "chrome os":
    case "chromeos":
    case "ios":
      return OTHER;
    default:
      return fallback;
  }
}
