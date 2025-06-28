"use client";

import React, { useState } from "react";
import WaveDropContent from "../../drops/WaveDropContent";
import { ApiWaveDecisionWinner } from "../../../../generated/models/ApiWaveDecisionWinner";
import { useRouter } from "next/router";
import { DropSize, ExtendedDrop } from "../../../../helpers/waves/drop.helpers";

interface WaveWinnersDropContentProps {
  readonly winner: ApiWaveDecisionWinner;
}

export const WaveWinnersDropContent: React.FC<WaveWinnersDropContentProps> = ({
  winner,
}) => {
  const router = useRouter();
  const [activePartIndex, setActivePartIndex] = useState(0);

  const onDropContentClick = (drop: ExtendedDrop) => {
    router.push(
      `/my-stream?wave=${drop.wave.id}&serialNo=${drop.serial_no}/`,
      undefined,
      { shallow: true }
    );
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
    />
  );
};
