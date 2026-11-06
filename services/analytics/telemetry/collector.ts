import { publicEnv } from "@/config/env";
import { sanitizeEndpointGroup } from "@/utils/monitoring/mobileLaunchTimingSanitizers";
import {
  detectBrowser,
  detectDevice,
  detectPlatform,
  readFingerprintTraits,
} from "./environment";
import { computeFingerprint, isFingerprintAllowed } from "./fingerprint";
import { observeWebVitals } from "./vitals";
import {
  encodeBatches,
  guardRoute,
  toHealthCounts,
  toProductEvent,
  toReferrerDomain,
  type AssetKind,
  type ErrorKind,
  type HealthCounts,
  type PageContext,
  type ProductEventProps,
  type VitalName,
  type WireEvent,
} from "./wire";

/**
 * First-party collector client (R14 §4.1). Sends route-template page views,
 * web vitals, allowlisted product events and per-page health counters to the
 * same-origin `/e`: one batch per page view and one when the page hides. It
 * sets no cookies, uses no storage and assigns no IDs; everything it holds is
 * in memory for the current page load.
 */

export const COLLECTOR_ENDPOINT = "/e";
const FLUSH_DELAY_MS = 1500;
const SLOW_API_MS = 3000;
const LONG_TASK_MS = 200;
const MAX_QUEUE = 200;
const NOT_FOUND_ROUTE = "/[other]";

// Router and location pathnames can differ in percent-encoding.
const normalizePath = (path: string): string => {
  try {
    return decodeURIComponent(path);
  } catch {
    return path;
  }
};

type DimensionKey = "asset_fail" | "api_fail" | "api_slow" | "error";
type ScalarKey = "ws_drop" | "ws_reconnect" | "long_task";
type PendingEvent = { name: string; p: ProductEventProps };

const listeners: Array<() => void> = [];
let flushVitals = (): void => undefined;

function listen<K extends keyof WindowEventMap>(
  type: K,
  handler: (event: WindowEventMap[K]) => void,
  capture = false
): void {
  addEventListener(type, handler, capture);
  listeners.push(() => removeEventListener(type, handler, capture));
}

const state = {
  started: false,
  page: null as PageContext | null,
  pagePath: null as string | null,
  notFoundPath: null as string | null,
  entryPage: null as PageContext | null,
  prevRoute: "entry",
  queue: [] as WireEvent[],
  early: [] as PendingEvent[],
  health: {} as HealthCounts,
  vitals: {} as Partial<Record<VitalName, number>>,
  vitalsSent: false,
  country: "",
  countryPending: true,
  timer: undefined as ReturnType<typeof setTimeout> | undefined,
};

export const isFirstPartyTelemetryEnabled = (): boolean =>
  publicEnv.NEXT_PUBLIC_FEATURE_FIRST_PARTY_TELEMETRY === "true" &&
  typeof window !== "undefined";

function send(body: string): void {
  try {
    if (navigator.sendBeacon(COLLECTOR_ENDPOINT, body)) return;
  } catch {
    /* Fall back to fetch. */
  }
  try {
    void fetch(COLLECTOR_ENDPOINT, {
      method: "POST",
      body,
      keepalive: true,
      credentials: "omit",
      headers: { "content-type": "text/plain;charset=UTF-8" },
    }).catch(() => undefined);
  } catch {
    /* Telemetry never interrupts the page. */
  }
}

function enqueue(event: WireEvent): void {
  if (state.queue.length < MAX_QUEUE) state.queue.push(event);
}

function pushHealth(): void {
  const counts = toHealthCounts(state.health);
  state.health = {};
  if (counts && state.page)
    enqueue({ v: 1, t: "health", ...state.page, c: counts });
}

function pushVitals(): void {
  if (state.vitalsSent || !state.entryPage) return;
  flushVitals();
  if (Object.keys(state.vitals).length === 0) return;
  state.vitalsSent = true;
  enqueue({ v: 1, t: "vitals", ...state.entryPage, ...state.vitals });
}

/** Sends queued events. Before the page hides, a page view waits for the country. */
export function flushTelemetry(final = false): void {
  clearTimeout(state.timer);
  state.timer = undefined;
  if (final) {
    pushHealth();
    pushVitals();
  } else if (state.countryPending && state.queue.some((e) => e.t === "pv")) {
    return;
  }
  if (state.queue.length === 0) return;
  const fp =
    !state.countryPending &&
    isFingerprintAllowed(state.country) &&
    state.queue.some((e) => e.t === "pv")
      ? computeFingerprint(readFingerprintTraits(detectDevice()))
      : undefined;
  const events = state.queue
    .splice(0)
    .map((e) => (e.t === "pv" && fp ? { ...e, fp } : e));
  for (const body of encodeBatches(events)) send(body);
}

function scheduleFlush(): void {
  state.timer ??= setTimeout(() => flushTelemetry(), FLUSH_DELAY_MS);
}

function bump(key: DimensionKey, dimension: string): void;
function bump(key: ScalarKey): void;
function bump(key: DimensionKey | ScalarKey, dimension?: string): void {
  if (!isFirstPartyTelemetryEnabled()) return;
  const health = state.health as Record<
    string,
    number | Record<string, number>
  >;
  if (dimension === undefined) {
    health[key] = ((health[key] as number | undefined) ?? 0) + 1;
    return;
  }
  const map = (health[key] ??= {}) as Record<string, number>;
  if (map[dimension] === undefined && Object.keys(map).length >= 16) return;
  map[dimension] = (map[dimension] ?? 0) + 1;
}

const CHUNK_ERROR =
  /ChunkLoadError|Loading (CSS )?chunk|dynamically imported module|Importing a module script failed/i;

export function classifyError(error: unknown, fallback: ErrorKind): ErrorKind {
  let text = typeof error === "string" ? error : "";
  if (error instanceof Error) text = `${error.name} ${error.message}`;
  return CHUNK_ERROR.test(text) ? "chunk_load" : fallback;
}

const ASSET_KINDS: Readonly<Record<string, AssetKind>> = {
  script: "script",
  modulepreload: "script",
  stylesheet: "style",
  style: "style",
  font: "font",
  img: "image",
  image: "image",
  video: "media",
  audio: "media",
  source: "media",
  track: "media",
};

/** By tag name, or for a link by its `as` or `rel`. */
export function classifyAsset(target: Element): AssetKind {
  const tag = target.tagName.toLowerCase();
  const key =
    tag === "link"
      ? (target.getAttribute("as") ?? target.getAttribute("rel") ?? "")
      : tag;
  return ASSET_KINDS[key] ?? "other";
}

/** Installs the page-lifetime listeners once. Safe to call repeatedly. */
export function startFirstPartyTelemetry(): void {
  if (state.started || !isFirstPartyTelemetryEnabled()) return;
  state.started = true;
  listen(
    "error",
    (event) => {
      const target = event.target;
      if (target instanceof Element) bump("asset_fail", classifyAsset(target));
      else
        bump(
          "error",
          classifyError(event.error ?? event.message, "unhandled_error")
        );
    },
    true
  );
  listen("unhandledrejection", (event) =>
    bump("error", classifyError(event.reason, "unhandled_rejection"))
  );
  const vitals = observeWebVitals(recordVital);
  flushVitals = vitals.flush;
  listeners.push(vitals.stop);
  try {
    const observer = new PerformanceObserver((list) => {
      for (const entry of list.getEntries())
        if (entry.duration > LONG_TASK_MS) bump("long_task");
    });
    observer.observe({ type: "longtask", buffered: true });
    listeners.push(() => observer.disconnect());
  } catch {
    /* Long tasks are not observable in this browser. */
  }
  // pushVitals takes pending performance entries before the final batch.
  const onVisibilityChange = () => {
    if (document.visibilityState === "hidden") flushTelemetry(true);
  };
  addEventListener("visibilitychange", onVisibilityChange);
  listeners.push(() =>
    removeEventListener("visibilitychange", onVisibilityChange)
  );
  listen("pagehide", () => flushTelemetry(true));
}

export function setTelemetryCountry(country: string, pending: boolean): void {
  state.country = country;
  state.countryPending = pending;
  if (!pending && state.queue.length > 0) scheduleFlush();
}

export function recordPageView(input: {
  /** In memory only, to match a 404 to its page view; never sent. */
  readonly pathname: string;
  readonly route: string;
  readonly pageGroup: string;
  readonly signedIn: boolean;
}): void {
  if (!isFirstPartyTelemetryEnabled()) return;
  startFirstPartyTelemetry();
  if (state.page) pushHealth();
  const notFound = state.notFoundPath === normalizePath(input.pathname);
  state.notFoundPath = null;
  state.pagePath = normalizePath(input.pathname);
  const route = notFound ? NOT_FOUND_ROUTE : guardRoute(input.route);
  const isEntry = state.page === null;
  const page: PageContext = {
    route,
    device: detectDevice(),
    platform: detectPlatform(),
  };
  const referrer = isEntry
    ? toReferrerDomain(document.referrer, location.hostname)
    : undefined;
  enqueue({
    v: 1,
    t: "pv",
    ...page,
    page_group: /^[a-z0-9_-]{1,32}$/.test(input.pageGroup)
      ? input.pageGroup
      : "other",
    prev_route: state.prevRoute,
    ...(referrer ? { referrer_domain: referrer } : {}),
    browser: detectBrowser(navigator.userAgent).browser,
    signed_in: input.signedIn,
  });
  state.page = page;
  state.entryPage ??= page;
  state.prevRoute = route;
  for (const event of state.early.splice(0))
    enqueue({ v: 1, t: "ev", ...page, ...event });
  scheduleFlush();
}

/**
 * A 404 page has no matched template, so its literal path segments could be
 * anything a visitor typed. Rewrites the current page view, if not yet sent,
 * to `/[other]`.
 */
export function markPageNotFound(pathname: string): void {
  const page = state.page;
  // The 404 page can commit before the page view of its own path is recorded.
  if (!page || state.pagePath !== normalizePath(pathname)) {
    state.notFoundPath = normalizePath(pathname);
    return;
  }
  if (page.route === NOT_FOUND_ROUTE) return;
  const unknown: PageContext = { ...page, route: NOT_FOUND_ROUTE };
  state.queue = state.queue.map((event) =>
    event.route === page.route ? { ...event, route: NOT_FOUND_ROUTE } : event
  );
  if (state.entryPage === page) state.entryPage = unknown;
  state.page = unknown;
  state.prevRoute = NOT_FOUND_ROUTE;
}

/** Fan-out target for `trackAnalyticsEvent`: registry events only. */
export function recordProductEvent(
  name: string,
  properties?: Readonly<Record<string, unknown>>
): void {
  if (!isFirstPartyTelemetryEnabled()) return;
  const event = toProductEvent(name, properties);
  if (!event) return;
  if (state.page) enqueue({ v: 1, t: "ev", ...state.page, ...event });
  else if (state.early.length < 40) state.early.push(event);
}

export function recordVital(name: string, value: number): void {
  const key = name.toLowerCase() as VitalName;
  if (state.vitalsSent || !["lcp", "inp", "cls", "ttfb", "fcp"].includes(key))
    return;
  if (!Number.isFinite(value) || value < 0) return;
  state.vitals[key] =
    key === "cls"
      ? Math.min(100, Math.round(value * 10000) / 10000)
      : Math.min(300000, Math.round(value));
}

/** API health per endpoint template; aborted requests are not counted. */
export function countApiRequest(input: {
  readonly endpoint: string;
  readonly status: number | "aborted" | "network_error" | "unknown";
  readonly durationMs: number;
}): void {
  const { status } = input;
  if (status === "aborted" || !isFirstPartyTelemetryEnabled()) return;
  const template = guardRoute(
    sanitizeEndpointGroup(input.endpoint)
      .replace(/^\/api(?=\/|$)/, "")
      .replaceAll(/:(\w+)/g, "[$1]")
  );
  const failed =
    status === "network_error" ||
    (typeof status === "number" &&
      (status >= 500 || status === 429 || status === 408));
  if (failed) bump("api_fail", template);
  if (input.durationMs > SLOW_API_MS) bump("api_slow", template);
}

export const countWebSocket = (kind: "drop" | "reconnect"): void =>
  bump(kind === "drop" ? "ws_drop" : "ws_reconnect");

export const countBoundaryError = (): void => bump("error", "boundary");

/** Test-only: forget all page-load state. */
export function resetTelemetryForTests(): void {
  clearTimeout(state.timer);
  for (const remove of listeners.splice(0)) remove();
  flushVitals = () => undefined;
  Object.assign(state, {
    started: false,
    page: null,
    pagePath: null,
    notFoundPath: null,
    entryPage: null,
    prevRoute: "entry",
    queue: [],
    early: [],
    health: {},
    vitals: {},
    vitalsSent: false,
    country: "",
    countryPending: true,
    timer: undefined,
  });
}
