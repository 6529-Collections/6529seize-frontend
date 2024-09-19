import React from "react";
import { Drop } from "../../../../generated/models/Drop";
import WaveDetailedDropPart from "./WaveDetailedDropPart";
interface WaveDetailedDropContentProps {
  drop: Drop;
  activePartIndex: number;
  setActivePartIndex: (index: number) => void;
}

const WaveDetailedDropContent: React.FC<WaveDetailedDropContentProps> = ({
  drop,
  activePartIndex,
  setActivePartIndex,
}) => {
  return (
    <div>
      <WaveDetailedDropPart
        drop={drop}
        activePartIndex={activePartIndex}
        setActivePartIndex={setActivePartIndex}
      />
    </div>
  );
};

export default WaveDetailedDropContent;
