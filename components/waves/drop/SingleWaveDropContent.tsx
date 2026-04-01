"use client";

import React, { useState } from "react";
import { WaveDropIdentity } from "@/components/waves/drops/identity/WaveDropIdentity";
import { getDropVisibleMetadata } from "@/components/waves/drops/identityDisplay.helpers";
import { SingleWaveDropContentMetadata } from "./SingleWaveDropContentMetadata";
import type { ExtendedDrop } from "@/helpers/waves/drop.helpers";
import WaveDropContent from "../drops/WaveDropContent";
import { ImageScale } from "@/helpers/image.helpers";

interface SingleWaveDropContentProps {
  readonly drop: ExtendedDrop;
}

export const SingleWaveDropContent: React.FC<SingleWaveDropContentProps> = ({
  drop,
}) => {
  const [activePartIndex, setActivePartIndex] = useState<number>(0);
  const visibleMetadata = getDropVisibleMetadata({
    wave: drop.wave,
    metadata: drop.metadata,
  });

  return (
    <div className="tw-mb-4 tw-flex tw-flex-col tw-gap-y-4">
      <WaveDropContent
        drop={drop}
        activePartIndex={activePartIndex}
        setActivePartIndex={setActivePartIndex}
        onLongPress={() => {}}
        onQuoteClick={() => {}}
        setLongPressTriggered={() => {}}
        mediaImageScale={ImageScale.AUTOx1080}
      />
      <WaveDropIdentity drop={drop} variant="full" />
      {visibleMetadata.length > 0 && (
        <SingleWaveDropContentMetadata metadata={visibleMetadata} />
      )}
    </div>
  );
};
