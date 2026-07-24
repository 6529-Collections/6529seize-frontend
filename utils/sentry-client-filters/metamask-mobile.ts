import {
  metaMaskMobileContextTokens,
  mobileSafariWebViewContextTokens,
  routeParameterizationContextKeys,
  routeParameterizationTagKeys,
  sentryRouteParameterizationMechanismType,
  sentryRouteParameterizationMessage,
  webViewUserAgentTokens,
} from "./constants";
import { hasNativeJsonStringifyFrame } from "./app-frame-utils";
import type {
  SentryClientEvent,
  SentryStackFrame,
} from "./types";
import {
  getBreadcrumbValues,
  getFramePaths,
  getRequestHeaderString,
  getRoutePathFromString,
  getRuntimeUserAgentString,
  getStringValue,
  hasRouteParameterizationRoute,
  isRecord,
  isRouteParameterizationRoutePath,
  uniqueStrings,
} from "./value-utils";

const anonymousUnsafeEvalRawChunkPathPattern =
  /^app:\/\/\/_next\/static\/chunks\/[a-z0-9._~-]+\.js$/i;
const messagesRoutePath = "/messages";
const metaMaskNavigationMinimumDelaySeconds = 0.075;
const metaMaskNavigationMaximumDelaySeconds = 0.25;
const cyclicJsonTimerScheduleOriginTag =
  "cyclic_json_timer_schedule_origin";
const sentryBrowserHelpersPathToken = "@sentry/browser/src/helpers.ts";
const sentryBrowserRawTimerWrapperLineNumber = 7;
const sentryBrowserRawTimerWrapperColumnNumber = 4858;

function hasRouteParameterizationNavigationBreadcrumb(
  event: SentryClientEvent
): boolean {
  return getBreadcrumbValues(event).some((breadcrumb) => {
    const data = breadcrumb.data;
    if (breadcrumb.category !== "navigation" || !data) {
      return false;
    }

    if (typeof data["from"] !== "string" || typeof data["to"] !== "string") {
      return false;
    }

    return [data["from"], data["to"]].some((candidate) =>
      isRouteParameterizationRoutePath(getRoutePathFromString(candidate))
    );
  });
}

export function hasRouteParameterizationRouteEvidence(
  event: SentryClientEvent
): boolean {
  return (
    hasRouteParameterizationRoute(event) ||
    hasRouteParameterizationNavigationBreadcrumb(event)
  );
}

function getRouteParameterizationContextValues(
  event: SentryClientEvent
): string[] {
  const contextValues = routeParameterizationContextKeys.flatMap((key) => {
    const context = event.contexts?.[key];
    return isRecord(context) ? Object.values(context) : [];
  });
  const tagValues = routeParameterizationTagKeys.map(
    (key) => event.tags?.[key]
  );

  return uniqueStrings(
    [...contextValues, ...tagValues].filter(
      (value): value is string => typeof value === "string" && value.length > 0
    )
  );
}

function getRouteParameterizationUserAgentValues(
  event: SentryClientEvent
): string[] {
  const candidates = [
    getRequestHeaderString(event, "user-agent"),
    getStringValue(event.tags?.["user_agent"]),
    getStringValue(event.tags?.["userAgent"]),
    getRuntimeUserAgentString(),
  ];

  return candidates.filter(
    (value): value is string => typeof value === "string" && value.length > 0
  );
}

function matchesContextToken(value: string, tokens: string[]): boolean {
  const normalized = value.toLowerCase();
  return tokens.some((token) => normalized.includes(token));
}

export function hasMetaMaskMobileWebViewContext(
  event: SentryClientEvent
): boolean {
  const contextValues = getRouteParameterizationContextValues(event);
  const userAgentValues = getRouteParameterizationUserAgentValues(event);
  const values = [...contextValues, ...userAgentValues];

  return (
    values.some((value) =>
      matchesContextToken(value, metaMaskMobileContextTokens)
    ) &&
    values.some(
      (value) =>
        matchesContextToken(value, mobileSafariWebViewContextTokens) ||
        matchesContextToken(value, webViewUserAgentTokens)
    )
  );
}

function hasIosContext(event: SentryClientEvent): boolean {
  const values = [
    ...getRouteParameterizationContextValues(event),
    ...getRouteParameterizationUserAgentValues(event),
  ];

  return values.some((value) => {
    const normalized = value.toLowerCase();
    return (
      /\bios(?:\s|$)/.test(normalized) ||
      /\b(?:iphone|ipad|ipod)\b/.test(normalized)
    );
  });
}

function isMessagesRoute(value: string | undefined): boolean {
  if (!value) {
    return false;
  }

  const path = getRoutePathFromString(value);
  return (
    path === messagesRoutePath ||
    path === `${messagesRoutePath}/` ||
    path?.startsWith(`${messagesRoutePath}/`) === true
  );
}

function hasMessagesRoute(event: SentryClientEvent): boolean {
  return [
    event.transaction,
    getStringValue(event.tags?.["transaction"]),
    getStringValue(event.tags?.["url"]),
    event.request?.url,
  ].some(isMessagesRoute);
}

function isSentryBrowserTimerWrapperFrame(frame: SentryStackFrame): boolean {
  const paths = getFramePaths(frame);
  if (paths.length === 0) {
    return false;
  }

  // These fail-open coordinates are tied to the observed @sentry/browser 10.45.0 frame.
  const isSymbolicatedWrapper =
    frame.function === "r" &&
    frame.lineno === 111 &&
    frame.colno === 58 &&
    paths.every((path) => path.includes(sentryBrowserHelpersPathToken));
  if (isSymbolicatedWrapper) {
    return true;
  }

  return (
    frame.function === "n" &&
    frame.lineno === sentryBrowserRawTimerWrapperLineNumber &&
    frame.colno === sentryBrowserRawTimerWrapperColumnNumber &&
    paths.every((path) => anonymousUnsafeEvalRawChunkPathPattern.test(path))
  );
}

function hasMetaMaskNavigationFrameSignature(
  frames: SentryStackFrame[] | undefined
): boolean {
  return (
    Array.isArray(frames) &&
    frames.length === 2 &&
    hasNativeJsonStringifyFrame(frames) &&
    frames.some(isSentryBrowserTimerWrapperFrame)
  );
}

function hasFirstPartyDiagnosticProvenance(event: SentryClientEvent): boolean {
  const scheduleOrigin = event.tags?.[cyclicJsonTimerScheduleOriginTag];
  return scheduleOrigin === "first_party" || scheduleOrigin === "mixed";
}

function hasRecentMessagesNavigation(event: SentryClientEvent): boolean {
  const eventTimestamp = event.timestamp;
  if (typeof eventTimestamp !== "number" || !Number.isFinite(eventTimestamp)) {
    return false;
  }

  return getBreadcrumbValues(event).some((breadcrumb) => {
    const breadcrumbTimestamp = breadcrumb.timestamp;
    const data = breadcrumb.data;
    if (
      breadcrumb.category !== "navigation" ||
      typeof breadcrumbTimestamp !== "number" ||
      !Number.isFinite(breadcrumbTimestamp) ||
      !data ||
      typeof data["from"] !== "string" ||
      typeof data["to"] !== "string" ||
      !isMessagesRoute(data["to"])
    ) {
      return false;
    }

    const delaySeconds = eventTimestamp - breadcrumbTimestamp;
    return (
      delaySeconds >= metaMaskNavigationMinimumDelaySeconds &&
      delaySeconds <= metaMaskNavigationMaximumDelaySeconds
    );
  });
}

export function shouldFilterMetaMaskMobileSpaNavigationCyclicJsonError(
  event: SentryClientEvent
): boolean {
  const values = event.exception?.values;
  if (!Array.isArray(values) || values.length !== 1) {
    return false;
  }

  const [value] = values;
  if (
    value?.type !== "TypeError" ||
    value.value !== sentryRouteParameterizationMessage
  ) {
    return false;
  }

  const mechanism = value.mechanism;
  if (
    mechanism?.type !== sentryRouteParameterizationMechanismType ||
    mechanism.handled !== false
  ) {
    return false;
  }

  if (hasFirstPartyDiagnosticProvenance(event)) {
    return false;
  }

  return (
    hasMetaMaskNavigationFrameSignature(value.stacktrace?.frames) &&
    hasMetaMaskMobileWebViewContext(event) &&
    hasIosContext(event) &&
    hasMessagesRoute(event) &&
    hasRecentMessagesNavigation(event)
  );
}
