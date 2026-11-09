"use client";

import { TabCountBadge } from "@/components/common/TabCountBadge";
import { useMyStream } from "@/contexts/wave/MyStreamContext";
import { useWaveUnread } from "@/contexts/wave/WaveUnreadContext";
import { useBrowserLocale } from "@/hooks/useBrowserLocale";
import { formatInteger } from "@/i18n/format";
import { t } from "@/i18n/messages";

export function useChatUnread(
  waveId: string,
  {
    enabled = true,
    ignoreMuted = false,
  }: { readonly enabled?: boolean; readonly ignoreMuted?: boolean } = {}
) {
  const { waves, directMessages } = useMyStream();
  const wave = enabled
    ? (waves.list.find((entry) => entry.id === waveId) ??
      directMessages.list.find((entry) => entry.id === waveId))
    : undefined;
  return useWaveUnread(ignoreMuted && wave?.isMuted ? undefined : wave);
}

/** The tab strip itself does not subscribe to incoming message counts. */
export function WaveChatUnreadBadge({ waveId }: { readonly waveId: string }) {
  const wave = useChatUnread(waveId, { ignoreMuted: true });
  const locale = useBrowserLocale();
  const count = wave?.isMuted ? 0 : (wave?.unreadDropsCount ?? 0);
  const key =
    new Intl.PluralRules(locale).select(count) === "one"
      ? "wave.navigation.unreadMessages.one"
      : "wave.navigation.unreadMessages.other";
  // Keep the exact count accessible when the compact visible badge caps at 99+.
  return (
    <TabCountBadge
      count={count}
      accessibleLabel={t(locale, key, {
        count: formatInteger(locale, count),
      })}
    />
  );
}
