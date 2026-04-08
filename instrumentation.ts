import { publicEnv } from "@/config/env";

const sentryEnabled = !!publicEnv.SENTRY_DSN;
const serverInstrumentationEnabled =
  process.env["SENTRY_SERVER_INSTRUMENTATION"] !== "false";

export async function register() {
  if (!sentryEnabled) return;
  if (!serverInstrumentationEnabled) return;
  if (publicEnv.NEXT_RUNTIME === "nodejs") {
    await import("./sentry.server.config");
  }

  if (publicEnv.NEXT_RUNTIME === "edge") {
    await import("./sentry.edge.config");
  }
}

export const onRequestError = sentryEnabled
  ? async (
      ...args: Parameters<
        (typeof import("@sentry/nextjs"))["captureRequestError"]
      >
    ) => {
      if (!serverInstrumentationEnabled) return;
      const Sentry = await import("@sentry/nextjs");
      return Sentry.captureRequestError(...args);
    }
  : undefined;
