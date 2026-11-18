import { getAppEnvironment } from "@/config/appEnvironment";
import { publicEnv } from "@/config/env";
import { isE2eeFlagEnabled } from "@/config/e2eeFlag";

/**
 * Whether encrypted read-state sync sends (D175, design P60): devices create
 * a self group and post read positions to it. Baked at build time; on only
 * when encrypted messages are on and the flag is exactly "true". When off,
 * devices still join self groups and apply what other devices send.
 */
export function isE2eeReadSyncEnabled(): boolean {
  return (
    isE2eeFlagEnabled(publicEnv.NEXT_PUBLIC_E2EE_DM_ENABLED) &&
    isE2eeFlagEnabled(publicEnv.NEXT_PUBLIC_E2EE_READ_SYNC)
  );
}

/**
 * Whether Devices shows the read-sync debug row (prxt's staging QA): only
 * with read sync on and never on a production build (6529.io, or an
 * endpoint that does not parse, which counts as production).
 */
export function isE2eeReadSyncDebugShown(): boolean {
  return (
    isE2eeReadSyncEnabled() &&
    !getAppEnvironment(publicEnv.BASE_ENDPOINT).isProduction
  );
}
