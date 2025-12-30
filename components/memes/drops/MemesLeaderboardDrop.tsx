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
import Link from "next/link";
import { formatNumberWithCommas } from "@/helpers/Helpers";
import { ImageScale } from "@/helpers/image.helpers";
import { useMediaQuery } from "@/hooks/useMediaQuery";

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
  const isTabletOrSmaller = useMediaQuery("(max-width: 1023px)");
  const { canDelete } = useDropInteractionRules(drop);
  const [isVotingModalOpen, setIsVotingModalOpen] = useState<boolean>(false);

  // Get device info from useDeviceInfo hook
  const { hasTouchScreen } = useDeviceInfo();
  let mediaImageScale = ImageScale.AUTOx800;
  if (isMobileScreen) {
    mediaImageScale = ImageScale.AUTOx450;
  } else if (isTabletOrSmaller) {
    mediaImageScale = ImageScale.AUTOx600;
  }

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
              {/* Artist info section with border */}
              <div className="tw-p-4 tw-pb-3 tw-border-b tw-border-solid tw-border-x-0 tw-border-t-0 tw-border-white/5 tw-bg-iron-900/30">
                <div className="tw-flex tw-items-start tw-justify-between tw-gap-4">
                  <MemesLeaderboardDropArtistInfo drop={drop} />
                  <div className="tw-flex tw-gap-2 tw-text-iron-400">
                    {!hasTouchScreen && (
                      <>
                        <WaveDropActionsOpen drop={drop} />
                        {canDelete && (
                          <WaveDropActionsOptions drop={drop} />
                        )}
                      </>
                    )}
                  </div>
                </div>
              </div>

              {/* Title and Description */}
              <div className="tw-px-4 tw-pt-4 tw-pb-4">
                <div className="tw-space-y-1">
                  <MemesLeaderboardDropHeader title={title} />
                  <MemesLeaderboardDropDescription
                    description={description}
                  />
                </div>
              </div>

              {artworkMedia && (
                <div
                  className={`tw-flex tw-justify-center tw-h-96 ${
                    location === DropLocation.WAVE
                      ? "tw-bg-iron-950"
                      : "tw-bg-iron-900/40"
                  }`}>
                  <DropListItemContentMedia
                    media_mime_type={artworkMedia.mime_type}
                    media_url={artworkMedia.url}
                    isCompetitionDrop={true}
                    imageScale={mediaImageScale}
                  />
                </div>
              )}

              {/* Footer Section: Traits + Vote Summary + Vote Button */}
              <div className="tw-p-4 tw-mt-4 tw-border-t tw-border-solid tw-border-x-0 tw-border-b-0 tw-border-white/5 tw-bg-iron-900/30 tw-flex tw-flex-col tw-gap-y-4">
                <MemeDropTraits drop={drop} />

                <div className="tw-flex tw-flex-col @[700px]:tw-flex-row @[700px]:tw-items-center tw-justify-between tw-gap-4">
                  <MemesLeaderboardDropVoteSummary
                    current={drop.rating}
                    projected={drop.rating_prediction}
                    creditType={drop.wave.voting_credit_type}
                    ratersCount={drop.raters_count}
                    topVoters={firstThreeVoters}
                    userContext={drop.context_profile_context}
                  />

                  <div
                    className="tw-flex tw-w-full @[700px]:tw-w-auto tw-items-center tw-justify-between @[700px]:tw-justify-end tw-gap-4 tw-flex-shrink-0"
                    onClick={(e) => e.stopPropagation()}>
                    {/* Voters - only on small containers */}
                    <div className="tw-flex @[700px]:tw-hidden tw-items-center tw-gap-2">
                      <div className="tw-flex tw-items-center -tw-space-x-2">
                        {firstThreeVoters.map((voter) => (
                          <Link
                            key={voter.profile.handle}
                            href={`/${voter.profile.handle}`}
                            onClick={(e) => e.stopPropagation()}
                          >
                            {voter.profile.pfp ? (
                              <img
                                className="tw-w-6 tw-h-6 tw-rounded-md tw-border-2 tw-border-solid tw-border-[#111] tw-bg-iron-800 tw-object-contain"
                                src={voter.profile.pfp}
                                alt="Recent voter"
                              />
                            ) : (
                              <div className="tw-w-6 tw-h-6 tw-rounded-lg tw-border-2 tw-border-solid tw-border-[#111] tw-bg-iron-800" />
                            )}
                          </Link>
                        ))}
                      </div>
                      <span className="tw-text-white tw-font-bold tw-text-xs">
                        {formatNumberWithCommas(drop.raters_count)}{" "}
                        <span className="tw-text-iron-500 tw-font-normal">
                          {drop.raters_count === 1 ? "voter" : "voters"}
                        </span>
                      </span>
                    </div>
                    <VotingModalButton
                      drop={drop}
                      onClick={() => setIsVotingModalOpen(true)}
                    />
                  </div>
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
              setOpen={setIsActive}
            >
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
