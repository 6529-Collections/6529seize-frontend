"use client";

import { memo, useState, useCallback } from "react";
import type { ExtendedDrop } from "@/helpers/waves/drop.helpers";
import WaveDropContent from "@/components/waves/drops/WaveDropContent";

interface DropContentSmallProps {
  readonly drop: ExtendedDrop;
  readonly onDropClick: (drop: ExtendedDrop) => void;
}

export const DropContentSmall = memo<DropContentSmallProps>(
  ({ drop, onDropClick }) => {
    const [activePartIndex, setActivePartIndex] = useState(0);

    const handleDropClick = useCallback(() => {
      onDropClick(drop);
    }, [drop, onDropClick]);

    return (
      <div>
        <WaveDropContent
          drop={drop}
          activePartIndex={activePartIndex}
          setActivePartIndex={setActivePartIndex}
          onLongPress={() => {}}
          onDropContentClick={handleDropClick}
          onQuoteClick={() => {}}
          setLongPressTriggered={() => {}}
        />
      </div>
    );
  }
);

DropContentSmall.displayName = "DropContentSmall";
