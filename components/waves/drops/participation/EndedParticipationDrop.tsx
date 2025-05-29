import { ExtendedDrop } from "../../../../helpers/waves/drop.helpers";
import { ActiveDropState } from "../../../../types/dropInteractionTypes";
import { DropInteractionParams, DropLocation } from "../Drop";
import { ApiDrop } from "../../../../generated/models/ApiDrop";
import { useState, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/router";
import useIsMobileDevice from "../../../../hooks/isMobileDevice";
import WaveDropActions from "../WaveDropActions";
import WaveDropMobileMenu from "../WaveDropMobileMenu";
import WaveDropContent from "../WaveDropContent";
import WaveDropMetadata from "../WaveDropMetadata";
import WaveDropAuthorPfp from "../WaveDropAuthorPfp";
import UserCICAndLevel, {
  UserCICAndLevelSize,
} from "../../../user/utils/UserCICAndLevel";
import { cicToType, getTimeAgoShort } from "../../../../helpers/Helpers";
import WaveDropReactions from "../WaveDropReactions";

interface EndedParticipationDropProps {
  readonly drop: ExtendedDrop;
  readonly showWaveInfo: boolean;
  readonly activeDrop: ActiveDropState | null;
  readonly showReplyAndQuote: boolean;
  readonly location: DropLocation;
  readonly onReply: (param: DropInteractionParams) => void;
  readonly onQuote: (param: DropInteractionParams) => void;
  readonly onQuoteClick: (drop: ApiDrop) => void;
  readonly onDropContentClick?: (drop: ExtendedDrop) => void;
  readonly parentContainerRef?: React.RefObject<HTMLElement | null>;
}

export default function EndedParticipationDrop({
  drop,
  showWaveInfo,
  activeDrop,
  showReplyAndQuote,
  location,
  onReply,
  onQuote,
  onQuoteClick,
  onDropContentClick,
  parentContainerRef,
}: EndedParticipationDropProps) {
  const isActiveDrop = activeDrop?.drop.id === drop.id;
  const router = useRouter();
  const cicType = cicToType(drop.author.cic);

  const [activePartIndex, setActivePartIndex] = useState(0);
  const [longPressTriggered, setLongPressTriggered] = useState(false);
  const [isSlideUp, setIsSlideUp] = useState(false);
  const isMobile = useIsMobileDevice();

  const handleNavigation = (e: React.MouseEvent, path: string) => {
    e.preventDefault();
    e.stopPropagation();
    router.push(path);
  };

  const handleLongPress = useCallback(() => {
    if (!isMobile) return;
    setLongPressTriggered(true);
    setIsSlideUp(true);
  }, [isMobile]);

  const handleOnReply = useCallback(() => {
    setIsSlideUp(false);
    onReply({ drop, partId: drop.parts[activePartIndex].part_id });
  }, [onReply, drop, activePartIndex]);

  const handleOnQuote = useCallback(() => {
    setIsSlideUp(false);
    onQuote({ drop, partId: drop.parts[activePartIndex].part_id });
  }, [onQuote, drop, activePartIndex]);

  const handleOnAddReaction = useCallback(() => {
    setIsSlideUp(false);
  }, []);

  return (
    <div
      className={`${
        location === DropLocation.WAVE ? "tw-px-4 tw-py-1" : ""
      } tw-w-full`}>
      <div
        className={`tw-relative tw-w-full tw-flex tw-flex-col tw-px-4 tw-py-3 tw-rounded-lg tw-overflow-hidden tw-group tw-transition-colors tw-duration-200 tw-ease-linear
          ${
            isActiveDrop
              ? "tw-bg-[#3CCB7F]/10"
              : location === DropLocation.WAVE
              ? "tw-bg-iron-900/60 tw-ring-1 tw-ring-inset tw-ring-iron-800"
              : "tw-bg-iron-950 tw-ring-1 tw-ring-inset tw-ring-iron-800"
          }`}>
        {!isMobile && showReplyAndQuote && (
          <WaveDropActions
            drop={drop}
            activePartIndex={activePartIndex}
            showVoting={false}
            onReply={handleOnReply}
            onQuote={handleOnQuote}
          />
        )}

        <div className="tw-flex tw-gap-x-3 tw-w-full tw-text-left tw-bg-transparent tw-border-0">
          <WaveDropAuthorPfp drop={drop} />

          <div className="tw-flex tw-flex-col tw-w-full tw-gap-y-2">
            <div className="tw-flex tw-items-center tw-gap-x-4">
              <div className="tw-flex tw-items-center tw-gap-x-2">
                <UserCICAndLevel
                  level={drop.author.level}
                  cicType={cicType}
                  size={UserCICAndLevelSize.SMALL}
                />

                <p className="tw-text-md tw-mb-0 tw-leading-none tw-font-semibold">
                  <Link
                    onClick={(e) =>
                      handleNavigation(e, `/${drop.author.handle}`)
                    }
                    href={`/${drop.author.handle}`}
                    className="tw-no-underline tw-text-iron-200 hover:tw-text-iron-500 tw-transition tw-duration-300 tw-ease-out">
                    {drop.author.handle}
                  </Link>
                </p>

                <div className="tw-size-[3px] tw-bg-iron-600 tw-rounded-full tw-flex-shrink-0"></div>

                <p className="tw-text-md tw-mb-0 tw-whitespace-nowrap tw-font-normal tw-leading-none tw-text-iron-500">
                  {getTimeAgoShort(drop.created_at)}
                </p>
              </div>
              <div className="tw-flex tw-items-center tw-rounded-md tw-font-medium tw-whitespace-nowrap -tw-mt-0.5 tw-px-2 tw-py-0.5 tw-bg-iron-600/10 tw-text-iron-500 tw-border tw-border-solid tw-border-iron-500/25">
                <span className="tw-text-xs">Participant</span>
              </div>
            </div>

            {showWaveInfo && (
              <Link
                href={`/my-stream?wave=${drop.wave.id}`}
                onClick={(e) =>
                  handleNavigation(e, `/my-stream?wave=${drop.wave.id}`)
                }
                className="tw-text-[11px] tw-leading-0 tw-text-iron-500 hover:tw-text-iron-300 tw-transition tw-duration-300 tw-ease-out tw-no-underline">
                {drop.wave.name}
              </Link>
            )}

            <WaveDropContent
              drop={drop}
              activePartIndex={activePartIndex}
              setActivePartIndex={setActivePartIndex}
              onLongPress={handleLongPress}
              onDropContentClick={onDropContentClick}
              onQuoteClick={onQuoteClick}
              setLongPressTriggered={setLongPressTriggered}
              parentContainerRef={parentContainerRef}
            />
          </div>
        </div>

        {drop.metadata.length > 0 && (
          <div className="tw-flex tw-w-full tw-items-center tw-gap-x-2 tw-gap-y-1 tw-flex-wrap">
            <WaveDropMetadata metadata={drop.metadata} />
          </div>
        )}
        <div className="tw-flex tw-w-full tw-items-center tw-gap-x-2 tw-gap-y-1 tw-flex-wrap">
          <WaveDropReactions drop={drop} />
        </div>

        <WaveDropMobileMenu
          drop={drop}
          isOpen={isSlideUp}
          longPressTriggered={longPressTriggered}
          showReplyAndQuote={showReplyAndQuote}
          setOpen={setIsSlideUp}
          onReply={handleOnReply}
          onQuote={handleOnQuote}
          onAddReaction={handleOnAddReaction}
        />
      </div>
    </div>
  );
}
