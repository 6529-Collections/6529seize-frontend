"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useState } from "react";

import UserCICAndLevel, {
  UserCICAndLevelSize,
} from "@/components/user/utils/UserCICAndLevel";
import type { ApiDrop } from "@/generated/models/ApiDrop";
import { getTimeAgoShort } from "@/helpers/Helpers";
import { getWaveRoute } from "@/helpers/navigation.helpers";
import type { ExtendedDrop } from "@/helpers/waves/drop.helpers";
import useIsMobileDevice from "@/hooks/isMobileDevice";
import useIsTouchDevice from "@/hooks/useIsTouchDevice";
import type { ActiveDropState } from "@/types/dropInteractionTypes";


import { DropLocation } from "../Drop";
import DropCurationButton from "../DropCurationButton";
import WaveDropActions from "../WaveDropActions";
import WaveDropAuthorPfp from "../WaveDropAuthorPfp";
import WaveDropContent from "../WaveDropContent";
import WaveDropMetadata from "../WaveDropMetadata";
import WaveDropMobileMenu from "../WaveDropMobileMenu";
import WaveDropReactions from "../WaveDropReactions";

import type { DropInteractionParams } from "../Drop";

interface EndedParticipationDropProps {
  readonly drop: ExtendedDrop;
  readonly showWaveInfo: boolean;
  readonly activeDrop: ActiveDropState | null;
  readonly showReplyAndQuote: boolean;
  readonly location: DropLocation;
  readonly onReply: (param: DropInteractionParams) => void;
  readonly onQuoteClick: (drop: ApiDrop) => void;
  readonly onDropContentClick?: ((drop: ExtendedDrop) => void) | undefined;
}

export default function EndedParticipationDrop({
  drop,
  showWaveInfo,
  activeDrop,
  showReplyAndQuote,
  location,
  onReply,
  onQuoteClick,
  onDropContentClick,
}: EndedParticipationDropProps) {
  const isActiveDrop = activeDrop?.drop.id === drop.id;
  const router = useRouter();

  const [activePartIndex, setActivePartIndex] = useState(0);
  const [longPressTriggered, setLongPressTriggered] = useState(false);
  const [isSlideUp, setIsSlideUp] = useState(false);
  const isMobile = useIsMobileDevice();
  const hasTouch = useIsTouchDevice() || isMobile;

  const handleNavigation = (e: React.MouseEvent, path: string) => {
    e.preventDefault();
    e.stopPropagation();
    router.push(path);
  };

  const handleLongPress = useCallback(() => {
    if (!hasTouch) return;
    setLongPressTriggered(true);
    setIsSlideUp(true);
  }, [hasTouch]);

  const handleOnReply = useCallback(() => {
    setIsSlideUp(false);
    onReply({ drop, partId: drop.parts[activePartIndex]?.part_id! });
  }, [onReply, drop, activePartIndex]);

  const handleOnAddReaction = useCallback(() => {
    setIsSlideUp(false);
  }, []);

  const getDropLocationBackground = () => {
    if (location === DropLocation.WAVE) {
      return "tw-bg-iron-900/60 tw-ring-1 tw-ring-inset tw-ring-iron-800";
    }
    return "tw-bg-iron-950 tw-ring-1 tw-ring-inset tw-ring-iron-800";
  };

  const dropBackgroundClass = isActiveDrop
    ? "tw-bg-[#3CCB7F]/10"
    : getDropLocationBackground();

  return (
    <div
      className={`${
        location === DropLocation.WAVE ? "tw-px-4 tw-py-1" : ""
      } tw-w-full`}
    >
      <div
        className={`tw-group tw-relative tw-flex tw-w-full tw-flex-col tw-overflow-hidden tw-rounded-lg tw-px-4 tw-py-3 tw-transition-colors tw-duration-200 tw-ease-linear ${dropBackgroundClass}`}
      >
        {!isMobile && showReplyAndQuote && (
          <WaveDropActions
            drop={drop}
            activePartIndex={activePartIndex}
            showVoting={false}
            onReply={handleOnReply}
          />
        )}

        <div className="tw-flex tw-w-full tw-gap-x-3 tw-border-0 tw-bg-transparent tw-text-left">
          <WaveDropAuthorPfp drop={drop} />

          <div className="tw-flex tw-w-full tw-flex-col tw-gap-y-2">
            <div className="tw-flex tw-flex-col tw-gap-y-2">
              <div className="tw-flex tw-items-center tw-gap-x-2">
                <UserCICAndLevel
                  level={drop.author.level}
                  size={UserCICAndLevelSize.SMALL}
                />

                <p className="tw-mb-0 tw-text-md tw-font-semibold tw-leading-none">
                  <Link
                    onClick={(e) =>
                      handleNavigation(
                        e,
                        `/${drop.author.handle ?? drop.author.primary_address}`
                      )
                    }
                    href={`/${drop.author.handle ?? drop.author.primary_address}`}
                    className="tw-text-iron-200 tw-no-underline tw-transition tw-duration-300 tw-ease-out hover:tw-text-iron-500"
                  >
                    {drop.author.handle ?? drop.author.primary_address}
                  </Link>
                </p>

                <div className="tw-size-[3px] tw-flex-shrink-0 tw-rounded-full tw-bg-iron-600"></div>

                <p className="tw-mb-0 tw-whitespace-nowrap tw-text-xs tw-font-normal tw-leading-none tw-text-iron-500">
                  {getTimeAgoShort(drop.created_at)}
                </p>
              </div>
              <div className="tw-flex tw-w-fit tw-items-center tw-whitespace-nowrap tw-rounded-md tw-border tw-border-solid tw-border-iron-500/25 tw-bg-iron-600/10 tw-px-2 tw-py-0.5 tw-font-medium tw-text-iron-500">
                <span className="tw-text-xs">Participant</span>
              </div>
            </div>

            {showWaveInfo &&
              (() => {
                const waveMeta = (
                  drop.wave as unknown as {
                    chat?:
                      | {
                          scope?:
                            | {
                                group?:
                                  | { is_direct_message?: boolean | undefined }
                                  | undefined;
                              }
                            | undefined;
                        }
                      | undefined;
                  }
                ).chat;
                const isDirectMessage =
                  waveMeta?.scope?.group?.is_direct_message ?? false;
                const waveHref = getWaveRoute({
                  waveId: drop.wave.id,
                  isDirectMessage,
                  isApp: false,
                });
                return (
                  <Link
                    href={waveHref}
                    onClick={(e) => handleNavigation(e, waveHref)}
                    className="tw-leading-0 tw-text-[11px] tw-text-iron-500 tw-no-underline tw-transition tw-duration-300 tw-ease-out hover:tw-text-iron-300"
                  >
                    {drop.wave.name}
                  </Link>
                );
              })()}

            <WaveDropContent
              drop={drop}
              activePartIndex={activePartIndex}
              setActivePartIndex={setActivePartIndex}
              onLongPress={handleLongPress}
              onDropContentClick={onDropContentClick}
              onQuoteClick={onQuoteClick}
              setLongPressTriggered={setLongPressTriggered}
              isCompetitionDrop={true}
              hasTouch={hasTouch}
            />
          </div>
        </div>

        {drop.metadata.length > 0 && (
          <div className="tw-flex tw-w-full tw-flex-wrap tw-items-center tw-gap-x-2 tw-gap-y-1">
            <WaveDropMetadata metadata={drop.metadata} />
          </div>
        )}
        <div className="tw-flex tw-w-full tw-flex-wrap tw-items-center tw-gap-x-2 tw-gap-y-1">
          <DropCurationButton
            dropId={drop.id}
            waveId={drop.wave.id}
            isCuratable={drop.context_profile_context?.curatable ?? false}
            isCurated={drop.context_profile_context?.curated ?? false}
          />
          <WaveDropReactions drop={drop} />
        </div>

        <WaveDropMobileMenu
          drop={drop}
          isOpen={isSlideUp}
          longPressTriggered={longPressTriggered}
          showReplyAndQuote={showReplyAndQuote}
          setOpen={setIsSlideUp}
          onReply={handleOnReply}
          onAddReaction={handleOnAddReaction}
        />
      </div>
    </div>
  );
}
