/**
 * A coarse, human name for a new encrypted-messages device, such as
 * "Chrome on Windows" or "6529 app on iPhone". Only the browser or app and
 * the OS family are used, never versions or other identifying detail. It is
 * stored as the device's name (shown on every device of the profile) and
 * the owner can rename this device later.
 */

type E2eeLabelPlatform = "web" | "desktop" | "phone";

interface UserAgentBrand {
  readonly brand: string;
}

interface NavigatorLike {
  readonly userAgent?: string | undefined;
  readonly userAgentData?:
    | {
        readonly brands?: readonly UserAgentBrand[] | undefined;
        readonly platform?: string | undefined;
      }
    | undefined;
}

const FALLBACK_LABEL = "Browser";
/** Server and engine keep device names to 48 characters. */
const MAX_LABEL_LENGTH = 48;

const BRAND_NAMES: readonly (readonly [RegExp, string])[] = [
  [/^Microsoft Edge$/u, "Edge"],
  [/^Opera$/u, "Opera"],
  [/^Brave$/u, "Brave"],
  [/^Google Chrome$/u, "Chrome"],
  [/^Chromium$/u, "Chrome"],
];

/** Ordered by priority: the first listed match wins. */
const UA_BROWSERS: readonly (readonly [RegExp, string])[] = [
  [/\bEdg(?:e|A|iOS)?\//u, "Edge"],
  [/\b(?:OPR|Opera)\//u, "Opera"],
  [/\b(?:Firefox|FxiOS)\//u, "Firefox"],
  [/\b(?:CriOS|Chrome|Chromium)\//u, "Chrome"],
  // Every browser above also says "Safari/", so this only matches when none
  // of them did.
  [/\bSafari\//u, "Safari"],
];

const PLATFORM_NAMES: Readonly<Record<string, string>> = {
  windows: "Windows",
  macos: "Mac",
  linux: "Linux",
  android: "Android",
  ios: "iPhone",
  "chrome os": "ChromeOS",
  chromeos: "ChromeOS",
};

/** Ordered: iPhone and iPad before Mac (their UAs say "like Mac OS X"). */
const UA_SYSTEMS: readonly (readonly [RegExp, string])[] = [
  [/\biPhone\b/u, "iPhone"],
  [/\biPad\b/u, "iPad"],
  [/\bAndroid\b/u, "Android"],
  [/\bWindows\b/u, "Windows"],
  [/\bCrOS\b/u, "ChromeOS"],
  [/\bMac(?:intosh| OS X)\b/u, "Mac"],
  [/\bLinux\b/u, "Linux"],
];

const firstMatch = (
  value: string,
  table: readonly (readonly [RegExp, string])[]
): string | null => table.find(([pattern]) => pattern.test(value))?.[1] ?? null;

function detectBrowser(nav: NavigatorLike): string | null {
  const brands = nav.userAgentData?.brands ?? [];
  // Specific brands (Edge, Opera, Brave) win over the Chromium base brand.
  for (const [pattern, name] of BRAND_NAMES) {
    if (brands.some(({ brand }) => pattern.test(brand))) {
      return name;
    }
  }
  return firstMatch(nav.userAgent ?? "", UA_BROWSERS);
}

function detectSystem(nav: NavigatorLike): string | null {
  const platform = nav.userAgentData?.platform?.trim().toLowerCase();
  if (platform && PLATFORM_NAMES[platform]) {
    return PLATFORM_NAMES[platform] ?? null;
  }
  return firstMatch(nav.userAgent ?? "", UA_SYSTEMS);
}

const join = (product: string, system: string | null) =>
  system ? `${product} on ${system}` : product;

/** Coarse label for this device; "Browser" when nothing is recognised. */
export function getE2eeDeviceLabel(
  platform: E2eeLabelPlatform,
  source?: NavigatorLike
): string {
  const nav: NavigatorLike | undefined =
    source ?? (typeof navigator === "undefined" ? undefined : navigator);
  if (nav === undefined) {
    return FALLBACK_LABEL;
  }
  const system = detectSystem(nav);
  let label: string;
  if (platform === "phone") {
    label = join("6529 app", system);
  } else if (platform === "desktop") {
    label = join("6529 Desktop", system);
  } else {
    const browser = detectBrowser(nav);
    label = browser ? join(browser, system) : FALLBACK_LABEL;
  }
  return label.slice(0, MAX_LABEL_LENGTH);
}
