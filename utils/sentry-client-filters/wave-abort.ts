import { browserUnhandledRejectionMechanism } from "./constants";
import type {
  SentryBreadcrumb,
  SentryClientEvent,
  SentryExceptionValue,
} from "./types";
import { getBreadcrumbValues } from "./value-utils";

const expectedWaveAbortErrorValue =
  "AbortError: The user aborted a request.";
const expectedDomExceptionCode = "20";
const maximumCausalBreadcrumbDistance = 15;
const maximumCausalTimeDifferenceSeconds = 1;

function hasNoStackFrames(value: SentryExceptionValue): boolean {
  if (value.stacktrace === undefined) {
    return true;
  }

  const frames = value.stacktrace.frames;
  return Array.isArray(frames) && frames.length === 0;
}

function isExpectedWaveReplacementBreadcrumb(
  breadcrumb: SentryBreadcrumb
): boolean {
  return (
    breadcrumb.category === "wave.request" &&
    breadcrumb.message === "wave_request_aborted" &&
    breadcrumb.data?.["request_kind"] === "background_sync" &&
    breadcrumb.data["trigger"] === "request_replaced"
  );
}

function isWaveAbortBreadcrumb(breadcrumb: SentryBreadcrumb): boolean {
  return (
    breadcrumb.category === "wave.request" &&
    breadcrumb.message === "wave_request_aborted"
  );
}

function getLatestRecentWaveAbortBreadcrumb(
  event: SentryClientEvent
): SentryBreadcrumb | undefined {
  const recentBreadcrumbs = getBreadcrumbValues(event).slice(
    -maximumCausalBreadcrumbDistance
  );

  for (let index = recentBreadcrumbs.length - 1; index >= 0; index -= 1) {
    const breadcrumb = recentBreadcrumbs[index]!;
    if (isWaveAbortBreadcrumb(breadcrumb)) {
      return breadcrumb;
    }
  }

  return undefined;
}

function isWithinCausalTimeWindow(
  eventTimestamp: number | undefined,
  breadcrumbTimestamp: number | undefined
): boolean {
  if (
    typeof eventTimestamp !== "number" ||
    !Number.isFinite(eventTimestamp) ||
    typeof breadcrumbTimestamp !== "number" ||
    !Number.isFinite(breadcrumbTimestamp)
  ) {
    return false;
  }

  const timeDifference = eventTimestamp - breadcrumbTimestamp;
  return (
    timeDifference >= 0 &&
    timeDifference <= maximumCausalTimeDifferenceSeconds
  );
}

export function shouldFilterExpectedWaveRequestReplacementAbort(
  event: SentryClientEvent
): boolean {
  const values = event.exception?.values;
  if (!Array.isArray(values) || values.length !== 1) {
    return false;
  }

  const [value] = values;
  if (
    value?.type !== "Error" ||
    value.value !== expectedWaveAbortErrorValue ||
    value.mechanism?.type !== browserUnhandledRejectionMechanism ||
    value.mechanism.handled !== false ||
    event.tags?.["DOMException.code"] !== expectedDomExceptionCode ||
    !hasNoStackFrames(value)
  ) {
    return false;
  }

  const waveAbortBreadcrumb = getLatestRecentWaveAbortBreadcrumb(event);
  return (
    waveAbortBreadcrumb !== undefined &&
    isExpectedWaveReplacementBreadcrumb(waveAbortBreadcrumb) &&
    isWithinCausalTimeWindow(event.timestamp, waveAbortBreadcrumb.timestamp)
  );
}
