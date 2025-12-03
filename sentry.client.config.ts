// sentry.client.config.ts
// This file configures the initialization of Sentry in the browser.
// It is auto-discovered by @sentry/nextjs at build time.
// https://docs.sentry.io/platforms/javascript/guides/nextjs/

import { publicEnv } from "@/config/env";
import * as Sentry from "@sentry/nextjs";

const dsn = publicEnv.SENTRY_DSN;

Sentry.init({
  dsn,
  enabled: Boolean(dsn),

  // Browser performance tracing
  tracesSampleRate: 1,

  // Enable logs to be sent to Sentry
  enableLogs: true,

  // Enable sending user PII (Personally Identifiable Information)
  sendDefaultPii: true,

  // ------------------------------------------------------------
  // Noise filtering (browser junk, extensions, Safari weirdness)
  // ------------------------------------------------------------
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
      const noisyPatterns = [
        "EmptyRanges",
        "ResizeObserver loop limit exceeded",
        "Non-Error promise rejection captured",
      ];

      if (noisyPatterns.some((p) => message.includes(p))) {
        return null;
      }

      const referenceErrors = ["__firefox__"];

      if (
        (errorType === "ReferenceError" || errorType === "TypeError") &&
        referenceErrors.some((p) => message.includes(p))
      ) {
        return null;
      }
    }

    return event;
  },
});
