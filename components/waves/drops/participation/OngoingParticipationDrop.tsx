"use client";

import { MobileVotingModal, VotingModal } from "@/components/voting";
import VotingModalButton from "@/components/voting/VotingModalButton";
import type { ExtendedDrop } from "@/helpers/waves/drop.helpers";
import { areSameProfileIdentity } from "@/helpers/ProfileHelpers";
import type { ActiveDropState } from "@/types/dropInteractionTypes";
import type { ApiDrop } from "@/generated/models/ApiDrop";
import { useCallback, useState } from "react";
import { useDropInteractionRules } from "@/hooks/drops/useDropInteractionRules";
import useIsMobileDevice from "@/hooks/isMobileDevice";
import useIsMobileScreen from "@/hooks/isMobileScreen";
import WaveDropActions from "../WaveDropActions";
import WaveDropMobileMenu from "../WaveDropMobileMenu";
import WaveDropAuthorPfp from "../WaveDropAuthorPfp";
import DropMinimalIdentityRow from "../DropMinimalIdentityRow";
import ParticipationDropContainer from "./ParticipationDropContainer";
import ParticipationDropHeader from "./ParticipationDropHeader";
import ParticipationDropContent from "./ParticipationDropContent";
import ParticipationDropMetadata from "./ParticipationDropMetadata";
import ParticipationDropFooter from "./ParticipationDropFooter";
import useIsTouchDevice from "@/hooks/useIsTouchDevice";
import ParticipationIdentityProfileCard from "./ParticipationIdentityProfileCard";
import {
  getParticipationIdentityProfile,
  getParticipationVisibleMetadata,
} from "./participationIdentityProfile.helpers";
import type { DropContentPresentation } from "../dropContentPresentation";
import type {
  DropIdentityMode,
  DropInteractionParams,
  DropLocation,
} from "../drop.types";

interface OngoingParticipationDropProps {
  readonly drop: ExtendedDrop;
  readonly showWaveInfo: boolean;
  readonly activeDrop: ActiveDropState | null;
  readonly showReplyAndQuote: boolean;
  readonly location: DropLocation;
  readonly onReply: (param: DropInteractionParams) => void;
  readonly onQuoteClick: (drop: ApiDrop) => void;
  readonly onDropContentClick?: ((drop: ExtendedDrop) => void) | undefined;
  readonly identityMode?: DropIdentityMode | undefined;
  readonly showInteractions?: boolean | undefined;
  readonly contentPresentation?: DropContentPresentation | undefined;
}

export default function OngoingParticipationDrop({
  drop,
  showWaveInfo,
  activeDrop,
  showReplyAndQuote,
  location,
  onReply,
  onQuoteClick,
  onDropContentClick,
  identityMode = "default",
  showInteractions = true,
  contentPresentation = "default",
}: OngoingParticipationDropProps) {
  const isActiveDrop = activeDrop?.drop.id === drop.id;
  const { canShowVote } = useDropInteractionRules(drop);
  const isMobile = useIsMobileDevice();
  const isMobileScreen = useIsMobileScreen();
  const hasTouch = useIsTouchDevice() || isMobile;
  const identityProfile = getParticipationIdentityProfile({
    wave: drop.wave,
    metadata: drop.metadata,
  });
  const visibleMetadata = getParticipationVisibleMetadata({
    wave: drop.wave,
    metadata: drop.metadata,
  });
  const isSelfNominee = identityProfile
    ? areSameProfileIdentity({
        left: drop.author,
        right: identityProfile,
      })
    : false;
  const showIdentity = identityMode !== "hidden";

  const [activePartIndex, setActivePartIndex] = useState(0);
  const [longPressTriggered, setLongPressTriggered] = useState(false);
  const [isSlideUp, setIsSlideUp] = useState(false);
  const [isVotingModalOpen, setIsVotingModalOpen] = useState(false);

  const handleLongPress = useCallback(() => {
    if (!showInteractions || !hasTouch) return;
    setLongPressTriggered(true);
    setIsSlideUp(true);
  }, [hasTouch, showInteractions]);

  const handleOnReply = useCallback(() => {
    setIsSlideUp(false);
    onReply({ drop, partId: drop.parts[activePartIndex]?.part_id! });
  }, [onReply, drop, activePartIndex]);

  const handleOnAddReaction = useCallback(() => {
    setIsSlideUp(false);
  }, []);

  const voteAction =
    canShowVote && showInteractions ? (
      <VotingModalButton
        drop={drop}
        onClick={() => setIsVotingModalOpen(true)}
      />
    ) : null;

  return (
    <ParticipationDropContainer
      drop={drop}
      isActiveDrop={isActiveDrop}
      location={location}
    >
      {!isMobile && showInteractions && showReplyAndQuote && (
        <WaveDropActions
          drop={drop}
          activePartIndex={activePartIndex}
          showVoting={false}
          onReply={handleOnReply}
        />
      )}
      <div className="tw-relative tw-z-10 tw-flex tw-w-full tw-gap-x-3 tw-border-0 tw-bg-transparent tw-px-4 tw-pt-4 tw-text-left">
        {showIdentity && <WaveDropAuthorPfp drop={drop} />}
        <div className="tw-flex tw-w-full tw-flex-col">
          {showIdentity &&
            (identityMode === "minimal" ? (
              <DropMinimalIdentityRow drop={drop} />
            ) : (
              <ParticipationDropHeader
                drop={drop}
                showWaveInfo={showWaveInfo}
              />
            ))}
          <ParticipationDropContent
            drop={drop}
            activePartIndex={activePartIndex}
            setActivePartIndex={setActivePartIndex}
            onLongPress={handleLongPress}
            onDropContentClick={onDropContentClick}
            onQuoteClick={onQuoteClick}
            setLongPressTriggered={setLongPressTriggered}
            isCompetitionDrop={true}
            contentPresentation={contentPresentation}
          />
        </div>
      </div>

      <div className="tw-flex tw-w-full tw-flex-col">
        {identityProfile && (
          <div className={`${showIdentity ? "tw-ml-[3.25rem]" : ""} tw-px-4`}>
            <ParticipationIdentityProfileCard
              profile={identityProfile}
              contextId={drop.id}
              variant="chat"
              showIdentityHeader={!isSelfNominee}
            />
          </div>
        )}
        <ParticipationDropMetadata
          metadata={visibleMetadata}
          contextId={drop.id}
        />
        <ParticipationDropFooter
          drop={drop}
          voteAction={voteAction}
          showInteractions={showInteractions}
        />
      </div>

      {showInteractions &&
        (isMobileScreen ? (
          <MobileVotingModal
            drop={drop}
            isOpen={isVotingModalOpen}
            onClose={() => setIsVotingModalOpen(false)}
          />
        ) : (
          <VotingModal
            drop={drop}
            isOpen={isVotingModalOpen}
            onClose={() => setIsVotingModalOpen(false)}
          />
        ))}

      {showInteractions && (
        <WaveDropMobileMenu
          drop={drop}
          isOpen={isSlideUp}
          longPressTriggered={longPressTriggered}
          showReplyAndQuote={showReplyAndQuote}
          setOpen={setIsSlideUp}
          onReply={handleOnReply}
          onAddReaction={handleOnAddReaction}
        />
      )}
    </ParticipationDropContainer>
  );
}
