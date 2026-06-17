"use client";

import DropListItemContentMedia from "@/components/drops/view/item/content/media/DropListItemContentMedia";
import { MobileVotingModal, VotingModal } from "@/components/voting";
import VotingModalButton from "@/components/voting/VotingModalButton";
import { useVotingModalState } from "@/components/voting/useVotingModalState";
import DropMobileMenuHandler from "@/components/waves/drops/DropMobileMenuHandler";
import { AdditionalActionPromiseBadge } from "@/components/waves/drops/AdditionalActionPromiseBadge";
import { getRankHoverBorderClass } from "@/components/waves/drops/dropRankStyles";
import WaveDropReactions from "@/components/waves/drops/WaveDropReactions";
import type { DropInteractionParams } from "@/components/waves/drops/drop.types";
import {
  DropLocation,
  hasDropFooter,
} from "@/components/waves/drops/drop.types";
import type { ExtendedDrop } from "@/helpers/waves/drop.helpers";
import { useDropInteractionRules } from "@/hooks/drops/useDropInteractionRules";
import useDropActionInteractionMode from "@/hooks/useDropActionInteractionMode";
import useIsMobileScreen from "@/hooks/isMobileScreen";
import type { ActiveDropState } from "@/types/dropInteractionTypes";
import {
  useCallback,
  type MouseEvent,
  type ReactNode,
} from "react";
import MemeDropActions from "./meme-participation-drop/MemeDropActions";
import MemeDropArtistInfo from "./meme-participation-drop/MemeDropArtistInfo";
import MemeDropDescription from "./meme-participation-drop/MemeDropDescription";
import MemeDropHeader from "./meme-participation-drop/MemeDropHeader";
import MemeDropVoteStats from "./meme-participation-drop/MemeDropVoteStats";
import MemeDropTraits from "./MemeDropTraits";

interface MemeParticipationDropProps {
  readonly drop: ExtendedDrop;
  readonly activeDrop: ActiveDropState | null;
  readonly showReplyAndQuote: boolean;
  readonly location: DropLocation;
  readonly onReply: (param: DropInteractionParams) => void;
  readonly onDropContentClick?: ((drop: ExtendedDrop) => void) | undefined;
  readonly footer?: ReactNode;
  readonly showInteractions?: boolean | undefined;
  readonly isVotingClosed?: boolean | undefined;
  readonly isVotingControlsLocked?: boolean | undefined;
}

const getNonEmptyText = (value: string | null | undefined): string | null => {
  const text = value?.trim();
  return text && text.length > 0 ? text : null;
};

const getMetadataValue = (drop: ExtendedDrop, dataKey: string): string | null =>
  getNonEmptyText(
    drop.metadata.find((metadata) => metadata.data_key === dataKey)?.data_value
  );

// Border styling based on rank
const getBorderClasses = (drop: ExtendedDrop, isActiveDrop: boolean) => {
  const rank =
    typeof drop.rank === "number" && drop.rank <= 3 ? drop.rank : null;

  const baseClasses =
    "tw-rounded-xl tw-border tw-border-solid tw-border-iron-800 tw-transition-all tw-duration-200 tw-ease-out tw-overflow-hidden";

  if (isActiveDrop) {
    return `${baseClasses} desktop-hover:hover:tw-border-[#3CCB7F]/40 tw-bg-[#3CCB7F]/5`;
  }

  if (rank === 1) {
    return `${baseClasses} ${getRankHoverBorderClass(1)}`;
  }

  if (rank === 2) {
    return `${baseClasses} ${getRankHoverBorderClass(2)}`;
  }

  if (rank === 3) {
    return `${baseClasses} ${getRankHoverBorderClass(3)}`;
  }

  return `${baseClasses} tw-border-iron-800`;
};

export default function MemeParticipationDrop({
  drop,
  activeDrop,
  showReplyAndQuote,
  location,
  onReply,
  onDropContentClick,
  footer,
  showInteractions = true,
  isVotingClosed = false,
  isVotingControlsLocked = false,
}: MemeParticipationDropProps) {
  const { canShowVote } = useDropInteractionRules(drop);
  const isVotingActionLocked = isVotingClosed || isVotingControlsLocked;
  const {
    isOpen: isVotingModalOpen,
    open: openVotingModal,
    close: closeVotingModal,
  } = useVotingModalState(isVotingActionLocked);
  const isActiveDrop = activeDrop?.drop.id === drop.id;
  const { canUseDesktopHoverActions } = useDropActionInteractionMode();
  const isMobileScreen = useIsMobileScreen();

  const firstPart = drop.parts.at(0);
  const title =
    getNonEmptyText(drop.title) ??
    getMetadataValue(drop, "title") ??
    "Artwork Title";
  const description =
    getNonEmptyText(firstPart?.content) ??
    getMetadataValue(drop, "description") ??
    "This is an artwork submission for The Memes collection.";

  // Get artwork media URL if available
  const artworkMedia = firstPart?.media.at(0);

  const borderClasses = getBorderClasses(drop, isActiveDrop);

  const handleOnReply = useCallback(() => {
    onReply({ drop, partId: drop.parts[0]?.part_id! });
  }, [onReply, drop]);

  const isContentInteractive =
    !drop.id.startsWith("temp-") && !!onDropContentClick;

  const headerContent = (
    <div className="tw-flex tw-flex-wrap tw-items-center tw-gap-2">
      <MemeDropHeader title={title} />
      {drop.is_additional_action_promised === true && (
        <AdditionalActionPromiseBadge />
      )}
    </div>
  );

  const handleContentClick = useCallback(
    (event: MouseEvent<HTMLButtonElement>) => {
      const selection = globalThis.getSelection?.() ?? null;
      if (selection?.toString()) {
        return;
      }

      if (!isContentInteractive || !onDropContentClick) {
        return;
      }

      event.stopPropagation();
      onDropContentClick(drop);
    },
    [drop, isContentInteractive, onDropContentClick]
  );

  const contentBody = (
    <>
      <div className="tw-p-4">
        <MemeDropArtistInfo drop={drop} />
        {isContentInteractive ? (
          <button
            className="tw-mt-2 tw-block tw-w-full tw-cursor-pointer tw-border-0 tw-bg-transparent tw-p-0 tw-text-left tw-text-inherit focus-visible:tw-outline focus-visible:tw-outline-2 focus-visible:tw-outline-offset-2 focus-visible:tw-outline-primary-400 sm:tw-ml-[3.25rem] sm:tw-mt-1.5 sm:tw-w-auto"
            onClick={handleContentClick}
            type="button"
          >
            {headerContent}
            <MemeDropDescription description={description} />
          </button>
        ) : (
          <div className="tw-mt-2 tw-flex tw-flex-col sm:tw-ml-[3.25rem] sm:tw-mt-1.5">
            {headerContent}
            <MemeDropDescription description={description} />
          </div>
        )}
      </div>
      {artworkMedia && (
        <div
          className={`tw-flex tw-h-96 tw-justify-center ${
            location === DropLocation.WAVE
              ? "tw-bg-iron-800/30"
              : "tw-bg-iron-900/40"
          }`}
        >
          <DropListItemContentMedia
            media_mime_type={artworkMedia.mime_type}
            media_url={artworkMedia.url}
            isCompetitionDrop={true}
          />
        </div>
      )}

      <div className="tw-px-4 tw-py-4">
        <MemeDropTraits drop={drop} />
      </div>
    </>
  );

  const content = <div>{contentBody}</div>;

  return (
    <div className="tw-w-full tw-@container">
      <div
        className={`tw-group tw-relative tw-w-full ${
          location === DropLocation.WAVE ? "tw-px-4 tw-py-1" : ""
        }`}
      >
        <div
          className={`${borderClasses} ${
            location === DropLocation.WAVE
              ? "tw-bg-iron-900/80"
              : "tw-bg-iron-950"
          }`}
        >
          {showInteractions ? (
            <DropMobileMenuHandler
              drop={drop}
              showReplyAndQuote={showReplyAndQuote}
              onReply={handleOnReply}
            >
              {content}
            </DropMobileMenuHandler>
          ) : (
            content
          )}
          <div className="tw-flex tw-flex-col tw-justify-between tw-gap-3 tw-pb-4 @[700px]:tw-flex-row @[700px]:tw-items-center @[700px]:tw-gap-y-0 @[700px]:tw-px-4">
            <div className="tw-px-4 @[700px]:tw-px-0">
              <MemeDropVoteStats drop={drop} />
            </div>

            {canShowVote && showInteractions && !isVotingActionLocked && (
              <div className="tw-flex tw-w-full tw-justify-center tw-border-x-0 tw-border-b-0 tw-border-t tw-border-solid tw-border-iron-800 tw-px-6 tw-pt-4 @[700px]:tw-w-auto @[700px]:tw-border-none @[700px]:tw-px-0 @[700px]:tw-pt-0">
                <div onClick={(e) => e.stopPropagation()}>
                  <VotingModalButton drop={drop} onClick={openVotingModal} />
                </div>
              </div>
            )}
          </div>

          {showInteractions && (
            <div className="tw-flex tw-w-full tw-flex-wrap tw-items-center tw-gap-x-2 tw-gap-y-1 tw-px-4 tw-pb-4">
              <WaveDropReactions drop={drop} />
            </div>
          )}
          {hasDropFooter(footer) && (
            <div className="tw-px-4 tw-pb-4 tw-pt-2">{footer}</div>
          )}

          {showInteractions && (
            <div className="tw-absolute tw-right-4 tw-top-2">
              <MemeDropActions
                drop={drop}
                canUseDesktopHoverActions={canUseDesktopHoverActions}
                showReplyAndQuote={showReplyAndQuote}
                onReply={handleOnReply}
              />
            </div>
          )}
        </div>

        {showInteractions &&
          (isMobileScreen ? (
            <MobileVotingModal
              drop={drop}
              isOpen={isVotingModalOpen}
              onClose={closeVotingModal}
            />
          ) : (
            <VotingModal
              drop={drop}
              isOpen={isVotingModalOpen}
              onClose={closeVotingModal}
            />
          ))}
      </div>
    </div>
  );
}
