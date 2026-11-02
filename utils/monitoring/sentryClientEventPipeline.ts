// Filters, normalizes and sanitizes outgoing Sentry client events and
// transactions. instrumentation-client.ts loads this module on the first
// event instead of shipping it in every page's startup bundle; breadcrumbs,
// spans and logs keep their synchronous sanitizers there.

import type * as Sentry from "@sentry/nextjs";
import { isIndexedDBError } from "@/utils/error-sanitizer";
import { enrichCyclicJsonTimerEvent } from "@/utils/monitoring/cyclicJsonTimerDiagnostics";
import {
  sanitizeSentryEvent,
  sanitizeUrlString,
} from "@/utils/sentry-sanitizer";
import {
  getLowValueNetworkErrorDecision,
  getNetworkErrorMessageTargetUrl,
  getThirdPartyTelemetrySpanTargetKey,
  redactDropReactionFailureIdentifiers,
  shouldFilterAnonymousUnsafeEvalCspError,
  shouldFilterAppleWebKitSortedTrackListTypeError,
  shouldFilterByFilenameExceptions,
  shouldFilterBrowserExtensionMessagingConnectionError,
  shouldFilterBrowserExtensionSendMessageError,
  shouldFilterBrowserExtensionWalletRejection,
  shouldFilterBraveWalletPageEvaluationError,
  shouldFilterChromeMobileIosInjectedGaError,
  shouldFilterPoperBlockerOrphanFetchRejection,
  shouldFilterExpectedWaveRequestReplacementAbort,
  shouldFilterCoinbaseWalletLinkWebSocket1006,
  shouldFilterDisconnectedWalletProviderRejection,
  shouldFilterInjectedIosAutoplayNotAllowedError,
  shouldFilterInjectedProviderProxyStartsWithError,
  shouldFilterInjectedWalletCollision,
  shouldFilterInstagramPageHideBridgeError,
  shouldFilterKnownWalletProviderObjectRejection,
  shouldFilterReactDomInsertBeforeNotFoundError,
  shouldFilterReactDomRemoveChildNotFoundError,
  shouldFilterInjectedWasmCspUnsafeEval,
  shouldFilterRabbyChromeUserRejectedRequest,
  shouldFilterRabbyMobileRainbowKitNotFoundError,
  shouldFilterRabbyMobileUserRejectedRequest,
  shouldFilterSentryRouteParameterizationError,
  shouldFilterTalismanExtensionOnboardingError,
  shouldFilterThirdPartyTelemetryNetworkError,
  shouldFilterThirdPartyTelemetrySpan,
  shouldFilterTwitterCurrentInsetReferenceError,
  shouldFilterTwitterConfigReferenceError,
  shouldFilterWalletConnectStaleSessionTopic,
  tagSampledLowValueNetworkError,
  type SentryTransactionSpan,
} from "@/utils/sentry-client-filters";
import { shouldFilterGifPickerTenorError } from "@/utils/sentry-gif-picker-tenor-filter";

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
const NEXT_SERVER_COMPONENT_RENDER_ERROR_MESSAGE =
  "An error occurred in the Server Components render. The specific message is omitted in production builds to avoid leaking sensitive details. A digest property is included on this error instance which may provide additional details about the nature of the error.";
const NEXT_SERVER_COMPONENT_DIGEST_PATTERN = /^[A-Za-z0-9_-]{1,64}$/;
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

  if (shouldFilterBraveWalletPageEvaluationError(event, hint)) {
    return true;
  }

  if (shouldFilterDisconnectedWalletProviderRejection(event, hint)) {
    return true;
  }

  if (shouldFilterKnownWalletProviderObjectRejection(event, hint)) {
    return true;
  }

  if (shouldFilterRabbyChromeUserRejectedRequest(event, hint)) {
    return true;
  }

  if (shouldFilterRabbyMobileUserRejectedRequest(event, hint)) {
    return true;
  }

  if (shouldFilterInjectedWasmCspUnsafeEval(event, hint)) {
    return true;
  }

  if (shouldFilterAnonymousUnsafeEvalCspError(event, hint)) {
    return true;
  }

  if (shouldFilterInjectedProviderProxyStartsWithError(event)) {
    return true;
  }

  if (shouldFilterBrowserExtensionMessagingConnectionError(event, hint)) {
    return true;
  }

  if (shouldFilterBrowserExtensionSendMessageError(event, hint)) {
    return true;
  }

  if (shouldFilterBrowserExtensionWalletRejection(event, hint)) {
    return true;
  }

  if (shouldFilterPoperBlockerOrphanFetchRejection(event, hint)) {
    return true;
  }

  if (shouldFilterExpectedWaveRequestReplacementAbort(event)) {
    return true;
  }

  if (shouldFilterCoinbaseWalletLinkWebSocket1006(event, hint)) {
    return true;
  }

  if (shouldFilterWalletConnectStaleSessionTopic(event, hint)) {
    return true;
  }

  if (shouldFilterTalismanExtensionOnboardingError(event, hint)) {
    return true;
  }

  if (shouldFilterTwitterConfigReferenceError(event)) {
    return true;
  }

  if (shouldFilterTwitterCurrentInsetReferenceError(event)) {
    return true;
  }

  if (shouldFilterInstagramPageHideBridgeError(event, hint)) {
    return true;
  }

  if (shouldFilterReactDomInsertBeforeNotFoundError(event)) {
    return true;
  }

  if (shouldFilterReactDomRemoveChildNotFoundError(event)) {
    return true;
  }

  if (shouldFilterGifPickerTenorError(event)) {
    return true;
  }

  if (shouldFilterSentryRouteParameterizationError(event, hint)) {
    return true;
  }

  if (shouldFilterAppleWebKitSortedTrackListTypeError(event)) {
    return true;
  }

  if (shouldFilterChromeMobileIosInjectedGaError(event)) {
    return true;
  }

  if (shouldFilterInjectedIosAutoplayNotAllowedError(event)) {
    return true;
  }

  if (shouldFilterRabbyMobileRainbowKitNotFoundError(event, hint)) {
    return true;
  }

  if (shouldFilterThirdPartyTelemetryNetworkError(event)) {
    return true;
  }

  const frames = event.exception?.values?.[0]?.stacktrace?.frames;
  return shouldFilterByFilenameExceptions(frames, hint);
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function getNextServerComponentDigest(value: unknown): string | undefined {
  if (!isRecord(value)) {
    return undefined;
  }

  const digest = value["digest"];
  return typeof digest === "string" &&
    NEXT_SERVER_COMPONENT_DIGEST_PATTERN.test(digest)
    ? digest
    : undefined;
}

function enrichNextServerComponentRenderError(
  event: Sentry.Event,
  hint: Sentry.EventHint | undefined,
  message: string
): void {
  if (message !== NEXT_SERVER_COMPONENT_RENDER_ERROR_MESSAGE) {
    return;
  }

  const digest =
    getNextServerComponentDigest(hint?.originalException) ??
    getNextServerComponentDigest(hint?.syntheticException);
  if (!digest) {
    return;
  }

  event.tags = {
    ...event.tags,
    next_error_digest: digest,
  };
  if (!event.fingerprint?.length) {
    event.fingerprint = ["next-server-component-render", digest];
  }
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
  const mechanism = event.exception?.values?.[0]?.mechanism;
  if (mechanism) {
    mechanism.handled = true;
  }
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

/** The client `beforeSend` pipeline: returns the event to send, or null to drop it. */
export function processSentryClientEvent(
  event: Sentry.ErrorEvent,
  hint: Sentry.EventHint
): Sentry.ErrorEvent | null {
  if (shouldFilterEvent(event, hint)) {
    return null;
  }

  enrichCyclicJsonTimerEvent(event, hint);

  const error = hint?.originalException ?? hint?.syntheticException;
  const value = event.exception?.values?.[0];
  const message =
    (typeof value?.value === "string" && value.value) ||
    getFallbackMessage(hint) ||
    (typeof event.message === "string" ? event.message : "");

  enrichNextServerComponentRenderError(event, hint, message);

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
  // Raw browser failures can become wrapped network messages only after
  // normalization, so telemetry targets get one post-normalization pass.
  if (shouldFilterThirdPartyTelemetryNetworkError(event)) {
    return null;
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
    redactDropReactionFailureIdentifiers(event);
  }

  return sanitizeSentryEvent(event);
}

/** The client `beforeSendTransaction` pipeline. */
export function processSentryClientTransaction(
  event: Sentry.TransactionEvent
): Sentry.TransactionEvent | null {
  return sanitizeSentryEvent(
    filterNoisyThirdPartyTransactionSpans(event) as Sentry.TransactionEvent
  );
}
