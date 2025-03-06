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
    <div className="md:tw-ml-16 tw-mt-4 tw-rounded-lg tw-bg-iron-900/50 tw-px-4 tw-pb-4 tw-pt-2 tw-ring-1 tw-ring-inset tw-ring-iron-800/50">
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
    </div>
  );
};
