"use client";

import { memo, useState, useCallback } from "react";
import type { ExtendedDrop } from "@/helpers/waves/drop.helpers";
import WaveDropContent from "@/components/waves/drops/WaveDropContent";
import type { DropContentPresentation } from "@/components/waves/drops/dropContentPresentation";

interface DropContentSmallProps {
  readonly drop: ExtendedDrop;
  readonly onDropClick: () => void;
  readonly contentPresentation?: DropContentPresentation | undefined;
}

export const DropContentSmall = memo<DropContentSmallProps>(
  ({ drop, onDropClick, contentPresentation = "default" }) => {
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
          contentPresentation={contentPresentation}
        />
      </div>
    );
  }
);

DropContentSmall.displayName = "DropContentSmall";
