import { publicEnv } from "@/config/env";

/** Signed messages (device-key signed drop writes) are staged behind a flag. */
export const isSignedMessagesEnabled = (): boolean =>
  publicEnv.NEXT_PUBLIC_FEATURE_SIGNED_MESSAGES === "true";
