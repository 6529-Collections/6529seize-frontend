import { publicEnv } from "@/config/env";
import { Capacitor } from "@capacitor/core";
import * as Sentry from "@sentry/nextjs";

const SLOW_LAUNCH_MS = 3000;
const NORMAL_SAMPLE_RATE = 0.05;
const TIMEOUT_FLUSH_MS = 15000;
const MAX_API_CALLS = 10;
const SLOWEST_API_CALLS = 5;

const WALLET_ADDRESS_PATTERN = /^0x[a-fA-F0-9]{40}$/;
const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const LONG_HEX_PATTERN = /^[a-fA-F0-9]{32,}$/;
const LONG_TOKEN_PATTERN = /^[A-Za-z0-9_-]{24,}$/;
const NUMERIC_PATTERN = /^\d+$/;

const IDENTIFIER_PARENT_SEGMENTS = new Set([
  "account",
  "accounts",
  "address",
  "addresses",
  "collection",
  "collections",
  "contract",
  "contracts",
  "delegation",
  "delegations",
  "drop",
  "drops",
  "group",
  "groups",
  "handle",
  "handles",
  "identity",
  "identities",
  "profile",
  "profiles",
  "proxy",
  "proxies",
  "token",
  "tokens",
  "user",
  "users",
  "wallet",
  "wallets",
  "wave",
  "waves",
]);

const STATIC_ACTION_SEGMENTS = new Set([
  "activity",
  "auth",
  "bulk",
  "create",
  "delete",
  "distribution",
  "feed",
  "followers",
  "following",
  "groups",
  "health",
  "latest",
  "list",
  "login",
  "metrics",
  "nonce",
  "notifications",
  "proxies",
  "query",
  "rank",
  "reactions",
  "read",
  "recent",
  "search",
  "stats",
  "subscriptions",
  "unread",
  "update",
  "votes",
  "waves",
]);

const STATIC_TOP_LEVEL_ROUTE_SEGMENTS = new Set([
  "6529-gradient",
  "about",
  "accept-connection-sharing",
  "access",
  "api",
  "author",
  "blog",
  "buidl",
  "capital",
  "casabatllo",
  "category",
  "cdn-cgi",
  "city",
  "consolidation-mapping-tool",
  "delegation",
  "delegation-mapping-tool",
  "discover",
  "dispute-resolution",
  "drop-forge",
  "education",
  "element_category",
  "email-signatures",
  "emma",
  "error",
  "feed",
  "gm-or-die-small-mp4",
  "meme-accounting",
  "meme-calendar",
  "meme-gas",
  "meme-lab",
  "messages",
  "museum",
  "network",
  "news",
  "nextgen",
  "nft-activity",
  "notifications",
  "om",
  "open-data",
  "open-mobile",
  "rememes",
  "restricted",
  "sentry-example-page",
  "slide-page",
  "the-memes",
  "tools",
  "waves",
  "xtdh",
]);

const USER_ROUTE_TAB_SEGMENTS = new Set([
  "brain",
  "collected",
  "curations",
  "followers",
  "groups",
  "identity",
  "proxy",
  "subscriptions",
  "waves",
  "xtdh",
]);

const STATIC_ABOUT_SECTION_SEGMENTS = new Set([
  "100m-project",
  "media",
  "mission",
  "open-metaverse",
  "press",
  "rules",
]);

const STATIC_MESSAGES_SEGMENTS = new Set(["create"]);
const STATIC_WAVES_SEGMENTS = new Set(["create"]);
const STATIC_APP_WALLETS_SEGMENTS = new Set(["import-wallet"]);
const STATIC_REMEMES_SEGMENTS = new Set(["add"]);
const STATIC_THE_MEMES_SEGMENTS = new Set(["mint"]);
const STATIC_MEME_LAB_SEGMENTS = new Set(["collection"]);
const STATIC_NEXTGEN_SEGMENTS = new Set(["collection", "manager", "token"]);

type FlushReason = "shell_paint" | "timeout" | "pagehide" | "error" | "manual";

type ApiStatus = number | "aborted" | "network_error" | "unknown";

type StepTiming = {
  readonly offset_ms: number;
  readonly duration_ms?: number;
  readonly status?: "ok" | "error";
};

type ApiTiming = {
  readonly method: string;
  readonly status: ApiStatus;
  readonly duration_ms: number;
  readonly start_offset_ms: number;
  readonly endpoint_group: string;
};

type CapturedApiTiming = ApiTiming & {
  readonly startedAtMs: number;
};

type RoutePatternSegment =
  | string
  | {
      readonly kind: "param";
      readonly excludedValues?: ReadonlySet<string>;
    }
  | {
      readonly kind: "catchAll";
      readonly optional: boolean;
      readonly excludedValues?: ReadonlySet<string>;
    };

type RouteFamilyPattern = {
  readonly template: string;
  readonly segments: readonly RoutePatternSegment[];
};

type DeviceInfoAttrs = {
  readonly platform?: string;
  readonly operating_system?: string;
  readonly os_version?: string;
  readonly model?: string;
  readonly manufacturer?: string;
  readonly is_virtual?: boolean;
  readonly web_view_version?: string;
};

type LaunchState = {
  readonly launchId: string;
  readonly startedAtMs: number;
  readonly platform: string;
  readonly appVersion: string;
  readonly steps: Record<string, StepTiming>;
  readonly apiCalls: CapturedApiTiming[];
  apiTotalCount: number;
  deviceInfo?: DeviceInfoAttrs;
  timeoutId?: ReturnType<typeof setTimeout>;
  flushed: boolean;
};

type ApiRequestTimingInput = {
  readonly endpoint: string;
  readonly method: string;
  readonly status: ApiStatus;
  readonly startedAtMs: number;
  readonly durationMs: number;
};

// Keep route_family aligned with App Router templates instead of raw params.
const ROUTE_FAMILY_PATTERNS: readonly RouteFamilyPattern[] = [
  {
    template: "/messages/[wave]",
    segments: ["messages", routeParam(STATIC_MESSAGES_SEGMENTS)],
  },
  {
    template: "/waves/[wave]",
    segments: ["waves", routeParam(STATIC_WAVES_SEGMENTS)],
  },
  {
    template: "/tools/app-wallets/[app-wallet-address]",
    segments: ["tools", "app-wallets", routeParam(STATIC_APP_WALLETS_SEGMENTS)],
  },
  {
    template: "/drop-forge/craft/[id]",
    segments: ["drop-forge", "craft", routeParam()],
  },
  {
    template: "/drop-forge/launch/[id]",
    segments: ["drop-forge", "launch", routeParam()],
  },
  {
    template: "/rememes/[contract]/[id]",
    segments: ["rememes", routeParam(STATIC_REMEMES_SEGMENTS), routeParam()],
  },
  {
    template: "/the-memes/[id]/distribution",
    segments: [
      "the-memes",
      routeParam(STATIC_THE_MEMES_SEGMENTS),
      "distribution",
    ],
  },
  {
    template: "/the-memes/[id]",
    segments: ["the-memes", routeParam(STATIC_THE_MEMES_SEGMENTS)],
  },
  {
    template: "/meme-lab/collection/[collection]",
    segments: ["meme-lab", "collection", routeParam()],
  },
  {
    template: "/meme-lab/[id]/distribution",
    segments: [
      "meme-lab",
      routeParam(STATIC_MEME_LAB_SEGMENTS),
      "distribution",
    ],
  },
  {
    template: "/meme-lab/[id]",
    segments: ["meme-lab", routeParam(STATIC_MEME_LAB_SEGMENTS)],
  },
  {
    template: "/nextgen/collection/[collection]/art",
    segments: ["nextgen", "collection", routeParam(), "art"],
  },
  {
    template: "/nextgen/collection/[collection]/distribution-plan",
    segments: ["nextgen", "collection", routeParam(), "distribution-plan"],
  },
  {
    template: "/nextgen/collection/[collection]/mint",
    segments: ["nextgen", "collection", routeParam(), "mint"],
  },
  {
    template: "/nextgen/collection/[collection]/trait-sets",
    segments: ["nextgen", "collection", routeParam(), "trait-sets"],
  },
  {
    template: "/nextgen/collection/[collection]/[[...view]]",
    segments: ["nextgen", "collection", routeParam(), routeCatchAll(true)],
  },
  {
    template: "/nextgen/token/[token]/[[...view]]",
    segments: ["nextgen", "token", routeParam(), routeCatchAll(true)],
  },
  {
    template: "/nextgen/[[...view]]",
    segments: ["nextgen", routeCatchAll(true, STATIC_NEXTGEN_SEGMENTS)],
  },
  {
    template: "/delegation/[...section]",
    segments: ["delegation", routeCatchAll(false)],
  },
  {
    template: "/network/nerd/[[...focus]]",
    segments: ["network", "nerd", routeCatchAll(true)],
  },
  {
    template: "/about/[section]",
    segments: ["about", routeParam(STATIC_ABOUT_SECTION_SEGMENTS)],
  },
  {
    template: "/6529-gradient/[id]",
    segments: ["6529-gradient", routeParam()],
  },
  {
    template: "/emma/plans/[id]",
    segments: ["emma", "plans", routeParam()],
  },
];

let launchState: LaunchState | null = null;

export function startMobileLaunchTiming(): void {
  if (launchState !== null) {
    return;
  }

  if (globalThis.window === undefined || !Capacitor.isNativePlatform()) {
    return;
  }

  const startedAtMs = nowMs();
  launchState = {
    launchId: createLaunchId(),
    startedAtMs,
    platform: Capacitor.getPlatform(),
    appVersion: publicEnv.VERSION ?? "unknown",
    steps: {
      start: {
        offset_ms: 0,
      },
    },
    apiCalls: [],
    apiTotalCount: 0,
    flushed: false,
  };

  addStepBreadcrumb("start", 0);
  registerFlushHandlers();
  void captureDeviceInfo().catch(() => undefined);
}

export function markMobileLaunchStep(stepName: string): void {
  const state = getActiveState();
  if (!state) {
    return;
  }

  const safeStepName = sanitizeAttributeKey(stepName);
  if (state.steps[safeStepName]) {
    return;
  }

  const offsetMs = elapsedSinceStart(state);
  state.steps[safeStepName] = {
    offset_ms: roundMs(offsetMs),
  };
  addStepBreadcrumb(safeStepName, offsetMs);
}

export async function measureMobileLaunchAsync<T>(
  stepName: string,
  task: () => T | Promise<T>
): Promise<T> {
  const state = getActiveState();
  if (!state) {
    return task();
  }

  const safeStepName = sanitizeAttributeKey(stepName);
  const startedAtMs = nowMs();
  const startOffsetMs = startedAtMs - state.startedAtMs;
  addStepBreadcrumb(`${safeStepName}_start`, startOffsetMs);

  try {
    const result = await task();
    recordMeasuredStep(state, safeStepName, startedAtMs, "ok");
    return result;
  } catch (error) {
    recordMeasuredStep(state, safeStepName, startedAtMs, "error");
    throw error;
  }
}

export function recordMobileLaunchApiRequest(
  input: ApiRequestTimingInput
): void {
  const state = getActiveState();
  if (!state) {
    return;
  }

  state.apiTotalCount += 1;
  const apiCall = buildCapturedApiTiming(state, input);
  const latestCapturedCall = state.apiCalls[state.apiCalls.length - 1];

  if (
    state.apiCalls.length >= MAX_API_CALLS &&
    latestCapturedCall !== undefined &&
    apiCall.startedAtMs >= latestCapturedCall.startedAtMs
  ) {
    return;
  }

  state.apiCalls.push(apiCall);
  state.apiCalls.sort((left, right) => left.startedAtMs - right.startedAtMs);

  if (state.apiCalls.length > MAX_API_CALLS) {
    state.apiCalls.length = MAX_API_CALLS;
  }
}

export function flushMobileLaunchTiming(reason: FlushReason = "manual"): void {
  const state = getActiveState();
  if (!state) {
    return;
  }

  state.flushed = true;
  if (state.timeoutId !== undefined) {
    clearTimeout(state.timeoutId);
    state.timeoutId = undefined;
  }

  const totalMs = roundMs(elapsedSinceStart(state));
  const slow = totalMs >= SLOW_LAUNCH_MS;
  const warn = slow || reason === "timeout" || reason === "error";
  const shouldLog = warn || Math.random() < NORMAL_SAMPLE_RATE;

  if (!shouldLog) {
    return;
  }

  const attrs = buildLaunchAttributes(state, totalMs, slow, reason);
  if (warn) {
    Sentry.logger.warn("mobile_launch_timing", attrs);
    return;
  }

  Sentry.logger.info("mobile_launch_timing", attrs);
}

export function sanitizeEndpointGroup(endpoint: string): string {
  return sanitizePathLikeValue(endpoint);
}

export function sanitizeRouteFamily(route: string): string {
  return getAppRouteFamilyTemplate(route) ?? sanitizePathLikeValue(route);
}

function getActiveState(): LaunchState | null {
  if (!launchState || launchState.flushed) {
    return null;
  }
  return launchState;
}

function nowMs(): number {
  if (globalThis.performance?.now) {
    return globalThis.performance.now();
  }
  return Date.now();
}

function elapsedSinceStart(state: LaunchState): number {
  return nowMs() - state.startedAtMs;
}

function roundMs(value: number): number {
  return Math.max(0, Math.round(value));
}

function createLaunchId(): string {
  if (globalThis.crypto?.randomUUID) {
    return globalThis.crypto.randomUUID();
  }
  return `launch-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}

function registerFlushHandlers(): void {
  const state = launchState;
  const browserWindow = globalThis.window;
  if (!state || browserWindow === undefined) {
    return;
  }

  state.timeoutId = setTimeout(() => {
    flushMobileLaunchTiming("timeout");
  }, TIMEOUT_FLUSH_MS);

  browserWindow.addEventListener(
    "pagehide",
    () => {
      flushMobileLaunchTiming("pagehide");
    },
    { once: true }
  );

  browserWindow.addEventListener(
    "error",
    () => {
      flushMobileLaunchTiming("error");
    },
    { once: true }
  );

  browserWindow.addEventListener(
    "unhandledrejection",
    () => {
      flushMobileLaunchTiming("error");
    },
    { once: true }
  );
}

async function captureDeviceInfo(): Promise<void> {
  const state = getActiveState();
  if (!state) {
    return;
  }

  const { Device } = await import("@capacitor/device");
  const info = await Device.getInfo();
  const activeState = getActiveState();
  if (!activeState) {
    return;
  }

  activeState.deviceInfo = {
    ...getOptionalDeviceInfoAttr("platform", sanitizeShortValue(info.platform)),
    ...getOptionalDeviceInfoAttr(
      "operating_system",
      sanitizeShortValue(info.operatingSystem)
    ),
    ...getOptionalDeviceInfoAttr(
      "os_version",
      sanitizeShortValue(info.osVersion)
    ),
    ...getOptionalDeviceInfoAttr("model", sanitizeShortValue(info.model)),
    ...getOptionalDeviceInfoAttr(
      "manufacturer",
      sanitizeShortValue(info.manufacturer)
    ),
    is_virtual: info.isVirtual,
    ...getOptionalDeviceInfoAttr(
      "web_view_version",
      sanitizeShortValue(info.webViewVersion)
    ),
  };
}

function recordMeasuredStep(
  state: LaunchState,
  stepName: string,
  startedAtMs: number,
  status: "ok" | "error"
): void {
  if (state.flushed) {
    return;
  }

  const durationMs = nowMs() - startedAtMs;
  state.steps[stepName] = {
    offset_ms: roundMs(startedAtMs - state.startedAtMs),
    duration_ms: roundMs(durationMs),
    status,
  };
  addStepBreadcrumb(`${stepName}_${status}`, startedAtMs - state.startedAtMs);
}

function addStepBreadcrumb(stepName: string, offsetMs: number): void {
  Sentry.addBreadcrumb({
    category: "mobile_launch",
    level: "info",
    message: stepName,
    data: {
      offset_ms: roundMs(offsetMs),
    },
  });
}

function buildLaunchAttributes(
  state: LaunchState,
  totalMs: number,
  slow: boolean,
  reason: FlushReason
): Record<string, unknown> {
  return {
    launch_id: state.launchId,
    total_ms: totalMs,
    platform: state.platform,
    app_version: state.appVersion,
    route_family: sanitizeRouteFamily(globalThis.location?.pathname ?? "/"),
    slow,
    flush_reason: reason,
    steps: state.steps,
    api: buildApiSummary(state),
    ...(state.deviceInfo ? { device: state.deviceInfo } : {}),
  };
}

function buildApiSummary(state: LaunchState): Record<string, unknown> {
  const firstCalls = state.apiCalls.map(toApiTiming);
  const slowest = [...state.apiCalls]
    .sort((left, right) => right.duration_ms - left.duration_ms)
    .slice(0, SLOWEST_API_CALLS)
    .map(toApiTiming);

  return {
    total_count: state.apiTotalCount,
    captured_count: state.apiCalls.length,
    dropped_count: Math.max(0, state.apiTotalCount - state.apiCalls.length),
    first_calls: firstCalls,
    slowest_calls: slowest,
  };
}

function buildCapturedApiTiming(
  state: LaunchState,
  input: ApiRequestTimingInput
): CapturedApiTiming {
  return {
    startedAtMs: input.startedAtMs,
    method: sanitizeHttpMethod(input.method),
    status: input.status,
    duration_ms: roundMs(input.durationMs),
    start_offset_ms: roundMs(input.startedAtMs - state.startedAtMs),
    endpoint_group: sanitizeEndpointGroup(input.endpoint),
  };
}

function toApiTiming({
  method,
  status,
  duration_ms,
  start_offset_ms,
  endpoint_group,
}: CapturedApiTiming): ApiTiming {
  return {
    method,
    status,
    duration_ms,
    start_offset_ms,
    endpoint_group,
  };
}

function sanitizeHttpMethod(method: string): string {
  const normalized = method.trim().toUpperCase();
  if (/^[A-Z]{3,10}$/.test(normalized)) {
    return normalized;
  }
  return "UNKNOWN";
}

function sanitizePathLikeValue(value: string): string {
  const path = extractPathWithoutQuery(value);
  const segments = path
    .split("/")
    .map((segment) => segment.trim())
    .filter(Boolean);

  if (segments.length === 0) {
    return "/";
  }

  const safeSegments = segments.map((segment, index) =>
    sanitizePathSegment(
      index > 0
        ? {
            segment,
            previousSegment: segments[index - 1] ?? "",
          }
        : {
            segment,
          }
    )
  );

  return `/${safeSegments.join("/")}`;
}

function getAppRouteFamilyTemplate(route: string): string | undefined {
  const segments = getRouteSegments(route);

  if (segments.length === 0) {
    return undefined;
  }

  const matchingPattern = ROUTE_FAMILY_PATTERNS.find((pattern) =>
    matchesRouteFamilyPattern(pattern, segments)
  );

  return matchingPattern?.template ?? getUserRouteTemplate(segments);
}

function getRouteSegments(route: string): string[] {
  return extractPathWithoutQuery(route)
    .split("/")
    .map((segment) => safeDecodeURIComponent(segment.trim()).toLowerCase())
    .filter(Boolean);
}

function getUserRouteTemplate(segments: readonly string[]): string | undefined {
  if (STATIC_TOP_LEVEL_ROUTE_SEGMENTS.has(segments[0] ?? "")) {
    return undefined;
  }

  if (segments.length === 1) {
    return "/[user]";
  }

  if (segments.length === 2 && USER_ROUTE_TAB_SEGMENTS.has(segments[1] ?? "")) {
    return `/[user]/${segments[1]}`;
  }

  return undefined;
}

function matchesRouteFamilyPattern(
  pattern: RouteFamilyPattern,
  segments: readonly string[]
): boolean {
  let segmentIndex = 0;

  for (const patternSegment of pattern.segments) {
    if (typeof patternSegment === "string") {
      if (segments[segmentIndex] !== patternSegment) {
        return false;
      }

      segmentIndex += 1;
      continue;
    }

    if (patternSegment.kind === "param") {
      const segment = segments[segmentIndex];
      if (
        segment === undefined ||
        patternSegment.excludedValues?.has(segment)
      ) {
        return false;
      }

      segmentIndex += 1;
      continue;
    }

    return matchesRouteCatchAll(patternSegment, segments, segmentIndex);
  }

  return segmentIndex === segments.length;
}

function matchesRouteCatchAll(
  patternSegment: Extract<RoutePatternSegment, { readonly kind: "catchAll" }>,
  segments: readonly string[],
  segmentIndex: number
): boolean {
  const remainingCount = segments.length - segmentIndex;

  if (remainingCount === 0) {
    return patternSegment.optional;
  }

  const firstRemainingSegment = segments[segmentIndex];
  if (
    firstRemainingSegment !== undefined &&
    patternSegment.excludedValues?.has(firstRemainingSegment)
  ) {
    return false;
  }

  return true;
}

function routeParam(excludedValues?: ReadonlySet<string>): RoutePatternSegment {
  if (excludedValues) {
    return { kind: "param", excludedValues };
  }

  return { kind: "param" };
}

function routeCatchAll(
  optional: boolean,
  excludedValues?: ReadonlySet<string>
): RoutePatternSegment {
  if (excludedValues) {
    return { kind: "catchAll", optional, excludedValues };
  }

  return { kind: "catchAll", optional };
}

function extractPathWithoutQuery(value: string): string {
  const trimmed = value.trim();
  if (trimmed.length === 0) {
    return "/";
  }

  try {
    const url = new URL(trimmed, "https://launch.local");
    return url.pathname || "/";
  } catch {
    return trimmed.split(/[?#]/, 1)[0] || "/";
  }
}

function sanitizePathSegment({
  segment,
  previousSegment,
}: {
  readonly segment: string;
  readonly previousSegment?: string;
}): string {
  const decoded = safeDecodeURIComponent(segment);
  const lower = decoded.toLowerCase();
  const previousLower = previousSegment?.toLowerCase();

  if (looksLikeSensitiveIdentifier(decoded)) {
    return getIdentifierPlaceholder(decoded);
  }

  if (shouldRedactAfterParent(previousLower, lower)) {
    return ":id";
  }

  return sanitizeStaticSegment(lower);
}

function shouldRedactAfterParent(
  previousSegment: string | undefined,
  currentSegment: string
): boolean {
  return (
    previousSegment !== undefined &&
    IDENTIFIER_PARENT_SEGMENTS.has(previousSegment) &&
    !STATIC_ACTION_SEGMENTS.has(currentSegment)
  );
}

function looksLikeSensitiveIdentifier(segment: string): boolean {
  return (
    WALLET_ADDRESS_PATTERN.test(segment) ||
    UUID_PATTERN.test(segment) ||
    LONG_HEX_PATTERN.test(segment) ||
    LONG_TOKEN_PATTERN.test(segment) ||
    NUMERIC_PATTERN.test(segment) ||
    segment.startsWith("@")
  );
}

function getIdentifierPlaceholder(segment: string): string {
  if (WALLET_ADDRESS_PATTERN.test(segment)) {
    return ":wallet";
  }
  if (UUID_PATTERN.test(segment)) {
    return ":uuid";
  }
  if (segment.startsWith("@")) {
    return ":handle";
  }
  return ":id";
}

function sanitizeStaticSegment(segment: string): string {
  const sanitized = segment.replace(/[^a-z0-9._-]/g, "_").slice(0, 64);
  return sanitized.length > 0 ? sanitized : ":segment";
}

function sanitizeAttributeKey(value: string): string {
  const sanitized = value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9_./-]/g, "_")
    .slice(0, 80);
  return sanitized.length > 0 ? sanitized : "unknown_step";
}

function sanitizeShortValue(value: string | undefined): string | undefined {
  if (typeof value !== "string") {
    return undefined;
  }

  const sanitized = value.replace(/[^a-zA-Z0-9 ._-]/g, "_").slice(0, 80);
  return sanitized.length > 0 ? sanitized : undefined;
}

function getOptionalDeviceInfoAttr<K extends keyof DeviceInfoAttrs>(
  key: K,
  value: DeviceInfoAttrs[K]
): Pick<DeviceInfoAttrs, K> | Record<string, never> {
  if (value === undefined) {
    return {};
  }
  return { [key]: value } as Pick<DeviceInfoAttrs, K>;
}

function safeDecodeURIComponent(value: string): string {
  try {
    return decodeURIComponent(value);
  } catch {
    return value;
  }
}
