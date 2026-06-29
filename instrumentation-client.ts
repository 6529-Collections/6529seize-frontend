// This file configures client-side instrumentation in Next.js 15.3+
// It is auto-discovered by Next.js and runs before your application's frontend code starts executing.
// https://nextjs.org/docs/app/api-reference/file-conventions/instrumentation-client

import { publicEnv } from "@/config/env";
import {
  INDEXEDDB_ERROR_MESSAGE,
  isIndexedDBError,
} from "@/utils/error-sanitizer";
import { startMobileLaunchTiming } from "@/utils/monitoring/mobileLaunchTiming";
import {
  sanitizeSentryBreadcrumb,
  sanitizeSentryEvent,
  sanitizeUrlString,
} from "@/utils/sentry-sanitizer";
import {
  getLowValueNetworkErrorDecision,
  getNetworkErrorMessageTargetUrl,
  getThirdPartyTelemetrySpanTargetKey,
  shouldFilterByFilenameExceptions,
  shouldFilterCoinbaseWalletLinkWebSocket1006,
  shouldFilterDisconnectedWalletProviderRejection,
  shouldFilterInjectedWalletCollision,
  shouldFilterReactDomInsertBeforeNotFoundError,
  shouldFilterInjectedWasmCspUnsafeEval,
  shouldFilterRabbyMobileUserRejectedRequest,
  shouldFilterSentryRouteParameterizationError,
  shouldFilterThirdPartyTelemetrySpan,
  shouldFilterTwitterConfigReferenceError,
  tagSampledLowValueNetworkError,
  type SentryTransactionSpan,
} from "@/utils/sentry-client-filters";
import * as Sentry from "@sentry/nextjs";

try {
  startMobileLaunchTiming();
} catch {
  // Monitoring must not affect app startup.
}

const sentryEnabled = !!publicEnv.SENTRY_DSN;
const isProduction = publicEnv.NODE_ENV === "production";
const dsn = publicEnv.SENTRY_DSN;
const replayEnabled =
  sentryEnabled && isProduction && publicEnv.SENTRY_REPLAY_ENABLED === "true";

const noisyPatterns = [
  "EmptyRanges",
  "ResizeObserver loop limit exceeded",
  "Non-Error promise rejection captured",
];

const referenceErrors = ["__firefox__"];

const URL_REGEX = /\(([^)]+?)\)/;
const APP_WRAPPED_NETWORK_ERROR_PREFIXES = [
  "Network request failed.",
  "Network error:",
];
const RAW_BROWSER_NETWORK_ERROR_PATTERNS = [
  /\bfailed to fetch\b/i,
  /\bload failed\b/i,
  /\bnetwork\s*error\b/i,
  /\bnetwork connection was lost\b/i,
  /\bnetwork request failed\b/i,
];
type SentryTransactionEvent = Sentry.Event & {
  spans?: SentryTransactionSpan[] | undefined;
  tags?: Record<string, unknown> | undefined;
  extra?: Record<string, unknown> | undefined;
};
type NetworkErrorSamplingMessageSnapshot = {
  exceptionValue?: string | undefined;
  eventMessage?: string | undefined;
  errorMessage: string;
};

function getFallbackMessage(hint?: Sentry.EventHint): string {
  if (typeof hint?.originalException === "string") {
    return hint.originalException;
  }
  if (hint?.originalException instanceof Error) {
    return hint.originalException.message;
  }
  return "";
}

function shouldFilterNoisyPatterns(message: string): boolean {
  return noisyPatterns.some((p) => message.includes(p));
}

function shouldFilterReferenceErrors(
  message: string,
  errorType: string | undefined
): boolean {
  if (errorType !== "ReferenceError" && errorType !== "TypeError") {
    return false;
  }
  return referenceErrors.some((p) => message.includes(p));
}

function shouldFilterEvent(
  event: Sentry.Event,
  hint?: Sentry.EventHint
): boolean {
  const value = event.exception?.values?.[0];
  const fallbackMessage = getFallbackMessage(hint);
  const message = value?.value ?? fallbackMessage;

  if (typeof message === "string") {
    if (shouldFilterNoisyPatterns(message)) {
      return true;
    }
    if (shouldFilterReferenceErrors(message, value?.type)) {
      return true;
    }
  }

  if (shouldFilterInjectedWalletCollision(event, hint)) {
    return true;
  }

  if (shouldFilterDisconnectedWalletProviderRejection(event, hint)) {
    return true;
  }

  if (shouldFilterRabbyMobileUserRejectedRequest(event, hint)) {
    return true;
  }

  if (shouldFilterInjectedWasmCspUnsafeEval(event, hint)) {
    return true;
  }

  if (shouldFilterCoinbaseWalletLinkWebSocket1006(event, hint)) {
    return true;
  }

  if (shouldFilterTwitterConfigReferenceError(event)) {
    return true;
  }

  if (shouldFilterReactDomInsertBeforeNotFoundError(event)) {
    return true;
  }

  if (shouldFilterSentryRouteParameterizationError(event)) {
    return true;
  }

  const frames = event.exception?.values?.[0]?.stacktrace?.frames;
  return shouldFilterByFilenameExceptions(frames, hint);
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function filterNoisyThirdPartyTransactionSpans(
  event: Sentry.Event
): Sentry.Event {
  const transactionEvent = event as SentryTransactionEvent;
  const spans = transactionEvent.spans;
  if (!Array.isArray(spans) || spans.length === 0) {
    return event;
  }

  const filteredSpanKeys = new Set<string>();
  const keptSpans = spans.filter((span) => {
    if (!shouldFilterThirdPartyTelemetrySpan(span)) {
      return true;
    }

    const targetKey = getThirdPartyTelemetrySpanTargetKey(span);
    if (targetKey) {
      filteredSpanKeys.add(targetKey);
    }
    return false;
  });

  if (keptSpans.length === spans.length) {
    return event;
  }

  const existingTags = isRecord(transactionEvent.tags)
    ? transactionEvent.tags
    : {};
  const existingExtra = isRecord(transactionEvent.extra)
    ? transactionEvent.extra
    : {};

  const nextEvent: SentryTransactionEvent = {
    ...transactionEvent,
    spans: keptSpans,
    tags: {
      ...existingTags,
      third_party_span_noise_filtered: "true",
    },
    extra: {
      ...existingExtra,
      filteredThirdPartySpanCount: spans.length - keptSpans.length,
      filteredThirdPartySpanKeys: Array.from(filteredSpanKeys).sort(
        (left, right) => left.localeCompare(right)
      ),
    },
  };

  return nextEvent;
}

function handleIndexedDBError(event: Sentry.Event): void {
  event.level = "warning";
  event.tags = {
    ...event.tags,
    errorType: "indexeddb",
    handled: true,
  };
  event.fingerprint = ["indexeddb-connection-lost"];
}

function isParenthesizedUrlLike(value: string | undefined): boolean {
  const candidate = value?.trim();
  return (
    !!candidate &&
    (candidate.startsWith("/") || /^https?:\/\//i.test(candidate))
  );
}

function extractUrlFromError(error: Error, event: Sentry.Event): string {
  const urlMatch = URL_REGEX.exec(error.message.slice(0, 2048));
  const parenthesizedValue = urlMatch?.[1];
  if (isParenthesizedUrlLike(parenthesizedValue)) {
    return String(sanitizeUrlString(parenthesizedValue));
  }

  const networkMessageTargetUrl = getNetworkErrorMessageTargetUrl(event);
  if (networkMessageTargetUrl) {
    return String(sanitizeUrlString(networkMessageTargetUrl));
  }

  if (event.request?.url) {
    return String(sanitizeUrlString(event.request.url));
  }
  return "unknown";
}

function isNetworkError(errorMessage: string): boolean {
  return RAW_BROWSER_NETWORK_ERROR_PATTERNS.some((pattern) =>
    pattern.test(errorMessage)
  );
}

function isRawBrowserNetworkError(error: Error): boolean {
  return (
    error.name === "NetworkError" ||
    (error instanceof TypeError && isNetworkError(error.message))
  );
}

function hasUrlInParentheses(message: string): boolean {
  const urlMatch = URL_REGEX.exec(message.slice(0, 2048));
  return isParenthesizedUrlLike(urlMatch?.[1]);
}

function isAppWrappedApiNetworkError(errorMessage: string): boolean {
  return (
    APP_WRAPPED_NETWORK_ERROR_PREFIXES.some((prefix) =>
      errorMessage.startsWith(prefix)
    ) && hasUrlInParentheses(errorMessage)
  );
}

function getRawBrowserNetworkErrorMessage(
  event: Sentry.Event,
  error: Error
): string {
  const url = extractUrlFromError(error, event);
  return `Network request failed. Please check your connection and try again. (${url})`;
}

function getAppWrappedNetworkErrorMessage(
  event: Sentry.Event,
  error: Error
): string {
  const urlMatch = URL_REGEX.exec(error.message.slice(0, 2048));
  const prefix = error.message.slice(0, urlMatch?.index ?? 0).trimEnd();
  const url = extractUrlFromError(error, event);
  return `${prefix} (${url})`;
}

function handleNetworkError(
  event: Sentry.Event,
  error: Error,
  value: Sentry.Exception | undefined
): void {
  const isAppWrappedError = isAppWrappedApiNetworkError(error.message);
  const isRawBrowserError = isRawBrowserNetworkError(error);

  if (!isAppWrappedError && !isRawBrowserError) {
    return;
  }

  const transformedMessage = isAppWrappedError
    ? getAppWrappedNetworkErrorMessage(event, error)
    : getRawBrowserNetworkErrorMessage(event, error);

  if (value) {
    value.value = transformedMessage;
  }
  if (event.message) {
    event.message = transformedMessage;
  }

  event.level = "warning";
  event.tags = {
    ...event.tags,
    errorType: "network",
    handled: true,
  };
  if (!event.fingerprint || event.fingerprint.length === 0) {
    event.fingerprint = ["network-error"];
  }
}

function getNetworkErrorSamplingMessageSnapshot(
  event: Sentry.Event,
  error: Error,
  value: Sentry.Exception | undefined
): NetworkErrorSamplingMessageSnapshot {
  return {
    exceptionValue: typeof value?.value === "string" ? value.value : undefined,
    eventMessage: typeof event.message === "string" ? event.message : undefined,
    errorMessage: error.message,
  };
}

function getNetworkErrorSamplingEvent(
  event: Sentry.Event,
  snapshot: NetworkErrorSamplingMessageSnapshot
): Sentry.Event {
  const originalExceptionValue =
    snapshot.exceptionValue ?? snapshot.errorMessage;
  const values = event.exception?.values;

  return {
    ...event,
    message: snapshot.eventMessage ?? snapshot.errorMessage,
    ...(event.exception
      ? {
          exception: {
            ...event.exception,
            ...(values
              ? {
                  values: values.map((exceptionValue, index) =>
                    index === 0
                      ? {
                          ...exceptionValue,
                          value: originalExceptionValue,
                        }
                      : exceptionValue
                  ),
                }
              : {}),
          },
        }
      : {}),
  };
}

Sentry.init({
  ...(dsn && { dsn }),
  enabled: sentryEnabled,

  integrations(integrations) {
    if (!replayEnabled) return integrations;
    return [...integrations, Sentry.replayIntegration()];
  },

  tracesSampleRate: 0.1,

  enableLogs: true,

  // Session Replay is opt-in because it can capture sensitive user content.
  replaysSessionSampleRate: replayEnabled ? 0.1 : 0,

  replaysOnErrorSampleRate: replayEnabled ? 1.0 : 0,

  // Default to NOT sending PII unless explicitly reviewed and required.
  // https://docs.sentry.io/platforms/javascript/guides/nextjs/configuration/options/#sendDefaultPii
  sendDefaultPii: false,

  beforeBreadcrumb(breadcrumb) {
    return sanitizeSentryBreadcrumb(breadcrumb);
  },

  beforeSend(event, hint) {
    if (shouldFilterEvent(event, hint)) {
      return null;
    }

    const error = hint?.originalException ?? hint?.syntheticException;
    const value = event.exception?.values?.[0];
    const message =
      (typeof value?.value === "string" && value.value) ||
      getFallbackMessage(hint) ||
      (typeof event.message === "string" ? event.message : "");

    if (
      (error && isIndexedDBError(error)) ||
      (message && isIndexedDBError(message))
    ) {
      handleIndexedDBError(event);
    }

    const networkErrorSamplingMessageSnapshot =
      error instanceof Error
        ? getNetworkErrorSamplingMessageSnapshot(event, error, value)
        : undefined;
    if (error instanceof Error) {
      handleNetworkError(event, error, value);
    }

    const networkErrorSamplingEvent = networkErrorSamplingMessageSnapshot
      ? getNetworkErrorSamplingEvent(event, networkErrorSamplingMessageSnapshot)
      : event;
    const networkNoiseDecision = getLowValueNetworkErrorDecision(
      networkErrorSamplingEvent
    );
    if (networkNoiseDecision === "drop") {
      return null;
    }
    if (networkNoiseDecision === "keep_sampled") {
      tagSampledLowValueNetworkError(event);
    }

    return sanitizeSentryEvent(event);
  },

  beforeSendTransaction(event) {
    return sanitizeSentryEvent(
      filterNoisyThirdPartyTransactionSpans(event) as any
    );
  },
});

if (globalThis.window !== undefined) {
  globalThis.window.addEventListener("error", (event) => {
    if (isIndexedDBError(event.error)) {
      event.preventDefault();
      console.warn(`[IndexedDB] ${INDEXEDDB_ERROR_MESSAGE}`, event.error);
    }
  });

  globalThis.window.addEventListener("unhandledrejection", (event) => {
    if (isIndexedDBError(event.reason)) {
      event.preventDefault();
      console.warn(
        `[IndexedDB] Unhandled promise rejection: ${INDEXEDDB_ERROR_MESSAGE}`,
        event.reason
      );
    }
  });
}

export const onRouterTransitionStart = Sentry.captureRouterTransitionStart;
