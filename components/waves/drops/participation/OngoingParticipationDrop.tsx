"use client";

import { MobileVotingModal, VotingModal } from "@/components/voting";
import VotingModalButton from "@/components/voting/VotingModalButton";
import { useVotingModalState } from "@/components/voting/useVotingModalState";
import type { ExtendedDrop } from "@/helpers/waves/drop.helpers";
import { areSameProfileIdentity } from "@/helpers/ProfileHelpers";
import type { ImageScale } from "@/helpers/image.helpers";
import type { ActiveDropState } from "@/types/dropInteractionTypes";
import type { ApiDrop } from "@/generated/models/ApiDrop";
import { useCallback, useEffect, useState } from "react";
import { useDropInteractionRules } from "@/hooks/drops/useDropInteractionRules";
import useDropActionInteractionMode from "@/hooks/useDropActionInteractionMode";
import useIsMobileScreen from "@/hooks/isMobileScreen";
import WaveDropActions from "../WaveDropActions";
import {
  useWaveDropMobileMenu,
  WaveDropMobileMenuProvider,
} from "../WaveDropMobileMenuContext";
import WaveDropAuthorPfp from "../WaveDropAuthorPfp";
import DropMinimalIdentityRow from "../DropMinimalIdentityRow";
import ParticipationDropContainer from "./ParticipationDropContainer";
import ParticipationDropHeader from "./ParticipationDropHeader";
import ParticipationDropContent from "./ParticipationDropContent";
import ParticipationDropMetadata from "./ParticipationDropMetadata";
import ParticipationDropFooter from "./ParticipationDropFooter";
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
  DropTimestampLayout,
} from "../drop.types";
import { hasDropFooter } from "../drop.types";

interface OngoingParticipationDropProps {
  readonly drop: ExtendedDrop;
  readonly showWaveInfo: boolean;
  readonly activeDrop: ActiveDropState | null;
  readonly showReplyAndQuote: boolean;
  readonly location: DropLocation;
  readonly onReply: (param: DropInteractionParams) => void;
  readonly onQuoteClick: (drop: ApiDrop) => void;
  readonly onDropContentClick?: ((drop: ExtendedDrop) => void) | undefined;
  readonly footer?: React.ReactNode;
  readonly identityMode?: DropIdentityMode | undefined;
  readonly timestampLayout?: DropTimestampLayout | undefined;
  readonly showInteractions?: boolean | undefined;
  readonly inlineAuthorOnDesktop?: boolean | undefined;
  readonly mediaImageScale?: ImageScale | undefined;
  readonly fullWidthMedia?: boolean | undefined;
  readonly fullWidthLinkPreviews?: boolean | undefined;
  readonly winningThreshold?: number | null | undefined;
  readonly winningThresholdMinDurationMs?: number | null | undefined;
  readonly isVotingClosed?: boolean | undefined;
  readonly isVotingControlsLocked?: boolean | undefined;
  readonly contentPresentation?: DropContentPresentation | undefined;
  readonly embedPath?: readonly string[] | undefined;
  readonly quotePath?: readonly string[] | undefined;
  readonly embedDepth?: number | undefined;
  readonly maxEmbedDepth?: number | undefined;
}

function OngoingParticipationDropInner({
  drop,
  showWaveInfo,
  activeDrop,
  showReplyAndQuote,
  location,
  onReply,
  onQuoteClick,
  onDropContentClick,
  footer,
  identityMode = "default",
  timestampLayout = "inline",
  showInteractions = true,
  inlineAuthorOnDesktop = false,
  mediaImageScale,
  fullWidthMedia = false,
  fullWidthLinkPreviews = false,
  winningThreshold,
  winningThresholdMinDurationMs,
  isVotingClosed = false,
  isVotingControlsLocked = false,
  contentPresentation = "default",
  embedPath,
  quotePath,
  embedDepth,
  maxEmbedDepth,
}: OngoingParticipationDropProps) {
  const isActiveDrop = activeDrop?.drop.id === drop.id;
  const { canShowVote } = useDropInteractionRules(drop);
  const isMobileScreen = useIsMobileScreen();
  const { canUseDesktopHoverActions, canUseTouchActionSheet } =
    useDropActionInteractionMode();
  const mobileMenu = useWaveDropMobileMenu();
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
  const isVotingActionLocked = isVotingClosed || isVotingControlsLocked;

  const [activePartIndex, setActivePartIndex] = useState(0);
  const [longPressTriggered, setLongPressTriggered] = useState(false);
  const [isSlideUp, setIsSlideUp] = useState(false);
  const {
    isOpen: isVoteModalOpen,
    open: openVoteModal,
    close: closeVoteModal,
  } = useVotingModalState(isVotingActionLocked);

  const handleLongPress = useCallback(() => {
    if (!showInteractions || !canUseTouchActionSheet) return;
    setLongPressTriggered(true);
    setIsSlideUp(true);
  }, [canUseTouchActionSheet, showInteractions]);

  useEffect(() => {
    if (canUseTouchActionSheet) {
      return;
    }

    setIsSlideUp(false);
    setLongPressTriggered(false);
    mobileMenu?.close();
  }, [canUseTouchActionSheet, mobileMenu]);

  const handleOnReply = useCallback(() => {
    mobileMenu?.close();
    setIsSlideUp(false);
    onReply({ drop, partId: drop.parts[activePartIndex]?.part_id! });
  }, [onReply, drop, activePartIndex, mobileMenu]);

  const handleOnAddReaction = useCallback(() => {
    mobileMenu?.close();
    setIsSlideUp(false);
  }, [mobileMenu]);

  const handleVoteButtonClick = useCallback(() => {
    openVoteModal();
  }, [openVoteModal]);

  const voteAction =
    canShowVote && showInteractions && !isVotingActionLocked ? (
      <VotingModalButton drop={drop} onClick={handleVoteButtonClick} />
    ) : null;
  const content = (
    <ParticipationDropContent
      drop={drop}
      activePartIndex={activePartIndex}
      setActivePartIndex={setActivePartIndex}
      onLongPress={handleLongPress}
      onDropContentClick={onDropContentClick}
      onQuoteClick={onQuoteClick}
      setLongPressTriggered={setLongPressTriggered}
      isCompetitionDrop={true}
      hasTouch={showInteractions && canUseTouchActionSheet}
      mediaImageScale={mediaImageScale}
      fullWidthMedia={fullWidthMedia}
      fullWidthLinkPreviews={fullWidthLinkPreviews}
      contentPresentation={contentPresentation}
      embedPath={embedPath}
      quotePath={quotePath}
      embedDepth={embedDepth}
      maxEmbedDepth={maxEmbedDepth}
    />
  );
  const shouldOffsetRows = showIdentity && !inlineAuthorOnDesktop;

  const effectiveIsSlideUp = isSlideUp && canUseTouchActionSheet;

  useEffect(() => {
    if (!showInteractions || !effectiveIsSlideUp) {
      return;
    }

    mobileMenu?.open({
      drop,
      longPressTriggered,
      showReplyAndQuote,
      onOpenChange: setIsSlideUp,
      onReply: handleOnReply,
      onAddReaction: handleOnAddReaction,
      showVoting: !isVotingActionLocked,
    });
  }, [
    drop,
    effectiveIsSlideUp,
    handleOnAddReaction,
    handleOnReply,
    isVotingActionLocked,
    longPressTriggered,
    mobileMenu,
    showInteractions,
    showReplyAndQuote,
  ]);

  return (
    <ParticipationDropContainer
      drop={drop}
      isActiveDrop={isActiveDrop}
      location={location}
      useRankStyles={
        !(typeof winningThreshold === "number" && winningThreshold > 0)
      }
      floatingActions={
        canUseDesktopHoverActions && showInteractions && showReplyAndQuote ? (
          <WaveDropActions
            drop={drop}
            activePartIndex={activePartIndex}
            showVoting={false}
            onReply={handleOnReply}
          />
        ) : null
      }
    >
      <div
        className={`tw-relative tw-z-10 tw-flex tw-w-full tw-border-0 tw-bg-transparent tw-px-4 tw-pt-4 tw-text-left ${
          inlineAuthorOnDesktop ? "tw-flex-col tw-gap-y-2" : "tw-gap-x-3"
        }`}
      >
        {inlineAuthorOnDesktop ? (
          <>
            {showIdentity && (
              <div className="tw-flex tw-w-full tw-items-center tw-gap-x-2">
                <WaveDropAuthorPfp drop={drop} />
                <div className="tw-min-w-0 tw-flex-1">
                  {identityMode === "minimal" ? (
                    <DropMinimalIdentityRow
                      drop={drop}
                      timestampLayout={timestampLayout}
                    />
                  ) : (
                    <ParticipationDropHeader
                      drop={drop}
                      showWaveInfo={showWaveInfo}
                      winningThreshold={winningThreshold}
                      timestampLayout={timestampLayout}
                    />
                  )}
                </div>
              </div>
            )}
            {content}
          </>
        ) : (
          <>
            {showIdentity && <WaveDropAuthorPfp drop={drop} />}
            <div className="tw-flex tw-w-full tw-flex-col">
              {showIdentity &&
                (identityMode === "minimal" ? (
                  <DropMinimalIdentityRow
                    drop={drop}
                    timestampLayout={timestampLayout}
                  />
                ) : (
                  <ParticipationDropHeader
                    drop={drop}
                    showWaveInfo={showWaveInfo}
                    winningThreshold={winningThreshold}
                    timestampLayout={timestampLayout}
                  />
                ))}
              {content}
            </div>
          </>
        )}
      </div>

      <div className="tw-flex tw-w-full tw-flex-col">
        {identityProfile && (
          <div
            className={`${shouldOffsetRows ? "tw-ml-[3.25rem]" : ""} tw-px-4`}
          >
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
        {(showInteractions || !hasDropFooter(footer)) && (
          <ParticipationDropFooter
            drop={drop}
            voteAction={voteAction}
            showInteractions={showInteractions}
            winningThreshold={winningThreshold}
            winningThresholdMinDurationMs={winningThresholdMinDurationMs}
            isVotingClosed={isVotingClosed}
            isVotingControlsLocked={isVotingControlsLocked}
          />
        )}
        {hasDropFooter(footer) && (
          <div
            className={`${shouldOffsetRows ? "tw-ml-[3.25rem]" : ""} tw-px-4 tw-pb-4 tw-pt-2`}
          >
            {footer}
          </div>
        )}
      </div>

      {showInteractions &&
        isVoteModalOpen &&
        (isMobileScreen ? (
          <MobileVotingModal drop={drop} isOpen onClose={closeVoteModal} />
        ) : (
          <VotingModal drop={drop} isOpen onClose={closeVoteModal} />
        ))}
    </ParticipationDropContainer>
  );
}

export default function OngoingParticipationDrop(
  props: OngoingParticipationDropProps
) {
  return (
    <WaveDropMobileMenuProvider>
      <OngoingParticipationDropInner {...props} />
    </WaveDropMobileMenuProvider>
  );
}
