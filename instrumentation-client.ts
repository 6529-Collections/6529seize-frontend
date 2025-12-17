// This file configures client-side instrumentation in Next.js 15.3+
// It is auto-discovered by Next.js and runs before your application's frontend code starts executing.
// https://nextjs.org/docs/app/api-reference/file-conventions/instrumentation-client

import { publicEnv } from "@/config/env";
import {
  INDEXEDDB_ERROR_MESSAGE,
  isIndexedDBError,
} from "@/utils/error-sanitizer";
import { shouldFilterByFilenameExceptions } from "@/utils/sentry-client-filters";
import * as Sentry from "@sentry/nextjs";

const sentryEnabled = !!publicEnv.SENTRY_DSN;
const isProduction = publicEnv.NODE_ENV === "production";
const dsn = publicEnv.SENTRY_DSN;

const noisyPatterns = [
  "EmptyRanges",
  "ResizeObserver loop limit exceeded",
  "Non-Error promise rejection captured",
];

const referenceErrors = ["__firefox__"];

const URL_REGEX = /\(([^)]+?)\)/;

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

  const frames = event.exception?.values?.[0]?.stacktrace?.frames;
  return shouldFilterByFilenameExceptions(frames, hint);
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

function extractUrlFromError(error: TypeError, event: Sentry.Event): string {
  const urlMatch = URL_REGEX.exec(error.message.slice(0, 2048));
  if (urlMatch?.[1]) {
    return urlMatch[1];
  }

  const fetchBreadcrumb = event.breadcrumbs?.find(
    (crumb) => crumb.category === "fetch" || crumb.type === "http"
  );
  if (fetchBreadcrumb?.data?.url) {
    return fetchBreadcrumb.data.url;
  }
  if (event.request?.url) {
    return event.request.url;
  }
  return "unknown";
}

function isNetworkError(errorMessage: string): boolean {
  const normalized = errorMessage.toLowerCase();
  return (
    normalized.includes("failed to fetch") ||
    normalized.includes("load failed") ||
    normalized.includes("networkerror") ||
    normalized.includes("network error") ||
    normalized.includes("network request failed") ||
    /\bnetwork\b/.test(normalized)
  );
}

function handleNetworkError(
  event: Sentry.Event,
  error: TypeError,
  value: Sentry.Exception | undefined
): void {
  if (!isNetworkError(error.message)) {
    return;
  }

  const url = extractUrlFromError(error, event);
  const normalized = error.message.toLowerCase();
  const transformedMessage = normalized.includes("network")
    ? `Network error: ${error.message} (${url})`
    : `Network request failed. Please check your connection and try again. (${url})`;

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
  event.fingerprint = ["network-error"];
}

Sentry.init({
  dsn: sentryEnabled ? dsn : undefined,
  enabled: sentryEnabled,

  integrations: [Sentry.replayIntegration()],

  tracesSampleRate: 0.1,

  enableLogs: true,

  replaysSessionSampleRate: sentryEnabled && isProduction ? 0.1 : 0,

  replaysOnErrorSampleRate: sentryEnabled && isProduction ? 1.0 : 0,

  sendDefaultPii: true,

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

    if ((error && isIndexedDBError(error)) || (message && isIndexedDBError(message))) {
      handleIndexedDBError(event);
    }

    if (error instanceof TypeError) {
      handleNetworkError(event, error, value);
    }

    return event;
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
