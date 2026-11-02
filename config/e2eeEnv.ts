import { publicEnv } from "@/config/env";
import { isE2eeFlagEnabled } from "@/config/e2eeFlag";

/**
 * Whether end-to-end encrypted DMs and groups are enabled in this build.
 * The value is baked at build time (staging sets it; production leaves it
 * unset). When off, encrypted routes 404 and every E2EE surface renders
 * nothing.
 */
export function isE2eeEnabled(): boolean {
  return isE2eeFlagEnabled(publicEnv.NEXT_PUBLIC_E2EE_DM_ENABLED);
}
