"use client";

import { useMemo } from "react";
import { TabCountBadge } from "@/components/common/TabCountBadge";
import { useSetWaveData } from "@/contexts/TitleContext";
import { useMyStream } from "@/contexts/wave/MyStreamContext";
import { useWaveUnread } from "@/contexts/wave/WaveUnreadContext";
import { useBrowserLocale } from "@/hooks/useBrowserLocale";
import { formatInteger } from "@/i18n/format";
import { t } from "@/i18n/messages";

export function useChatUnread(waveId: string, enabled = true) {
  const { waves, directMessages } = useMyStream();
  const wave = enabled
    ? (waves.list.find((entry) => entry.id === waveId) ??
      directMessages.list.find((entry) => entry.id === waveId))
    : undefined;
  return useWaveUnread(wave);
}

/** The tab strip itself does not subscribe to incoming message counts. */
export function WaveChatUnreadBadge({ waveId }: { readonly waveId: string }) {
  const wave = useChatUnread(waveId);
  const locale = useBrowserLocale();
  const count = wave?.isMuted ? 0 : (wave?.unreadDropsCount ?? 0);
  const key =
    new Intl.PluralRules(locale).select(count) === "one"
      ? "wave.navigation.unreadMessages.one"
      : "wave.navigation.unreadMessages.other";
  return (
    <TabCountBadge
      count={count}
      accessibleLabel={t(locale, key, {
        count: formatInteger(locale, count),
      })}
    />
  );
}

/** Only a selected Chat panel contributes new messages to the browser title. */
export function WaveChatTitle({
  waveId,
  waveName,
  chatActive,
}: {
  readonly waveId: string;
  readonly waveName: string;
  readonly chatActive: boolean;
}) {
  const wave = useChatUnread(waveId, chatActive);
  const newItemsCount = wave?.newDropsCount.count ?? 0;
  const data = useMemo(
    () => ({ id: waveId, name: waveName, newItemsCount }),
    [newItemsCount, waveId, waveName]
  );
  useSetWaveData(data);
  return null;
}
