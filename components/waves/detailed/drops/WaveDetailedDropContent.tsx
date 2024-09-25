import React from "react";
import { Drop } from "../../../../generated/models/Drop";
import WaveDetailedDropPart from "./WaveDetailedDropPart";
interface WaveDetailedDropContentProps {
  drop: Drop;
  activePartIndex: number;
  setActivePartIndex: (index: number) => void;
  onActiveDropClick?: () => void;
}

const WaveDetailedDropContent: React.FC<WaveDetailedDropContentProps> = ({
  drop,
  activePartIndex,
  setActivePartIndex,
  onActiveDropClick,
}) => {
  return (
    <div>
      <WaveDetailedDropPart
        drop={drop}
        activePartIndex={activePartIndex}
        setActivePartIndex={setActivePartIndex}
        onActiveDropClick={onActiveDropClick}
      />
    </div>
  );
};

export default WaveDetailedDropContent;
