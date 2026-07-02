import { publicEnv } from "@/config/env";
import { Capacitor } from "@capacitor/core";
import * as Sentry from "@sentry/nextjs";
import {
  sanitizeEndpointGroup,
  sanitizeRouteFamily,
} from "./mobileLaunchTimingSanitizers";

const SLOW_LAUNCH_MS = 3000;
const NORMAL_SAMPLE_RATE = 0.05;
const FOCUSED_ROUTE_SAMPLE_RATE = 1;
const TIMEOUT_FLUSH_MS = 15000;
const MAX_API_CALLS = 10;
const SLOWEST_API_CALLS = 5;

type FlushReason =
  | "shell_paint"
  | "waves_content_visible"
  | "timeout"
  | "pagehide"
  | "error"
  | "manual";

type ApiStatus = number | "aborted" | "network_error" | "unknown";

export type MobileLaunchAuthState =
  | "anonymous"
  | "authenticated_profile"
  | "authenticated_proxy_profile"
  | "authorized_wallet_no_profile"
  | "connected_wallet_needs_auth"
  | "initializing"
  | "stored_auth_disconnected"
  | "wallet_auth_disabled";

export type MobileLaunchWalletConnectionState =
  | "initializing"
  | "disconnected"
  | "connecting"
  | "connected"
  | "error";

export type MobileLaunchAppWalletsState =
  | "supported_empty"
  | "supported_with_wallets"
  | "unsupported";

export type MobileLaunchAppWalletCountBucket = "0" | "1" | "2_5" | "6_plus";

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

type DeviceInfoAttrs = {
  readonly platform?: string;
  readonly operating_system?: string;
  readonly os_version?: string;
  readonly model?: string;
  readonly manufacturer?: string;
  readonly is_virtual?: boolean;
  readonly web_view_version?: string;
};

export type MobileLaunchContext = {
  readonly app_wallet_count_bucket?: MobileLaunchAppWalletCountBucket;
  readonly app_wallets_state?: MobileLaunchAppWalletsState;
  readonly auth_state?: MobileLaunchAuthState;
  readonly wallet_connection_state?: MobileLaunchWalletConnectionState;
};

type LaunchState = {
  readonly launchId: string;
  readonly startedAtMs: number;
  readonly platform: string;
  readonly appVersion: string;
  readonly steps: Record<string, StepTiming>;
  readonly apiCalls: CapturedApiTiming[];
  context: MobileLaunchContext;
  apiTotalCount: number;
  deviceInfo?: DeviceInfoAttrs;
  scheduledFlushId?: ReturnType<typeof setTimeout>;
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

type BuildLaunchAttributesInput = {
  readonly state: LaunchState;
  readonly totalMs: number;
  readonly slow: boolean;
  readonly reason: FlushReason;
  readonly routeFamily: string;
  readonly sampleRate: number;
};

let launchState: LaunchState | null = null;

export function startMobileLaunchTiming(): void {
  if (launchState !== null) {
    return;
  }

  if (typeof window === "undefined") {
    return;
  }

  const isNative = isNativeCapacitorPlatform();
  const startedAtMs = getLaunchStartedAtMs();
  launchState = {
    launchId: createLaunchId(),
    startedAtMs,
    platform: getLaunchPlatform(isNative),
    appVersion: publicEnv.VERSION ?? "unknown",
    steps: {
      start: {
        offset_ms: 0,
      },
    },
    apiCalls: [],
    context: {},
    apiTotalCount: 0,
    flushed: false,
  };

  addStepBreadcrumb("start", 0);
  registerFlushHandlers();
  if (isNative) {
    void captureDeviceInfo().catch(() => undefined);
  }
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

export function setMobileLaunchContext(context: MobileLaunchContext): void {
  const state = getActiveState();
  if (!state) {
    return;
  }

  state.context = {
    ...state.context,
    ...context,
  };
}

export function scheduleMobileLaunchFlush(
  reason: FlushReason = "manual",
  delayMs = 0
): void {
  const state = getActiveState();
  if (!state) {
    return;
  }

  if (state.scheduledFlushId !== undefined) {
    clearTimeout(state.scheduledFlushId);
  }

  state.scheduledFlushId = setTimeout(
    () => {
      const activeState = getActiveState();
      if (!activeState) {
        return;
      }

      delete activeState.scheduledFlushId;
      flushMobileLaunchTiming(reason);
    },
    Math.max(0, delayMs)
  );
}

export function flushMobileLaunchTiming(reason: FlushReason = "manual"): void {
  const state = getActiveState();
  if (!state) {
    return;
  }

  state.flushed = true;
  if (state.scheduledFlushId !== undefined) {
    clearTimeout(state.scheduledFlushId);
    delete state.scheduledFlushId;
  }
  if (state.timeoutId !== undefined) {
    clearTimeout(state.timeoutId);
    delete state.timeoutId;
  }

  const totalMs = roundMs(elapsedSinceStart(state));
  const slow = totalMs >= SLOW_LAUNCH_MS;
  const warn = slow || reason === "timeout" || reason === "error";
  const routeFamily = sanitizeRouteFamily(getCurrentPathname());
  const sampleRate = getSampleRate(routeFamily, state.platform);
  const shouldLog = warn || Math.random() < sampleRate;

  if (!shouldLog) {
    return;
  }

  const attrs = buildLaunchAttributes({
    state,
    totalMs,
    slow,
    reason,
    routeFamily,
    sampleRate,
  });
  if (warn) {
    Sentry.logger.warn("mobile_launch_timing", attrs);
    return;
  }

  Sentry.logger.info("mobile_launch_timing", attrs);
}

function getActiveState(): LaunchState | null {
  if (!launchState || launchState.flushed) {
    return null;
  }
  return launchState;
}

function nowMs(): number {
  if (typeof performance === "undefined") {
    return Date.now();
  }

  return performance.now();
}

function getLaunchStartedAtMs(): number {
  return 0;
}

function elapsedSinceStart(state: LaunchState): number {
  return nowMs() - state.startedAtMs;
}

function roundMs(value: number): number {
  return Math.max(0, Math.round(value));
}

function createLaunchId(): string {
  try {
    return crypto.randomUUID();
  } catch {
    return `launch-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
  }
}

function isNativeCapacitorPlatform(): boolean {
  try {
    return Capacitor.isNativePlatform();
  } catch {
    return false;
  }
}

function getLaunchPlatform(isNative: boolean): string {
  if (isNative) {
    const platform = sanitizeShortValue(getNativePlatform());
    return platform ? `capacitor_${platform}` : "capacitor_unknown";
  }

  return isLikelyMobileWeb() ? "web_mobile" : "web_desktop";
}

function getNativePlatform(): string | undefined {
  try {
    return Capacitor.getPlatform();
  } catch {
    return undefined;
  }
}

function isLikelyMobileWeb(): boolean {
  const navigatorWithUserAgentData = globalThis.navigator as
    | (Navigator & { readonly userAgentData?: { readonly mobile?: boolean } })
    | undefined;

  if (navigatorWithUserAgentData?.userAgentData?.mobile === true) {
    return true;
  }

  if (
    typeof window === "undefined" ||
    typeof window.matchMedia !== "function"
  ) {
    return false;
  }

  return window.matchMedia("(pointer: coarse) and (max-width: 900px)").matches;
}

function getCurrentPathname(): string {
  if (typeof window === "undefined") {
    return "/";
  }

  return window.location.pathname || "/";
}

function registerFlushHandlers(): void {
  const state = launchState;
  if (!state || typeof window === "undefined") {
    return;
  }

  const browserWindow = window;
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

function buildLaunchAttributes({
  state,
  totalMs,
  slow,
  reason,
  routeFamily,
  sampleRate,
}: BuildLaunchAttributesInput): Record<string, unknown> {
  const context =
    Object.keys(state.context).length > 0 ? { context: state.context } : {};

  return {
    launch_id: state.launchId,
    total_ms: totalMs,
    platform: state.platform,
    app_version: state.appVersion,
    route_family: routeFamily,
    sample_rate: sampleRate,
    slow,
    flush_reason: reason,
    ...buildMilestoneAttributes(state),
    ...context,
    steps: state.steps,
    api: buildApiSummary(state),
    ...(state.deviceInfo ? { device: state.deviceInfo } : {}),
  };
}

function getSampleRate(routeFamily: string, platform: string): number {
  if (isFocusedLaunchRoute(routeFamily) && platform !== "web_desktop") {
    return FOCUSED_ROUTE_SAMPLE_RATE;
  }

  return NORMAL_SAMPLE_RATE;
}

function isFocusedLaunchRoute(routeFamily: string): boolean {
  return (
    routeFamily === "/waves" ||
    routeFamily === "/waves/[wave]" ||
    routeFamily === "/waves/create" ||
    routeFamily === "/messages" ||
    routeFamily === "/messages/[wave]" ||
    routeFamily === "/messages/create"
  );
}

function buildMilestoneAttributes(
  state: LaunchState
): Record<string, number | string> {
  const attrs: Record<string, number | string> = {};
  addStepOffsetAttr(attrs, state, "root_layout_reporter_mounted");
  addStepOffsetAttr(attrs, state, "wagmi_capacitor_detected");
  addStepOffsetAttr(attrs, state, "wagmi_init_start");
  addStepOffsetAttr(attrs, state, "wagmi_adapter_created");
  addStepOffsetAttr(attrs, state, "wagmi_ready");
  addStepOffsetAttr(attrs, state, "wagmi_children_unblocked");
  addStepOffsetAttr(attrs, state, "auth_provider_mounted");
  addStepOffsetAttr(attrs, state, "auth_ready");
  addStepOffsetAttr(attrs, state, "first_useful_app_shell");
  addStepOffsetAttr(attrs, state, "waves_layout_mounted");
  addStepOffsetAttr(attrs, state, "waves_first_content_visible");
  addStepOffsetAttr(attrs, state, "waves_content_state_resolved");
  addStepDurationAttr(attrs, state, "wagmi_appkit_init");
  addStepDurationAttr(attrs, state, "wagmi_adapter_ready");
  addStepDurationAttr(attrs, state, "auth_immediate_validation");
  addStepDurationAttr(attrs, state, "app_wallets_secure_storage_support_check");
  addStepDurationAttr(attrs, state, "app_wallets_load");

  const wagmiUnblockedMs = getStepOffsetMs(state, "wagmi_children_unblocked");
  const shellMs = getStepOffsetMs(state, "first_useful_app_shell");
  const wavesContentMs = getStepOffsetMs(state, "waves_first_content_visible");

  if (wagmiUnblockedMs !== undefined) {
    attrs["provider_gate_ms"] = wagmiUnblockedMs;
  }

  if (shellMs !== undefined && wagmiUnblockedMs !== undefined) {
    attrs["shell_after_wagmi_ms"] = roundMs(shellMs - wagmiUnblockedMs);
  }

  if (wavesContentMs !== undefined && wagmiUnblockedMs !== undefined) {
    attrs["waves_after_wagmi_ms"] = roundMs(wavesContentMs - wagmiUnblockedMs);
  }

  return attrs;
}

function addStepOffsetAttr(
  attrs: Record<string, number | string>,
  state: LaunchState,
  stepName: string
): void {
  const offsetMs = getStepOffsetMs(state, stepName);
  if (offsetMs === undefined) {
    return;
  }

  attrs[`step_${stepName}_ms`] = offsetMs;
}

function addStepDurationAttr(
  attrs: Record<string, number | string>,
  state: LaunchState,
  stepName: string
): void {
  const durationMs = state.steps[stepName]?.duration_ms;
  const status = state.steps[stepName]?.status;
  if (durationMs !== undefined) {
    attrs[`duration_${stepName}_ms`] = durationMs;
  }
  if (status !== undefined) {
    attrs[`status_${stepName}`] = status;
  }
}

function getStepOffsetMs(
  state: LaunchState,
  stepName: string
): number | undefined {
  return state.steps[stepName]?.offset_ms;
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
