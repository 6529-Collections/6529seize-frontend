import { publicEnv } from "@/config/env";

/**
 * Chat windowing (WAVES-PLAN 0.11), staged behind a build flag: the wave chat
 * mounts only the rows near the viewport, in normal order anchored to the
 * newest message, instead of every loaded row in a reversed scroll box.
 */
export const isChatWindowingEnabled = (): boolean =>
  publicEnv.NEXT_PUBLIC_FEATURE_CHAT_WINDOWING === "true";
