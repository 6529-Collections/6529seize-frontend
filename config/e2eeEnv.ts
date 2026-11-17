import { publicEnv } from "@/config/env";
import { isE2eeFlagEnabled } from "@/config/e2eeFlag";

/** Enables the create control for the staging rollout. */
export function isE2eePollCreationEnabled(): boolean {
  return isE2eeFlagEnabled(publicEnv.NEXT_PUBLIC_E2EE_POLLS_ENABLED);
}

/** Whether end-to-end encrypted DMs and groups are enabled in this build. */
export function isE2eeEnabled(): boolean {
  return isE2eeFlagEnabled(publicEnv.NEXT_PUBLIC_E2EE_DM_ENABLED);
}
