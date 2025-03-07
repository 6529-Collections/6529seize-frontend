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
  readonly parentContainerRef?: React.RefObject<HTMLElement>;
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

  return (
    <div
      className={`${
        location === DropLocation.WAVE ? "tw-px-4 tw-py-1" : ""
      } tw-w-full`}
    >
      <div
        className={`tw-relative tw-w-full tw-flex tw-flex-col tw-px-4 tw-py-3 tw-rounded-lg tw-overflow-hidden tw-group
          ${isActiveDrop ? "tw-bg-[#3CCB7F]/5" : "tw-bg-iron-900"}`}
        style={{
          transition: "background-color 0.2s ease",
        }}
      >
        {!isMobile && showReplyAndQuote && (
          <WaveDropActions
            drop={drop}
            activePartIndex={activePartIndex}
            showVoting={false}
            onReply={handleOnReply}
            onQuote={handleOnQuote}
          />
        )}

        <div className="tw-flex tw-gap-x-3 tw-w-full tw-text-left tw-bg-transparent tw-border-0 tw-relative tw-z-10">
          <WaveDropAuthorPfp drop={drop} />

          <div className="tw-flex tw-flex-col tw-w-full tw-gap-y-2">
            <div className="tw-flex tw-justify-between tw-items-start">
              <div className="tw-flex tw-flex-col tw-gap-1">
                <div className="tw-flex tw-items-center tw-gap-x-2">
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
                        className="tw-no-underline tw-text-iron-200 hover:tw-text-iron-500 tw-transition tw-duration-300 tw-ease-out"
                      >
                        {drop.author.handle}
                      </Link>
                    </p>
                  </div>

                  <div className="tw-size-[3px] tw-bg-iron-600 tw-rounded-full tw-flex-shrink-0"></div>
                  <p className="tw-text-md tw-mb-0 tw-whitespace-nowrap tw-font-normal tw-leading-none tw-text-iron-500">
                    {getTimeAgoShort(drop.created_at)}
                  </p>
                </div>
                {showWaveInfo && (
                  <Link
                    href={`/my-stream?wave=${drop.wave.id}`}
                    onClick={(e) =>
                      handleNavigation(e, `/my-stream?wave=${drop.wave.id}`)
                    }
                    className="tw-text-[11px] tw-leading-0 -tw-mt-1 tw-text-iron-500 hover:tw-text-iron-300 tw-transition tw-duration-300 tw-ease-out tw-no-underline"
                  >
                    {drop.wave.name}
                  </Link>
                )}
              </div>

              {/* Participation medal/ribbon indicator */}
              <div className="tw-flex tw-items-center">
                <svg
                  className="tw-w-4 tw-h-4 tw-text-iron-500 tw-mr-1"
                  fill="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path d="M20,2H4V4L9.81,8.36C6.14,9.57 4.14,13.53 5.35,17.2C6.56,20.87 10.5,22.87 14.19,21.66C17.86,20.45 19.86,16.5 18.65,12.82C17.95,10.71 16.3,9.05 14.19,8.36L20,4V2M14.94,19.5L12,17.78L9.06,19.5L9.84,16.17L7.25,13.93L10.66,13.64L12,10.5L13.34,13.64L16.75,13.93L14.16,16.17L14.94,19.5Z" />
                </svg>
                <span className="tw-text-xs tw-text-iron-500 tw-font-medium">
                  Participant
                </span>
              </div>
            </div>

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
          <div className="tw-flex tw-w-full tw-items-center tw-gap-x-2 tw-ml-[3.25rem]">
            <WaveDropMetadata metadata={drop.metadata} />
          </div>
        )}

        <WaveDropMobileMenu
          drop={drop}
          isOpen={isSlideUp}
          longPressTriggered={longPressTriggered}
          showReplyAndQuote={showReplyAndQuote}
          setOpen={setIsSlideUp}
          onReply={handleOnReply}
          onQuote={handleOnQuote}
        />
      </div>
    </div>
  );
}
