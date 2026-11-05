// This file configures client-side instrumentation in Next.js 15.3+
// It is auto-discovered by Next.js and runs before your application's frontend code starts executing.
// https://nextjs.org/docs/app/api-reference/file-conventions/instrumentation-client

import { publicEnv } from "@/config/env";
import {
  SENTRY_APPLICATION_KEY,
  SENTRY_THIRD_PARTY_FILTER_BEHAVIOUR,
} from "@/config/sentryThirdPartyFiltering";
import {
  INDEXEDDB_ERROR_MESSAGE,
  isIndexedDBError,
} from "@/utils/error-sanitizer";
import { startMobileLaunchTiming } from "@/utils/monitoring/mobileLaunchTiming";
import { sanitizeSentryLog } from "@/utils/monitoring/sentryLogSanitizer";
import { installCyclicJsonTimerDiagnostics } from "@/utils/monitoring/cyclicJsonTimerDiagnostics";
import {
  sanitizeSentryBreadcrumb,
  sanitizeSentrySpan,
} from "@/utils/sentry-sanitizer";
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

type SentryClientEventPipeline = Pick<
  typeof import("@/utils/monitoring/sentryClientEventPipeline"),
  "processSentryClientEvent" | "processSentryClientTransaction"
>;

let sentryClientEventPipeline: Promise<SentryClientEventPipeline> | undefined;

// Event filters, normalizers and redaction (~37 modules) load with the first
// event instead of with every page. If the module cannot load, the event is
// dropped rather than sent without its noise filters and identifier
// redaction; a later event retries the import.
function loadSentryClientEventPipeline(): Promise<SentryClientEventPipeline> {
  sentryClientEventPipeline ??=
    import("@/utils/monitoring/sentryClientEventPipeline").then(
      ({ processSentryClientEvent, processSentryClientTransaction }) => ({
        processSentryClientEvent,
        processSentryClientTransaction,
      }),
      (error: unknown) => {
        sentryClientEventPipeline = undefined;
        throw error;
      }
    );
  return sentryClientEventPipeline;
}

Sentry.init({
  ...(dsn && { dsn }),
  enabled: sentryEnabled,

  integrations(integrations) {
    const configuredIntegrations = [
      ...integrations,
      Sentry.thirdPartyErrorFilterIntegration({
        filterKeys: [SENTRY_APPLICATION_KEY],
        behaviour: SENTRY_THIRD_PARTY_FILTER_BEHAVIOUR,
      }),
    ];

    // next.config.ts inlines process.env["SENTRY_REPLAY_ENABLED"] at build time,
    // so the bundler drops this branch (and the Replay SDK, ~40 KB gzip) from
    // every build where Replay is not opted in. Keep the literal comparison
    // here; wrapping it in a variable defeats the dead-code elimination.
    if (process.env["SENTRY_REPLAY_ENABLED"] === "true" && replayEnabled) {
      return [...configuredIntegrations, Sentry.replayIntegration()];
    }
    return configuredIntegrations;
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

  // Structured logs skip beforeSend, so they are sanitized here as well.
  beforeSendLog(log) {
    return sanitizeSentryLog(log);
  },

  beforeSendSpan(span) {
    return sanitizeSentrySpan(span);
  },

  beforeSend(event, hint) {
    return loadSentryClientEventPipeline().then(
      (pipeline) => pipeline.processSentryClientEvent(event, hint),
      () => null
    );
  },

  beforeSendTransaction(event) {
    return loadSentryClientEventPipeline().then(
      (pipeline) => pipeline.processSentryClientTransaction(event),
      () => null
    );
  },
});

if (sentryEnabled && isProduction) {
  try {
    // Install after Sentry so BrowserApiErrors remains the sole event capture
    // path. This wrapper only associates sampled scheduling provenance with
    // the original Error and then rethrows it unchanged.
    installCyclicJsonTimerDiagnostics();
  } catch {
    // Diagnostics must never affect application startup.
  }
}

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
