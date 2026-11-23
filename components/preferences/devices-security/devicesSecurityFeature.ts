import { isE2eeEnabled } from "@/config/e2eeEnv";
import { isSignedMessagesEnabled } from "@/lib/device-signing/feature";

/**
 * Devices & security exists while either permission it manages is enabled
 * in this build: signed posts or encrypted DMs (and their backup).
 */
export const isDevicesSecurityEnabled = (): boolean =>
  isSignedMessagesEnabled() || isE2eeEnabled();
