import { publicEnv } from "@/config/env";

/** Signed messages (device-key signed drop writes) are staged behind a flag. */
export const isSignedMessagesEnabled = (): boolean =>
  publicEnv.NEXT_PUBLIC_FEATURE_SIGNED_MESSAGES === "true";

/**
 * App device grants (6529 Mobile and Desktop sign one EIP-712 grant for
 * signed messages and encrypted messages). Off until the grant wording is
 * owner-approved; see lib/device-signing/app-grant.ts.
 */
export const isAppDeviceGrantsEnabled = (): boolean =>
  publicEnv.NEXT_PUBLIC_FEATURE_APP_DEVICE_GRANTS === "true";
