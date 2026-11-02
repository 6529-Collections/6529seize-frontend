const DEFAULT_DEVICE_LABEL = "Browser";

// Order matters: several browsers also identify as Chrome and Safari.
const BROWSER_PATTERNS: ReadonlyArray<readonly [RegExp, string]> = [
  [/Edg(A|iOS)?\//, "Edge"],
  [/OPR\/|Opera/, "Opera"],
  [/SamsungBrowser\//, "Samsung Internet"],
  [/Brave\//, "Brave"],
  [/Firefox\/|FxiOS\//, "Firefox"],
  [/Chrome\/|CriOS\//, "Chrome"],
  [/Safari\//, "Safari"],
];

const OS_PATTERNS: ReadonlyArray<readonly [RegExp, string]> = [
  [/iPhone/, "iPhone"],
  [/iPad/, "iPad"],
  [/Android/, "Android"],
  [/CrOS/, "ChromeOS"],
  [/Windows/, "Windows"],
  [/Macintosh|Mac OS X/, "macOS"],
  [/Linux/, "Linux"],
];

const matchFirst = (
  userAgent: string,
  patterns: ReadonlyArray<readonly [RegExp, string]>
): string | null =>
  patterns.find(([pattern]) => pattern.test(userAgent))?.[1] ?? null;

/** A short, non-identifying label such as "Chrome on macOS". */
export function getDeviceLabel(
  userAgent: string = (globalThis.navigator as Partial<Navigator> | undefined)
    ?.userAgent ?? ""
): string {
  const browser = matchFirst(userAgent, BROWSER_PATTERNS);
  const os = matchFirst(userAgent, OS_PATTERNS);
  if (browser && os) {
    return `${browser} on ${os}`;
  }
  if (os) {
    return `${DEFAULT_DEVICE_LABEL} on ${os}`;
  }
  return browser ?? DEFAULT_DEVICE_LABEL;
}
