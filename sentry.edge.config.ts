// This file configures the initialization of Sentry for edge features
// (middleware, edge routes, and so on).
// The config you add here will be used whenever one of the edge features is loaded.
// Note that this config is unrelated to the Vercel Edge Runtime and is also required when running locally.
// https://docs.sentry.io/platforms/javascript/guides/nextjs/

import { publicEnv } from "@/config/env";
import {
  filterTunnelRouteErrors,
  tagSecurityProbes,
} from "@/config/sentryProbes";
import * as Sentry from "@sentry/nextjs";

const dsn = publicEnv.SENTRY_DSN;

Sentry.init({
  ...(dsn && { dsn }),
  enabled: Boolean(dsn),

  // Define how likely traces are sampled.
  tracesSampleRate: 0.1,

  // Enable logs to be sent to Sentry
  enableLogs: true,

  // Enable sending user PII (Personally Identifiable Information)
  sendDefaultPii: true,

  // ------------------------------------------------------------
  // Handle obvious bot / exploit probes more gently (edge)
  // ------------------------------------------------------------
  beforeSend(event: Sentry.ErrorEvent, hint: Sentry.EventHint) {
    const filtered = filterTunnelRouteErrors(event, hint);
    if (filtered === null) {
      return null;
    }
    return tagSecurityProbes(filtered);
  },
});
