"use client";

import { memo, useCallback, useState } from "react";

import WaveDropContent from "@/components/waves/drops/WaveDropContent";
import type { ExtendedDrop } from "@/helpers/waves/drop.helpers";

interface DropContentSmallProps {
  readonly drop: ExtendedDrop;
  readonly onDropClick: () => void;
}

export const DropContentSmall = memo<DropContentSmallProps>(
  ({ drop, onDropClick }) => {
    const [activePartIndex, setActivePartIndex] = useState(0);

    const handleDropClick = useCallback(() => {
      onDropClick();
    }, [onDropClick]);

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
