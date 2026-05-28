import { publicEnv } from "@/config/env";
import { Capacitor } from "@capacitor/core";
import * as Sentry from "@sentry/nextjs";
import {
  sanitizeEndpointGroup,
  sanitizeRouteFamily,
} from "./mobileLaunchTimingSanitizers";

const SLOW_LAUNCH_MS = 3000;
const NORMAL_SAMPLE_RATE = 0.05;
const TIMEOUT_FLUSH_MS = 15000;
const MAX_API_CALLS = 10;
const SLOWEST_API_CALLS = 5;

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
    delete state.timeoutId;
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
