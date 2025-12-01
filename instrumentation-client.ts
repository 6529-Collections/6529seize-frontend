// This file configures the initialization of Sentry on the client.
// The added config here will be used whenever a users loads a page in their browser.
// https://docs.sentry.io/platforms/javascript/guides/nextjs/

import * as Sentry from "@sentry/nextjs";
import {publicEnv} from "@/config/env";
import { isIndexedDBError } from "@/utils/error-sanitizer";

const sentryEnabled = !!publicEnv.SENTRY_DSN;
const isProduction = publicEnv.NODE_ENV === "production";
const dsn = publicEnv.SENTRY_DSN;

Sentry.init({
  dsn: sentryEnabled ? dsn : undefined,
  enabled: sentryEnabled,

  // Add optional integrations for additional features
  integrations: [
    Sentry.replayIntegration(),
  ],

  // Define how likely traces are sampled. Adjust this value in production, or use tracesSampler for greater control.
  tracesSampleRate: 1,
  // Enable logs to be sent to Sentry
  enableLogs: true,

  // Define how likely Replay events are sampled.
  // This sets the sample rate to be 10%. You may want this to be 100% while
  // in development and sample at a lower rate in production
  replaysSessionSampleRate: sentryEnabled && isProduction ? 0.1 : 0,

  // Define how likely Replay events are sampled when an error occurs.
  replaysOnErrorSampleRate: sentryEnabled && isProduction ? 1.0 : 0,

  // Enable sending user PII (Personally Identifiable Information)
  // https://docs.sentry.io/platforms/javascript/guides/nextjs/configuration/options/#sendDefaultPii
  sendDefaultPii: true,

  beforeSend(event, hint) {
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
    
    return event;
  },
});

if (typeof window !== "undefined") {
  window.addEventListener("error", (event) => {
    if (isIndexedDBError(event.error)) {
      event.preventDefault();
      console.warn(
        "[IndexedDB] Connection lost. This is usually recoverable by refreshing the page.",
        event.error
      );
    }
  });

  window.addEventListener("unhandledrejection", (event) => {
    if (isIndexedDBError(event.reason)) {
      event.preventDefault();
      console.warn(
        "[IndexedDB] Unhandled promise rejection due to IndexedDB connection loss. This is usually recoverable by refreshing the page.",
        event.reason
      );
    }
  });
}

export const onRouterTransitionStart = Sentry.captureRouterTransitionStart;
