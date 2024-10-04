import React from "react";
import { Drop } from "../../../../generated/models/Drop";
import WaveDetailedDropPart from "./WaveDetailedDropPart";
interface WaveDetailedDropContentProps {
  drop: Drop;
  activePartIndex: number;
  setActivePartIndex: (index: number) => void;
  onDropClick: () => void;
  onQuoteClick: (drop: Drop) => void;
}

const WaveDetailedDropContent: React.FC<WaveDetailedDropContentProps> = ({
  drop,
  activePartIndex,
  setActivePartIndex,
  onDropClick,
  onQuoteClick,
}) => {
  return (
    <div>
      <WaveDetailedDropPart
        drop={drop}
        activePartIndex={activePartIndex}
        setActivePartIndex={setActivePartIndex}
        onDropClick={onDropClick}
        onQuoteClick={onQuoteClick}
      />
    </div>
  );
};

export default WaveDetailedDropContent;
