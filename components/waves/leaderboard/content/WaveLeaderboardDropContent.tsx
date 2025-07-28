"use client";

import React, { useState } from "react";
import { ExtendedDrop } from "../../../../helpers/waves/drop.helpers";
import WaveDropContent from "../../drops/WaveDropContent";
import WaveDropMetadata from "../../drops/WaveDropMetadata";
import { useRouter } from "next/navigation";
import WaveDropReactions from "../../drops/WaveDropReactions";

interface WaveLeaderboardDropContentProps {
  readonly drop: ExtendedDrop;
  readonly isCompetitionDrop?: boolean;
}

export const WaveLeaderboardDropContent: React.FC<
  WaveLeaderboardDropContentProps
> = ({ drop, isCompetitionDrop = false }) => {
  const router = useRouter();
  const [activePartIndex, setActivePartIndex] = useState<number>(0);

  const onDropContentClick = (drop: ExtendedDrop) => {
    router.push(`/my-stream?wave=${drop.wave.id}&serialNo=${drop.serial_no}/`);
  };

  return (
    <div className="tw-flex tw-flex-col tw-gap-y-1">
      <WaveDropContent
        drop={drop}
        activePartIndex={activePartIndex}
        setActivePartIndex={setActivePartIndex}
        onDropContentClick={onDropContentClick}
        onLongPress={() => {}}
        onQuoteClick={() => {}}
        setLongPressTriggered={() => {}}
        isCompetitionDrop={isCompetitionDrop}
      />
      {!!drop.metadata.length && (
        <div className="tw-mt-2">
          <WaveDropMetadata metadata={drop.metadata} />
        </div>
      )}
      <div className="tw-flex tw-w-full tw-items-center tw-gap-x-2 tw-gap-y-1 tw-flex-wrap">
        <WaveDropReactions drop={drop} />
      </div>
    </div>
  );
};
