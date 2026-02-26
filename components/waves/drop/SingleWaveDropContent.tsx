"use client";

import React, { useState } from "react";

import { ImageScale } from "@/helpers/image.helpers";
import type { ExtendedDrop } from "@/helpers/waves/drop.helpers";

import WaveDropContent from "../drops/WaveDropContent";

import { SingleWaveDropContentMetadata } from "./SingleWaveDropContentMetadata";


interface SingleWaveDropContentProps {
  readonly drop: ExtendedDrop;
}

export const SingleWaveDropContent: React.FC<SingleWaveDropContentProps> = ({
  drop,
}) => {
  const [activePartIndex, setActivePartIndex] = useState<number>(0);
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
      {!!drop.metadata.length && <SingleWaveDropContentMetadata drop={drop} />}
    </div>
  );
};
