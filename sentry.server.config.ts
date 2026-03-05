// This file configures the initialization of Sentry on the server.
// The config you add here will be used whenever the server handles a request.
// https://docs.sentry.io/platforms/javascript/guides/nextjs/

import { publicEnv } from "@/config/env";
import {
  filterMalformedNextActionProbeErrors,
  filterServerActionProbeErrors,
  filterTunnelRouteErrors,
  filterWebStreamsProbeErrors,
  tagSecurityProbes,
} from "@/config/sentryProbes";
import {
  sanitizeSentryBreadcrumb,
  sanitizeSentryEvent,
} from "@/utils/sentry-sanitizer";
import * as Sentry from "@sentry/nextjs";

const dsn = publicEnv.SENTRY_DSN;

Sentry.init({
  ...(dsn && { dsn }),

  // Only enable Sentry if a DSN is actually set
  enabled: Boolean(dsn),

  // Define how likely traces are sampled.
  tracesSampleRate: 0.1,

  // Enable logs to be sent to Sentry
  enableLogs: true,

  // Default to NOT sending PII unless explicitly reviewed and required.
  // https://docs.sentry.io/platforms/javascript/guides/nextjs/configuration/options/#sendDefaultPii
  sendDefaultPii: false,

  beforeBreadcrumb(breadcrumb) {
    return sanitizeSentryBreadcrumb(breadcrumb);
  },

  // ------------------------------------------------------------
  // Handle obvious bot / exploit probes more gently
  // ------------------------------------------------------------
  beforeSend(event, hint) {
    const tunnelFiltered = filterTunnelRouteErrors(event, hint);
    if (tunnelFiltered === null) {
      return null;
    }

    const tagged = tagSecurityProbes(tunnelFiltered);
    const actionFiltered = filterServerActionProbeErrors(tagged);
    if (actionFiltered === null) {
      return null;
    }

    const malformedNextActionFiltered =
      filterMalformedNextActionProbeErrors(actionFiltered);
    if (malformedNextActionFiltered === null) {
      return null;
    }

    const webStreamsFiltered = filterWebStreamsProbeErrors(
      malformedNextActionFiltered
    );
    if (webStreamsFiltered === null) {
      return null;
    }

    return sanitizeSentryEvent(webStreamsFiltered);
  },

  beforeSendTransaction(event) {
    return sanitizeSentryEvent(tagSecurityProbes(event as any) as any);
  },
});
