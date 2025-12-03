// This file configures the initialization of Sentry on the server.
// The config you add here will be used whenever the server handles a request.
// https://docs.sentry.io/platforms/javascript/guides/nextjs/

import { publicEnv } from "@/config/env";
import {
  filterTunnelRouteErrors,
  tagSecurityProbes,
} from "@/config/sentryProbes";
import * as Sentry from "@sentry/nextjs";

const dsn = publicEnv.SENTRY_DSN;

Sentry.init({
  dsn,
  // Only enable Sentry if a DSN is actually set
  enabled: Boolean(dsn),

  // Define how likely traces are sampled.
  tracesSampleRate: 0.1,

  // Enable logs to be sent to Sentry
  enableLogs: true,

  // Enable sending user PII (Personally Identifiable Information)
  // https://docs.sentry.io/platforms/javascript/guides/nextjs/configuration/options/#sendDefaultPii
  sendDefaultPii: true,

  // ------------------------------------------------------------
  // Handle obvious bot / exploit probes more gently
  // ------------------------------------------------------------
  beforeSend(event, hint) {
    const filtered = filterTunnelRouteErrors(event, hint);
    if (filtered === null) {
      return null;
    }
    return tagSecurityProbes(filtered);
  },
});
