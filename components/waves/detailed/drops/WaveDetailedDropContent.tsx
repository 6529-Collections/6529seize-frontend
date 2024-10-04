import React from "react";
import { Drop } from "../../../../generated/models/Drop";
import WaveDetailedDropPart from "./WaveDetailedDropPart";
interface WaveDetailedDropContentProps {
  drop: Drop;
  activePartIndex: number;
  setActivePartIndex: (index: number) => void;
  onDropClick: () => void;
}

const WaveDetailedDropContent: React.FC<WaveDetailedDropContentProps> = ({
  drop,
  activePartIndex,
  setActivePartIndex,
  onDropClick,
}) => {
  return (
    <div>
      <WaveDetailedDropPart
        drop={drop}
        activePartIndex={activePartIndex}
        setActivePartIndex={setActivePartIndex}
        onDropClick={onDropClick}
      />
    </div>
  );
};

export default WaveDetailedDropContent;
