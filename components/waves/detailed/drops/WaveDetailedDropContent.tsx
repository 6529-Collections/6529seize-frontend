import React from "react";
import { Drop } from "../../../../generated/models/Drop";
import { useState } from "react";
import WaveDetailedDropPart from "./WaveDetailedDropPart";
interface WaveDetailedDropContentProps {
  drop: Drop;
}

const WaveDetailedDropContent: React.FC<WaveDetailedDropContentProps> = ({
  drop,
}) => {
  const [activePartIndex, setActivePartIndex] = useState<number>(0);

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
