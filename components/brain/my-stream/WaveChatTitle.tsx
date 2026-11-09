"use client";

import { useMemo } from "react";
import { useSetWaveData } from "@/contexts/TitleContext";
import { useChatUnread } from "./WaveChatUnread";

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
  const wave = useChatUnread(waveId, { enabled: chatActive });
  const newItemsCount = wave?.newDropsCount.count ?? 0;
  const data = useMemo(
    () => ({ id: waveId, name: waveName, newItemsCount }),
    [newItemsCount, waveId, waveName]
  );
  useSetWaveData(data);
  return null;
}
