import { browserUnhandledRejectionMechanism } from "./constants";
import type {
  SentryBreadcrumb,
  SentryClientEvent,
  SentryExceptionValue,
} from "./types";
import {
  getBreadcrumbValues,
  getContextString,
  getRequestHeaderString,
  getRuntimeUserAgentString,
  getStringValue,
  isRecord,
} from "./value-utils";

const coinbaseAnalyticsAbortErrorValue = "AbortError: AbortError";
const expectedDomExceptionCode = "20";
const maximumCausalBreadcrumbDistance = 15;
const maximumCausalTimeDifferenceSeconds = 1;
const iosUserAgentPattern = /\b(?:iphone|ipad|ipod)\b/i;
const coinbaseAnalyticsIndexedDbGetErrorMessage =
  "Analytics SDK: Error: IndexedDB:Get:InternalError undefined";

function hasNoStackFrames(value: SentryExceptionValue): boolean {
  const stacktrace: unknown = value.stacktrace;
  if (stacktrace === undefined) {
    return true;
  }

  if (!isRecord(stacktrace)) {
    return false;
  }

  const frames = stacktrace["frames"];
  return Array.isArray(frames) && frames.length === 0;
}

function isIosOsValue(value: string): boolean {
  return value === "iOS" || value.startsWith("iOS ");
}

function hasIosPlatformEvidence(event: SentryClientEvent): boolean {
  const osValues = [
    getContextString(event, "os", "name"),
    getStringValue(event.tags?.["os.name"]),
    getStringValue(event.tags?.["os"]),
  ].filter((value): value is string => value !== undefined);

  if (osValues.length > 0) {
    return osValues.every(isIosOsValue);
  }

  const userAgent =
    getRequestHeaderString(event, "user-agent") ??
    getRuntimeUserAgentString();
  return userAgent !== undefined && iosUserAgentPattern.test(userAgent);
}

function isCoinbaseAnalyticsIndexedDbGetErrorBreadcrumb(
  breadcrumb: SentryBreadcrumb | null | undefined
): boolean {
  if (!isRecord(breadcrumb)) {
    return false;
  }

  return (
    breadcrumb.category === "console" &&
    breadcrumb.level === "error" &&
    breadcrumb.message === coinbaseAnalyticsIndexedDbGetErrorMessage
  );
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

function hasRecentCoinbaseAnalyticsIndexedDbGetErrorBreadcrumb(
  event: SentryClientEvent
): boolean {
  const recentBreadcrumbs = getBreadcrumbValues(event).slice(
    -maximumCausalBreadcrumbDistance
  );

  return recentBreadcrumbs.some(
    (breadcrumb) =>
      isCoinbaseAnalyticsIndexedDbGetErrorBreadcrumb(breadcrumb) &&
      isWithinCausalTimeWindow(event.timestamp, breadcrumb.timestamp)
  );
}

export function shouldFilterCoinbaseAnalyticsIndexedDBAbort(
  event: SentryClientEvent
): boolean {
  const values = event.exception?.values;
  if (!Array.isArray(values) || values.length !== 1) {
    return false;
  }

  const [value] = values;
  if (
    value?.type !== "Error" ||
    value.value !== coinbaseAnalyticsAbortErrorValue ||
    value.mechanism?.type !== browserUnhandledRejectionMechanism ||
    value.mechanism.handled !== false ||
    event.tags?.["DOMException.code"] !== expectedDomExceptionCode ||
    !hasNoStackFrames(value) ||
    !hasIosPlatformEvidence(event)
  ) {
    return false;
  }

  return hasRecentCoinbaseAnalyticsIndexedDbGetErrorBreadcrumb(event);
}
