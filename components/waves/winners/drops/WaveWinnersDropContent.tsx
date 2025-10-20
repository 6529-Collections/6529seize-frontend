"use client";

import React, { useState } from "react";
import WaveDropContent from "@/components/waves/drops/WaveDropContent";
import { ApiWaveDecisionWinner } from "@/generated/models/ApiWaveDecisionWinner";
import { useRouter } from "next/navigation";
import { DropSize, ExtendedDrop } from "@/helpers/waves/drop.helpers";
import { getWaveRoute } from "@/helpers/navigation.helpers";

interface WaveWinnersDropContentProps {
  readonly winner: ApiWaveDecisionWinner;
  readonly isCompetitionDrop?: boolean;
}

export const WaveWinnersDropContent: React.FC<WaveWinnersDropContentProps> = ({
  winner,
  isCompetitionDrop = false,
}) => {
  const router = useRouter();
  const [activePartIndex, setActivePartIndex] = useState(0);

  const onDropContentClick = (drop: ExtendedDrop) => {
    const waveMeta = (drop.wave as unknown as {
      chat?: { scope?: { group?: { is_direct_message?: boolean } } };
    })?.chat;
    const href = getWaveRoute({
      waveId: drop.wave.id,
      serialNo: drop.serial_no,
      isDirectMessage: waveMeta?.scope?.group?.is_direct_message ?? false,
      isApp: false,
    });
    router.push(`${href}/`);
  };

  return (
    <WaveDropContent
      drop={{
        type: DropSize.FULL,
        ...winner.drop,
        stableKey: winner.drop.id,
        stableHash: winner.drop.id,
      }}
      activePartIndex={activePartIndex}
      setActivePartIndex={setActivePartIndex}
      onDropContentClick={onDropContentClick}
      onLongPress={() => {}}
      onQuoteClick={() => {}}
      setLongPressTriggered={() => {}}
      isCompetitionDrop={isCompetitionDrop}
    />
  );
};
