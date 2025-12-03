// This file configures client-side instrumentation in Next.js 15.3+
// It is auto-discovered by Next.js and runs before your application's frontend code starts executing.
// https://nextjs.org/docs/app/api-reference/file-conventions/instrumentation-client

import { publicEnv } from "@/config/env";
import {
  INDEXEDDB_ERROR_MESSAGE,
  isIndexedDBError,
} from "@/utils/error-sanitizer";
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

const filenameExceptions = ["inpage.js"];

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
    const value = event.exception?.values?.[0];

    let fallbackMessage = "";
    if (typeof hint?.originalException === "string") {
      fallbackMessage = hint.originalException;
    } else if (hint?.originalException instanceof Error) {
      fallbackMessage = hint.originalException.message;
    }

    const message = value?.value ?? fallbackMessage;
    const errorType = value?.type;

    if (typeof message === "string") {
      if (noisyPatterns.some((p) => message.includes(p))) {
        return null;
      }

      if (
        (errorType === "ReferenceError" || errorType === "TypeError") &&
        referenceErrors.some((p) => message.includes(p))
      ) {
        return null;
      }
    }

    const frames = event.exception?.values?.[0]?.stacktrace?.frames;
    if (
      frames?.some((frame: any) =>
        filenameExceptions.some(
          (pattern) =>
            frame?.filename?.includes(pattern) ||
            frame?.abs_path?.includes(pattern)
        )
      )
    ) {
      return null;
    }

    const error = hint.originalException || hint.syntheticException;

    if (error && isIndexedDBError(error)) {
      event.level = "warning";
      event.tags = {
        ...event.tags,
        errorType: "indexeddb",
        handled: true,
      };
      event.fingerprint = ["indexeddb-connection-lost"];
    }

    if (error instanceof TypeError) {
      const errorMessage = error.message.toLowerCase();
      if (
        errorMessage.includes("load failed") ||
        errorMessage.includes("failed to fetch") ||
        errorMessage.includes("network")
      ) {
        let url = "unknown";
        const urlMatch = error.message.match(/\(([^)]+?)\)/);
        if (urlMatch && urlMatch[1].length < 2048) {
          url = urlMatch[1];
        } else {
          const fetchBreadcrumb = event.breadcrumbs?.find(
            (crumb: any) => crumb.category === "fetch" || crumb.type === "http"
          );
          if (fetchBreadcrumb?.data?.url) {
            url = fetchBreadcrumb.data.url;
          } else if (event.request?.url) {
            url = event.request.url;
          }
        }

        const transformedMessage = errorMessage.includes("network")
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
