import type {
  ConnectionDeviceSetupOutcome,
  ConnectionDeviceSetupStage,
} from "@/lib/device-signing/connection-setup";
import * as Sentry from "@sentry/nextjs";

export type ConnectionShareSetupStage =
  | ConnectionDeviceSetupStage
  | "redeem"
  | "invalid-response"
  | "profile-limit"
  | "persist-session"
  | "missing-envelope"
  | "missing-unlock-key"
  | "unsupported-role"
  | "load-setup";

/** Logs bounded setup states. The client release identifies the loaded build. */
export function reportConnectionShareSetup(
  outcome: ConnectionDeviceSetupOutcome | "failed",
  stage: ConnectionShareSetupStage,
  target: "native" | "desktop"
): void {
  try {
    const attributes = { outcome, stage, target };
    if (outcome === "failed" || outcome === "legacy-device") {
      Sentry.logger.warn("connection_share_secure_setup", attributes);
    } else {
      Sentry.logger.info("connection_share_secure_setup", attributes);
    }
  } catch {
    // Monitoring must not affect acceptance.
  }
}
