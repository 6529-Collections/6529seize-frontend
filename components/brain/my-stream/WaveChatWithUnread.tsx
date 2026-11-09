"use client";

import type { ComponentProps } from "react";
import MyStreamWaveChat from "./MyStreamWaveChat";
import { useChatUnread } from "./WaveChatUnread";

/** Keep the large wave/leaderboard shell out of unread-store updates. */
export function WaveChatWithUnread(
  props: Omit<ComponentProps<typeof MyStreamWaveChat>, "firstUnreadSerialNo">
) {
  const wave = useChatUnread(props.wave.id);
  return (
    <MyStreamWaveChat
      {...props}
      firstUnreadSerialNo={wave?.firstUnreadDropSerialNo ?? null}
    />
  );
}
