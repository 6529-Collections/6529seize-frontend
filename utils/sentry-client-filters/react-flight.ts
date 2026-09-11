import type {
  SentryBreadcrumb,
  SentryClientEvent,
  SentryStackFrame,
} from "./types";
import {
  getBreadcrumbValues,
  getRequestPathname,
  hasWavesRoute,
} from "./value-utils";
import {
  getBreadcrumbFailureKind,
  getBreadcrumbUrl,
  getBreadcrumbUrlIsFirstParty,
  getBreadcrumbUrlIsFirstPartyApi,
  isHttpBreadcrumb,
} from "./network";

const connectionClosedMessage = "Connection closed.";
const maximumTransportFailureAgeSeconds = 10;
const reactFlightRawChunkPath =
  "app:///_next/static/chunks/08qcqj3ricazz.js";

function isObservedReactFlightCloseFrame(frame: SentryStackFrame): boolean {
  return (
    frame.filename === reactFlightRawChunkPath &&
    frame.abs_path === reactFlightRawChunkPath &&
    frame.function === "eo" &&
    frame.lineno === 2 &&
    frame.colno === 31038 &&
    frame.in_app === true
  );
}

function hasObservedReactFlightCloseFrame(
  frames: SentryStackFrame[] | undefined
): boolean {
  // beforeSend sees this minified frame before Sentry applies source maps.
  // Keep the cohort-backed shape exact so build or minifier drift fails open.
  return (
    Array.isArray(frames) &&
    frames.length === 1 &&
    isObservedReactFlightCloseFrame(frames[0]!)
  );
}

function isFirstPartyApiTransportFailure(
  breadcrumb: SentryBreadcrumb
): boolean {
  const pathname = getRequestPathname(getBreadcrumbUrl(breadcrumb));
  return (
    isHttpBreadcrumb(breadcrumb) &&
    breadcrumb.level === "error" &&
    getBreadcrumbFailureKind(breadcrumb) === "transport" &&
    getBreadcrumbUrlIsFirstParty(breadcrumb) === true &&
    getBreadcrumbUrlIsFirstPartyApi(breadcrumb) === true &&
    pathname?.startsWith("/api/") === true
  );
}

function isRecentCausalBreadcrumb(
  eventTimestamp: number | undefined,
  breadcrumb: SentryBreadcrumb
): boolean {
  const breadcrumbTimestamp = breadcrumb.timestamp;
  if (
    typeof eventTimestamp !== "number" ||
    !Number.isFinite(eventTimestamp) ||
    typeof breadcrumbTimestamp !== "number" ||
    !Number.isFinite(breadcrumbTimestamp)
  ) {
    return false;
  }

  const failureAgeSeconds = eventTimestamp - breadcrumbTimestamp;
  return (
    failureAgeSeconds >= 0 &&
    failureAgeSeconds <= maximumTransportFailureAgeSeconds
  );
}

function hasRecentFirstPartyApiTransportFailure(
  event: SentryClientEvent
): boolean {
  return getBreadcrumbValues(event).some(
    (breadcrumb) =>
      isFirstPartyApiTransportFailure(breadcrumb) &&
      isRecentCausalBreadcrumb(event.timestamp, breadcrumb)
  );
}

export function shouldFilterReactFlightConnectionClosedError(
  event: SentryClientEvent
): boolean {
  const values = event.exception?.values;
  if (!Array.isArray(values) || values.length !== 1) {
    return false;
  }

  const [value] = values;
  if (
    value?.type !== "Error" ||
    value.value !== connectionClosedMessage ||
    value.mechanism?.type !== "generic" ||
    value.mechanism.handled !== true ||
    !hasObservedReactFlightCloseFrame(value.stacktrace?.frames) ||
    !hasWavesRoute(event)
  ) {
    return false;
  }

  return hasRecentFirstPartyApiTransportFailure(event);
}
