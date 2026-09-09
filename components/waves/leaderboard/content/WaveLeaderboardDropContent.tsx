"use client";

import React, { useState } from "react";
import type { ExtendedDrop } from "@/helpers/waves/drop.helpers";
import WaveDropContent from "@/components/waves/drops/WaveDropContent";
import { useRouter } from "next/navigation";
import WaveDropReactions from "@/components/waves/drops/WaveDropReactions";
import type { DropContentPresentation } from "@/components/waves/drops/dropContentPresentation";
import WaveDropActionsOpen from "@/components/waves/drops/WaveDropActionsOpen";
import { getWaveRoute } from "@/helpers/navigation.helpers";
import ProposalCardContent from "@/components/waves/drops/proposal/ProposalCardContent";
import { ProposalCardContextLabelVisibilityProvider } from "@/components/waves/drops/proposal/ProposalCardContextLabel";

interface WaveLeaderboardDropContentProps {
  readonly drop: ExtendedDrop;
  readonly isCompetitionDrop?: boolean | undefined;
  readonly mediaContainerHeightClassName?: string | undefined;
  readonly contentPresentation?: DropContentPresentation | undefined;
}

export const WaveLeaderboardDropContent: React.FC<
  WaveLeaderboardDropContentProps
> = ({
  drop,
  isCompetitionDrop = false,
  mediaContainerHeightClassName,
  contentPresentation = "default",
}) => {
  const router = useRouter();
  const [activePartIndex, setActivePartIndex] = useState<number>(0);

  const onDropContentClick = (clickedDrop: ExtendedDrop) => {
    const href = getWaveRoute({
      waveId: clickedDrop.wave.id,
      serialNo: clickedDrop.serial_no,
      isDirectMessage: false,
      isApp: false,
    });
    router.push(href);
  };

  if (contentPresentation === "proposalCard") {
    return (
      <div className="tw-mt-1.5 tw-flex tw-flex-col tw-gap-y-1">
        <ProposalCardContent
          drop={drop}
          textFooter={<WaveDropActionsOpen drop={drop} variant="readFull" />}
        />
        <div className="tw-flex tw-w-full tw-flex-wrap tw-items-center tw-gap-x-2 tw-gap-y-1">
          <WaveDropReactions drop={drop} />
        </div>
      </div>
    );
  }

  return (
    <div
      className={`${
        contentPresentation === "quorumCompact" ? "" : "-tw-mt-0.5"
      } tw-flex tw-flex-col tw-gap-y-1`}
    >
      <ProposalCardContextLabelVisibilityProvider visible={false}>
        <WaveDropContent
          drop={drop}
          activePartIndex={activePartIndex}
          setActivePartIndex={setActivePartIndex}
          onDropContentClick={onDropContentClick}
          onLongPress={() => {}}
          onQuoteClick={() => {}}
          setLongPressTriggered={() => {}}
          isCompetitionDrop={isCompetitionDrop}
          mediaContainerHeightClassName={mediaContainerHeightClassName}
          contentPresentation={contentPresentation}
        />
      </ProposalCardContextLabelVisibilityProvider>
      <div className="tw-flex tw-w-full tw-flex-wrap tw-items-center tw-gap-x-2 tw-gap-y-1">
        <WaveDropReactions drop={drop} />
      </div>
    </div>
  );
};
