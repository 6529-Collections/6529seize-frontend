/**
 * Wire format v1 of the first-party collector (`POST /e`).
 *
 * This is the only module that knows the backend schema
 * (`telemetry-collector.v1.schema.json` in the backend). Adapting to a schema
 * change should touch this file only.
 *
 * Nothing here may carry a full URL, query string, title, handle, wallet
 * address, ID, message text, token or raw browser trait. Product-event
 * properties are allowlisted per event and must be short enum tokens or
 * booleans.
 */

const WIRE_VERSION = 1;
const MAX_BATCH_EVENTS = 40;
const MAX_BATCH_BYTES = 8192;
const MAX_EVENT_PROPS = 6;
const MAX_DIMENSION_KEYS = 16;

export type Device = "mobile" | "tablet" | "desktop";
export type Platform = "web" | "ios" | "android" | "desktop";
export type Browser = "chrome" | "safari" | "firefox" | "edge" | "other";
export type AssetKind =
  | "script"
  | "style"
  | "font"
  | "image"
  | "media"
  | "other";
export type ErrorKind =
  | "unhandled_error"
  | "unhandled_rejection"
  | "chunk_load"
  | "boundary"
  | "resource"
  | "other";

export type PageContext = {
  readonly route: string;
  readonly device: Device;
  readonly platform: Platform;
};

type Common<T extends string> = PageContext & { readonly v: 1; readonly t: T };

export type PageViewRecord = Common<"pv"> & {
  readonly page_group: string;
  readonly prev_route: string;
  readonly referrer_domain?: string;
  readonly browser: Browser;
  readonly signed_in: boolean;
  readonly fp?: string;
};

export type VitalName = "lcp" | "inp" | "cls" | "ttfb" | "fcp";
export type VitalsRecord = Common<"vitals"> &
  Partial<Record<VitalName, number>>;

export type HealthCounts = {
  asset_fail?: Partial<Record<AssetKind, number>>;
  api_fail?: Record<string, number>;
  api_slow?: Record<string, number>;
  ws_drop?: number;
  ws_reconnect?: number;
  long_task?: number;
  error?: Partial<Record<ErrorKind, number>>;
};
export type HealthRecord = Common<"health"> & { readonly c: HealthCounts };

export type ProductEventProps = Record<string, string | boolean>;
export type ProductEventRecord = Common<"ev"> & {
  readonly name: string;
  readonly p: ProductEventProps;
};

export type WireEvent =
  | PageViewRecord
  | VitalsRecord
  | HealthRecord
  | ProductEventRecord;

// Mirrors the per-event `p` lists of the backend schema
// (ops/telemetry/telemetry-collector.v1.schema.json); a contract test keeps
// them equal.
const HOME = [
  "section",
  "signed_in",
  "is_native",
  "screen_size",
  "layout_version",
];
const PROFILE = ["section", "profile_viewer_context", "profile_tab", "client"];
const AUTH = [
  "client_type",
  "reason",
  "refresh_outcome",
  "auth_state_after",
  "product_failure",
  "was_connected_wallet",
];
const AUTH_REFRESH = [
  "client_type",
  "had_local_jwt",
  "refresh_outcome",
  "product_failure",
];
const FEED = [
  "load_source",
  "duration_bucket",
  "had_cached_drops",
  "is_native",
];
const FEATURE = ["feature", "value", "placement", "viewer"];

/**
 * Product-event registry: Mixpanel event name -> allowed property keys (at
 * most MAX_EVENT_PROPS). Unknown names are dropped.
 */
export const PRODUCT_EVENT_PROPS: Readonly<Record<string, readonly string[]>> =
  {
    "Homepage section seen": HOME,
    "Homepage action clicked": [...HOME, "action"],
    "Profile section seen": PROFILE,
    "Profile action clicked": [...PROFILE, "action"],
    "Auth Forced Logout": AUTH,
    "Auth Reauth Prompt Shown": AUTH,
    "Auth Session Refresh Recovered": AUTH,
    "Auth Session Upgrade Prompt Shown": AUTH,
    "Auth Validation Failed While Connected": AUTH,
    "Auth Session Refresh Succeeded": AUTH_REFRESH,
    "Auth Validation Cancelled": AUTH_REFRESH,
    "Auth Session Refresh Product Impact": [
      "client_type",
      "had_local_jwt",
      "outcome",
      "refresh_outcome",
      "product_failure",
      "reauth_required",
    ],
    "Wave Feed Load Started": FEED,
    "Wave Feed Load Succeeded": [...FEED, "drop_count_bucket"],
    "Wave Feed Load Cancelled": FEED,
    "Wave Feed Load Failed": [
      "load_source",
      "duration_bucket",
      "status_bucket",
      "error_kind",
      "product_failure",
      "is_native",
    ],
    "Wave Feature Seen": [...FEATURE, "selection_source", "exposure_kind"],
    "Wave Feature Activated": [...FEATURE, "selected", "action"],
  };

/** Mixpanel property names that the wire renames. */
const RENAMED_PROPS: Readonly<Record<string, string>> = { platform: "client" };

// Enum tokens only: at most 32 characters and 4 words, no URL or ID shape.
// The server holds the exact enums; call sites pass constants.
const ENUM_WORD = /^[\w.+-]+$/;
const ID_LIKE = /\d{5,}|^0x|[0-9a-f]{8}-[0-9a-f]{4}|[a-z0-9-]{24,}/i;

export const isEnumValue = (value: unknown): value is string => {
  if (typeof value !== "string" || value.length > 32) return false;
  const words = value.split(" ");
  return (
    /^[A-Za-z0-9]/.test(value) &&
    words.length <= 4 &&
    words.every((word) => ENUM_WORD.test(word)) &&
    !ID_LIKE.test(value)
  );
};

/**
 * Maps a Mixpanel event onto a registry product event, or null when the name
 * is not registered. Values that are not booleans or enum tokens are dropped.
 */
export function toProductEvent(
  name: string,
  properties: Readonly<Record<string, unknown>> = {}
): { name: string; p: ProductEventProps } | null {
  const allowed = PRODUCT_EVENT_PROPS[name];
  if (!allowed) return null;
  const p: ProductEventProps = {};
  let count = 0;
  for (const [key, raw] of Object.entries(properties)) {
    const wireKey = RENAMED_PROPS[key] ?? key;
    if (!allowed.includes(wireKey) || count >= MAX_EVENT_PROPS) continue;
    if (typeof raw === "boolean" || isEnumValue(raw)) {
      p[wireKey] = raw;
      count += 1;
    }
  }
  return { name, p };
}

// The schema's segment rules: lowercase static segments of [a-z0-9_-] up to
// 40 characters, or placeholders `[name]`, `[...name]`, `[[...name]]`,
// `:name` whose name is a letter then up to 23 word characters.
const PLACEHOLDER = /^(\[\[\.\.\.|\[\.\.\.|\[|:)([A-Za-z][\w-]*)(\]\]|\])?$/;
const CLOSING: Readonly<Record<string, string>> = {
  "[[...": "]]",
  "[...": "]",
  "[": "]",
  ":": "",
};
const STATIC_SEGMENT = /^[a-z0-9][a-z0-9_-]{0,39}$/;
// Hyphenated slugs (6529-gradient-collector-curated) are routes; numbers,
// addresses, UUIDs and 16+ unbroken letters or digits are identifiers.
const ID_SEGMENT = /^\d+$|^0x|[0-9a-f]{8}-[0-9a-f]{4}|[a-z0-9]{16,}/i;

function guardSegment(segment: string): string {
  if (STATIC_SEGMENT.test(segment) && !ID_SEGMENT.test(segment)) return segment;
  const match = PLACEHOLDER.exec(segment);
  const open = match?.[1] ?? "";
  if (!match || (match[3] ?? "") !== CLOSING[open]) return "[x]";
  // App Router names such as `app-wallet-address` keep their meaning.
  const name = (match[2] ?? "x").replaceAll("-", "_").slice(0, 24);
  return `${open}${name}${CLOSING[open]}`;
}

/**
 * Last guard before a route leaves the page: keeps placeholders and lowercase
 * static segments, replaces anything else with `[x]`, and caps the template at
 * 8 segments / 96 characters.
 */
export function guardRoute(route: string): string {
  const segments = route
    .split("?")[0]!
    .split("/")
    .filter(Boolean)
    .slice(0, 8)
    .map(guardSegment);
  // Drop whole segments, never part of one, to stay within 96 characters.
  while (segments.join("/").length > 95) segments.pop();
  return `/${segments.join("/")}`;
}

const HOST_LABEL = /^[a-z0-9-]{1,63}$/;

/** Hostname only, without "www.", and only for an external referrer. */
export function toReferrerDomain(
  referrer: string,
  ownHost: string
): string | undefined {
  try {
    const { hostname, protocol } = new URL(referrer);
    if (!/^https?:$/.test(protocol) || !hostname) return undefined;
    const host = hostname.toLowerCase().replace(/^www\./, "");
    const own = ownHost.toLowerCase().replace(/^www\./, "");
    if (host === own || host === "6529.io" || host.endsWith(".6529.io"))
      return undefined;
    // DNS names only (the schema allows 100 characters): no IP literals.
    const labels = host.split(".");
    const valid =
      host.length <= 100 &&
      labels.length > 1 &&
      labels.every((label) => HOST_LABEL.test(label) && !/^-|-$/.test(label)) &&
      !/^\d+$/.test(labels.at(-1) ?? "");
    return valid ? host : undefined;
  } catch {
    return undefined;
  }
}

const clampCount = (n: number): number =>
  Math.min(10000, Math.max(1, Math.round(n)));

/** Drops empty counters, clamps counts, and keeps at most 16 keys per map. */
export function toHealthCounts(counts: HealthCounts): HealthCounts | null {
  const out: HealthCounts = {};
  for (const [key, value] of Object.entries(counts)) {
    if (typeof value === "number") {
      if (value > 0) (out as Record<string, number>)[key] = clampCount(value);
      continue;
    }
    const entries = Object.entries(value as Record<string, number>)
      .filter(([, n]) => n > 0)
      .slice(0, MAX_DIMENSION_KEYS)
      .map(([k, n]) => [k, clampCount(n)]);
    if (entries.length > 0)
      (out as Record<string, unknown>)[key] = Object.fromEntries(entries);
  }
  return Object.keys(out).length > 0 ? out : null;
}

/** Splits events into JSON batches within the event and byte limits. */
export function encodeBatches(events: readonly WireEvent[]): string[] {
  const bodies: string[] = [];
  let current: WireEvent[] = [];
  const encode = (list: WireEvent[]) =>
    JSON.stringify({ v: WIRE_VERSION, events: list });
  for (const event of events) {
    const next = [...current, event];
    if (
      current.length > 0 &&
      (next.length > MAX_BATCH_EVENTS || encode(next).length > MAX_BATCH_BYTES)
    ) {
      bodies.push(encode(current));
      current = [event];
    } else {
      current = next;
    }
  }
  if (current.length > 0 && encode(current).length <= MAX_BATCH_BYTES)
    bodies.push(encode(current));
  return bodies;
}
