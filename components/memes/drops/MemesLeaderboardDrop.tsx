"use client";

import React, { useState } from "react";
import { createPortal } from "react-dom";
import { ExtendedDrop } from "@/helpers/waves/drop.helpers";
import { DropLocation } from "@/components/waves/drops/Drop";
import { useDropInteractionRules } from "@/hooks/drops/useDropInteractionRules";
import MemesLeaderboardDropCard from "./MemesLeaderboardDropCard";
import MemesLeaderboardDropHeader from "./MemesLeaderboardDropHeader";
import MemesLeaderboardDropDescription from "./MemesLeaderboardDropDescription";
import MemesLeaderboardDropVoteSummary from "./MemesLeaderboardDropVoteSummary";
import MemesLeaderboardDropArtistInfo from "./MemesLeaderboardDropArtistInfo";
import MemeDropTraits from "./MemeDropTraits";
import DropListItemContentMedia from "@/components/drops/view/item/content/media/DropListItemContentMedia";
import WaveDropActionsOptions from "@/components/waves/drops/WaveDropActionsOptions";
import WaveDropActionsOpen from "@/components/waves/drops/WaveDropActionsOpen";
import { VotingModal, MobileVotingModal } from "@/components/voting";
import VotingModalButton from "@/components/voting/VotingModalButton";
import useIsMobileScreen from "@/hooks/isMobileScreen";
import useDeviceInfo from "@/hooks/useDeviceInfo";
import useLongPressInteraction from "@/hooks/useLongPressInteraction";
import CommonDropdownItemsMobileWrapper from "@/components/utils/select/dropdown/CommonDropdownItemsMobileWrapper";
import WaveDropMobileMenuDelete from "@/components/waves/drops/WaveDropMobileMenuDelete";
import WaveDropMobileMenuOpen from "@/components/waves/drops/WaveDropMobileMenuOpen";

interface MemesLeaderboardDropProps {
  readonly drop: ExtendedDrop;
  readonly onDropClick: (drop: ExtendedDrop) => void;
  readonly location?: DropLocation;
}

export const MemesLeaderboardDrop: React.FC<MemesLeaderboardDropProps> = ({
  drop,
  onDropClick,
  location = DropLocation.WAVE,
}) => {
  const isMobileScreen = useIsMobileScreen();
  const { canDelete } = useDropInteractionRules(drop);
  const [isVotingModalOpen, setIsVotingModalOpen] = useState<boolean>(false);

  // Get device info from useDeviceInfo hook
  const { hasTouchScreen } = useDeviceInfo();

  // Use long press interaction hook with touch screen info from device hook
  const { isActive, setIsActive, touchHandlers } = useLongPressInteraction({
    hasTouchScreen,
  });

  // Extract metadata
  const title =
    drop.metadata?.find((m) => m.data_key === "title")?.data_value ??
    "Artwork Title";
  const description =
    drop.metadata?.find((m) => m.data_key === "description")?.data_value ??
    "This is an artwork submission for The Memes collection.";

  // Get artwork media URL if available
  const artworkMedia = drop.parts.at(0)?.media.at(0);

  // Get top voters for votes display
  const firstThreeVoters = drop.top_raters?.slice(0, 3) ?? [];

  return (
    <div
      className="tw-w-full tw-cursor-pointer tw-@container"
      onClick={() => !hasTouchScreen && onDropClick(drop)}>
      <div className="tw-w-full tw-group">
        <div {...touchHandlers}>
          <MemesLeaderboardDropCard drop={drop}>
            <div>
              <div className="tw-p-4">
                <div className="tw-flex tw-flex-col tw-gap-y-1">
                  <div className="tw-flex tw-items-center tw-justify-between">
                    <MemesLeaderboardDropArtistInfo drop={drop} />
                    <div className="tw-flex tw-items-center">
                      {!hasTouchScreen && (
                        <>
                          <div className="tw-h-8">
                            <WaveDropActionsOpen drop={drop} />
                          </div>
                          <div className="tw-h-8">
                            {canDelete && (
                              <WaveDropActionsOptions drop={drop} />
                            )}
                          </div>
                        </>
                      )}
                    </div>
                  </div>
                  <div className="tw-mt-1 sm:tw-mt-0 sm:tw-ml-[3.25rem]">
                    <MemesLeaderboardDropHeader title={title} />
                    <MemesLeaderboardDropDescription
                      description={description}
                    />
                  </div>
                </div>
              </div>

              {artworkMedia && (
                <div
                  className={`tw-flex tw-justify-center tw-h-96 ${
                    location === DropLocation.WAVE
                      ? "tw-bg-iron-800/30"
                      : "tw-bg-iron-900/40"
                  }`}>
                  <DropListItemContentMedia
                    media_mime_type={artworkMedia.mime_type}
                    media_url={artworkMedia.url}
                    isCompetitionDrop={true}
                  />
                </div>
              )}
              <MemeDropTraits drop={drop} />
              <div className="tw-mt-4 lg:tw-mt-0 tw-flex tw-flex-col tw-gap-y-2 @[700px]:tw-flex-row tw-justify-between @[700px]:tw-pb-4 @[700px]:tw-px-4 @[700px]:tw-items-center">
                <div className="tw-px-6 @[700px]:tw-px-0">
                  <MemesLeaderboardDropVoteSummary
                    current={drop.rating}
                    projected={drop.rating_prediction}
                    creditType={drop.wave.voting_credit_type}
                    ratersCount={drop.raters_count}
                    topVoters={firstThreeVoters}
                    userContext={drop.context_profile_context}
                  />
                </div>

                <div
                  className="tw-pt-4 tw-pb-4 tw-px-6 tw-flex tw-justify-center @[700px]:tw-pt-0 @[700px]:tw-pb-0 @[700px]:tw-px-0 tw-w-full @[700px]:tw-w-auto tw-border-t tw-border-solid tw-border-iron-800 @[700px]:tw-border-none tw-border-x-0 tw-border-b-0"
                  onClick={(e) => e.stopPropagation()}>
                  <VotingModalButton
                    drop={drop}
                    onClick={() => setIsVotingModalOpen(true)}
                  />
                </div>
              </div>
            </div>

            {isMobileScreen ? (
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
            )}
          </MemesLeaderboardDropCard>
        </div>

        {/* Touch slide-up menu for leaderboard */}
        {hasTouchScreen &&
          createPortal(
            <CommonDropdownItemsMobileWrapper
              isOpen={isActive}
              setOpen={setIsActive}>
              <div className="tw-grid tw-grid-cols-1 tw-gap-y-2">
                {/* Open drop option */}
                <WaveDropMobileMenuOpen
                  drop={drop}
                  onOpenChange={() => setIsActive(false)}
                />

                {/* Delete option - only if user can delete */}
                {canDelete && (
                  <WaveDropMobileMenuDelete
                    drop={drop}
                    onDropDeleted={() => setIsActive(false)}
                  />
                )}
              </div>
            </CommonDropdownItemsMobileWrapper>,
            document.body
          )}
      </div>
    </div>
  );
};
