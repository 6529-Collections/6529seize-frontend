"use client";

import React, { useState } from "react";
import type { ExtendedDrop } from "@/helpers/waves/drop.helpers";
import WaveDropContent from "@/components/waves/drops/WaveDropContent";
import WaveDropMetadata from "@/components/waves/drops/WaveDropMetadata";
import { useRouter } from "next/navigation";
import WaveDropReactions from "@/components/waves/drops/WaveDropReactions";
import type { DropContentPresentation } from "@/components/waves/drops/dropContentPresentation";
import {
  getDropIdentityProfile,
  getDropVisibleMetadata,
} from "@/components/waves/drops/identityDisplay.helpers";
import { areSameProfileIdentity } from "@/helpers/ProfileHelpers";
import { getWaveRoute } from "@/helpers/navigation.helpers";
import { WaveLeaderboardIdentity } from "../identity/WaveLeaderboardIdentity";

interface WaveLeaderboardDropContentProps {
  readonly drop: ExtendedDrop;
  readonly isCompetitionDrop?: boolean | undefined;
  readonly contentPresentation?: DropContentPresentation | undefined;
}

export const WaveLeaderboardDropContent: React.FC<
  WaveLeaderboardDropContentProps
> = ({ drop, isCompetitionDrop = false, contentPresentation = "default" }) => {
  const router = useRouter();
  const [activePartIndex, setActivePartIndex] = useState<number>(0);
  const visibleMetadata = getDropVisibleMetadata({
    wave: drop.wave,
    metadata: drop.metadata,
  });
  const identityProfile = getDropIdentityProfile({
    wave: drop.wave,
    metadata: drop.metadata,
  });
  const isSelfNominee = identityProfile
    ? areSameProfileIdentity({
        left: drop.author,
        right: identityProfile,
      })
    : false;

  const onDropContentClick = (clickedDrop: ExtendedDrop) => {
    const href = getWaveRoute({
      waveId: clickedDrop.wave.id,
      serialNo: clickedDrop.serial_no,
      isDirectMessage: false,
      isApp: false,
    });
    router.push(href);
  };

  return (
    <div className="-tw-mt-0.5 tw-flex tw-flex-col tw-gap-y-1">
      <WaveDropContent
        drop={drop}
        activePartIndex={activePartIndex}
        setActivePartIndex={setActivePartIndex}
        onDropContentClick={onDropContentClick}
        onLongPress={() => {}}
        onQuoteClick={() => {}}
        setLongPressTriggered={() => {}}
        isCompetitionDrop={isCompetitionDrop}
        contentPresentation={contentPresentation}
      />
      <WaveLeaderboardIdentity
        drop={drop}
        variant="responsive"
        cardVariant="chat"
        className="tw-mt-2 lg:tw-mt-0"
        showIdentityHeader={!isSelfNominee}
      />
      {!!visibleMetadata.length && (
        <WaveDropMetadata metadata={visibleMetadata} />
      )}
      <div className="tw-flex tw-w-full tw-flex-wrap tw-items-center tw-gap-x-2 tw-gap-y-1">
        <WaveDropReactions drop={drop} />
      </div>
    </div>
  );
};
