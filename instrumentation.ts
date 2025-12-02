import * as Sentry from "@sentry/nextjs";
import {publicEnv} from "@/config/env";

const sentryEnabled = !!publicEnv.SENTRY_DSN;

export async function register() {
  if (!sentryEnabled) return;
  if (publicEnv.NEXT_RUNTIME === 'nodejs') {
    await import('./sentry.server.config');
  }

  if (publicEnv.NEXT_RUNTIME === 'edge') {
    await import('./sentry.edge.config');
  }
}

export const onRequestError = sentryEnabled
  ? Sentry.captureRequestError
  : undefined;
