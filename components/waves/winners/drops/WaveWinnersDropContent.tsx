import React, { useState } from "react";
import WaveDropContent from "../../drops/WaveDropContent";
import { ApiWaveDecisionWinner } from "../../../../generated/models/ApiWaveDecisionWinner";

interface WaveWinnersDropContentProps {
  readonly winner   : ApiWaveDecisionWinner;
}

export const WaveWinnersDropContent: React.FC<WaveWinnersDropContentProps> = ({
  winner,
}) => {
  const [activePartIndex, setActivePartIndex] = useState(0);
  return (
    <WaveDropContent
      drop={{
        ...winner.drop,
        stableKey: winner.drop.id,
        stableHash: winner.drop.id,
      }}
      activePartIndex={activePartIndex}
      setActivePartIndex={setActivePartIndex}
      onLongPress={() => {}}
      onQuoteClick={() => {}}
      setLongPressTriggered={() => {}}
    />
  );
};
