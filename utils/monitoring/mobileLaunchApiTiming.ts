import { sanitizeEndpointGroup } from "./mobileLaunchTimingSanitizers";
import { bucketMs } from "./mobileLaunchTimingBuckets";

export const MAX_API_CALLS = 10;
const SLOWEST_API_CALLS = 5;

export type ApiStatus = number | "aborted" | "network_error" | "unknown";

type ApiTiming = {
  readonly method: string;
  readonly status: ApiStatus;
  readonly duration_ms: number;
  readonly start_offset_ms: number;
  readonly endpoint_group: string;
};

export type CapturedApiTiming = ApiTiming & {
  readonly startedAtMs: number;
};

export type ApiRequestTimingInput = {
  readonly endpoint: string;
  readonly method: string;
  readonly status: ApiStatus;
  readonly startedAtMs: number;
  readonly durationMs: number;
};

type ApiTimingState = {
  readonly startedAtMs: number;
  readonly apiCalls: readonly CapturedApiTiming[];
  readonly apiTotalCount: number;
  readonly slowestApiCall?: CapturedApiTiming;
};

export function buildApiSummary(
  state: Pick<ApiTimingState, "apiCalls" | "apiTotalCount">
): Record<string, unknown> {
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

export function buildFlatApiAttributes(
  state: Pick<ApiTimingState, "apiCalls" | "apiTotalCount" | "slowestApiCall">
): Record<string, number | string> {
  const attrs: Record<string, number | string> = {
    api_total_count: state.apiTotalCount,
    api_captured_count: state.apiCalls.length,
    api_dropped_count: Math.max(0, state.apiTotalCount - state.apiCalls.length),
  };

  const slowestApiCall = state.slowestApiCall;
  if (slowestApiCall === undefined) {
    return attrs;
  }

  attrs["api_slowest_endpoint"] = slowestApiCall.endpoint_group;
  attrs["api_slowest_ms"] = slowestApiCall.duration_ms;
  attrs["api_slowest_bucket"] = bucketMs(slowestApiCall.duration_ms);
  attrs["api_slowest_method"] = slowestApiCall.method;
  attrs["api_slowest_status"] = String(slowestApiCall.status);
  attrs["api_slowest_start_offset_ms"] = slowestApiCall.start_offset_ms;

  return attrs;
}

export function buildCapturedApiTiming(
  state: Pick<ApiTimingState, "startedAtMs">,
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

function roundMs(value: number): number {
  return Math.max(0, Math.round(value));
}
