import { memo, useCallback, useEffect, useState, useRef } from "react";
import WaveDetailedDropActions from "./WaveDetailedDropActions";
import WaveDetailedDropReply from "./WaveDetailedDropReply";
import WaveDetailedDropContent from "./WaveDetailedDropContent";
import WaveDetailedDropHeader from "./WaveDetailedDropHeader";
import WaveDetailedDropAuthorPfp from "./WaveDetailedDropAuthorPfp";
import WaveDetailedDropRatings from "./WaveDetailedDropRatings";
import { ExtendedDrop } from "../../../../helpers/waves/drop.helpers";
import WaveDetailedDropMetadata from "./WaveDetailedDropMetadata";
import { ApiDrop } from "../../../../generated/models/ApiDrop";
import useIsMobileDevice from "../../../../hooks/isMobileDevice";
import WaveDetailedDropMobileMenu from "./WaveDetailedDropMobileMenu";
import { ApiDropType } from "../../../../generated/models/ApiDropType";
import { ActiveDropState } from "../chat/WaveChat";
import { DropInteractionParams, DropLocation } from "./Drop";


enum GroupingThreshold {
  TIME_DIFFERENCE = 60000,
}

const shouldGroupWithDrop = (
  currentDrop: ExtendedDrop,
  otherDrop: ExtendedDrop | null
): boolean => {
  if (!otherDrop || currentDrop.parts.length > 1) {
    return false;
  }

  const isSameAuthor = currentDrop.author.handle === otherDrop.author.handle;
  const isWithinTimeThreshold =
    Math.abs(currentDrop.created_at - otherDrop.created_at) <=
    GroupingThreshold.TIME_DIFFERENCE;

  if (!isSameAuthor || !isWithinTimeThreshold) {
    return false;
  }

  const bothNotReplies = !currentDrop.reply_to && !otherDrop.reply_to;
  const repliesInSameThread =
    currentDrop.reply_to?.drop_id === otherDrop.reply_to?.drop_id;

  return bothNotReplies || repliesInSameThread;
};

const RANK_STYLES = {
  1: "tw-border tw-border-solid tw-border-[#E8D48A]/40 tw-bg-[linear-gradient(90deg,rgba(31,31,37,0.9)_0%,rgba(66,56,41,0.95)_100%)] tw-shadow-[inset_0_0_20px_rgba(217,169,98,0.15)] hover:tw-shadow-[inset_0_0_25px_rgba(217,169,98,0.2)]",
  2: "tw-border tw-border-solid tw-border-[#DDDDDD]/40 tw-bg-[linear-gradient(90deg,rgba(31,31,37,0.9)_0%,rgba(45,45,50,0.95)_100%)] tw-shadow-[inset_0_0_20px_rgba(192,192,192,0.1)] hover:tw-shadow-[inset_0_0_25px_rgba(192,192,192,0.15)]",
  3: "tw-border tw-border-solid tw-border-[#CD7F32]/40 tw-bg-[linear-gradient(90deg,rgba(31,31,37,0.9)_0%,rgba(60,46,36,0.95)_100%)] tw-shadow-[inset_0_0_20px_rgba(205,127,50,0.1)] hover:tw-shadow-[inset_0_0_25px_rgba(205,127,50,0.15)]",
  default:
    "tw-border tw-border-solid tw-border tw-border-iron-600/40 tw-bg-[linear-gradient(90deg,rgba(31,31,37,0.95)_0%,rgba(35,35,40,0.98)_100%)] tw-shadow-[inset_0_0_16px_rgba(255,255,255,0.03)] hover:tw-shadow-[inset_0_0_20px_rgba(255,255,255,0.05)]",
} as const;

const getColorClasses = ({
  isActiveDrop,
  rank,
  isDrop,
}: {
  isActiveDrop: boolean;
  rank: number | null;
  isDrop: boolean;
}): string => {
  if (isActiveDrop) {
    return "tw-bg-[#3CCB7F]/10 tw-border-l-2 tw-border-l-[#3CCB7F] tw-border-solid tw-border-y-0 tw-border-r-0";
  }
  if (!isDrop) return "tw-bg-iron-950";

  const rankClass =
    RANK_STYLES[rank as keyof typeof RANK_STYLES] ?? RANK_STYLES.default;
  return ` ${rankClass} tw-transition-shadow tw-duration-300`.trim();
};

const getDropClasses = (
  isActiveDrop: boolean,
  groupingClass: string,
  location: DropLocation,
  rank: number | null,
  isDrop: boolean
): string => {
  const baseClasses =
    "tw-relative tw-group tw-w-full tw-flex tw-flex-col tw-px-4 tw-transition-colors tw-duration-300";

  const streamClasses = `tw-rounded-xl ${
    !isDrop && "tw-ring-1 tw-ring-inset tw-ring-iron-800"
  }`;

  const chatDropClasses = isDrop ? "tw-rounded-lg tw-my-0.5" : "";

  const rankClasses = getColorClasses({ isActiveDrop, rank, isDrop });

  return `${baseClasses} ${groupingClass} ${
    location === DropLocation.MY_STREAM ? streamClasses : chatDropClasses
  } ${rankClasses}`.trim();
};

interface WaveDetailedDropProps {
  readonly drop: ExtendedDrop;
  readonly previousDrop: ExtendedDrop | null;
  readonly nextDrop: ExtendedDrop | null;
  readonly showWaveInfo: boolean;
  readonly activeDrop: ActiveDropState | null;
  readonly showReplyAndQuote: boolean;
  readonly location: DropLocation;
  readonly dropViewDropId: string | null;
  readonly onReply: (param: DropInteractionParams) => void;
  readonly onQuote: (param: DropInteractionParams) => void;
  readonly onReplyClick: (serialNo: number) => void;
  readonly onQuoteClick: (drop: ApiDrop) => void;
  readonly onDropClick: (drop: ExtendedDrop) => void;
  readonly parentContainerRef?: React.RefObject<HTMLElement>;
}

const WaveDetailedDrop = ({
  drop,
  previousDrop,
  nextDrop,
  showWaveInfo,
  activeDrop,
  location,
  dropViewDropId,
  onReply,
  onQuote,
  onReplyClick,
  onQuoteClick,
  onDropClick,
  showReplyAndQuote,
  parentContainerRef,
}: WaveDetailedDropProps) => {
  const [activePartIndex, setActivePartIndex] = useState<number>(0);
  const [isSlideUp, setIsSlideUp] = useState(false);
  const [longPressTriggered, setLongPressTriggered] = useState(false);
  const longPressTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const touchStartPosition = useRef<{ x: number; y: number } | null>(null);
  const isActiveDrop = activeDrop?.drop.id === drop.id;
  const isStorm = drop.parts.length > 1;
  const isDrop = drop.drop_type === ApiDropType.Participatory;

  const shouldGroupWithPreviousDrop =
    !isDrop && shouldGroupWithDrop(drop, previousDrop);
  const shouldGroupWithNextDrop =
    !isDrop && shouldGroupWithDrop(drop, nextDrop);

  const isMobile = useIsMobileDevice();

  const getGroupingClass = () => {
    if (shouldGroupWithPreviousDrop) return "";
    if (shouldGroupWithNextDrop) return "tw-pt-4";
    return "tw-py-4";
  };

  const groupingClass = getGroupingClass();

  const handleLongPress = useCallback(() => {
    if (!isMobile) return;
    setLongPressTriggered(true);
    setIsSlideUp(true);
  }, [isMobile]);

  const handleTouchStart = useCallback(
    (e: React.TouchEvent) => {
      if (!isMobile) return;
      const touch = e.touches[0];
      touchStartPosition.current = { x: touch.clientX, y: touch.clientY };
      longPressTimeoutRef.current = setTimeout(handleLongPress, 500);
    },
    [isMobile, handleLongPress]
  );

  const handleTouchEnd = useCallback((e: React.TouchEvent) => {
    if (longPressTimeoutRef.current) {
      clearTimeout(longPressTimeoutRef.current);
    }
    touchStartPosition.current = null;
  }, []);

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    if (!touchStartPosition.current) return;

    const touch = e.touches[0];
    const moveThreshold = 10; // pixels

    const deltaX = Math.abs(touch.clientX - touchStartPosition.current.x);
    const deltaY = Math.abs(touch.clientY - touchStartPosition.current.y);

    if (deltaX > moveThreshold || deltaY > moveThreshold) {
      if (longPressTimeoutRef.current) {
        clearTimeout(longPressTimeoutRef.current);
      }
    }
  }, []);

  const handleDropClick = useCallback(() => {
    onDropClick(drop);
  }, [onDropClick, drop]);

  const handleOnReply = useCallback(() => {
    setIsSlideUp(false);
    onReply({ drop, partId: drop.parts[activePartIndex].part_id });
  }, [onReply, drop, activePartIndex]);

  const handleOnQuote = useCallback(() => {
    setIsSlideUp(false);
    onQuote({ drop, partId: drop.parts[activePartIndex].part_id });
  }, [onQuote, drop, activePartIndex]);

  useEffect(() => {
    return () => {
      if (longPressTimeoutRef.current) {
        clearTimeout(longPressTimeoutRef.current);
      }
    };
  }, []);

  const dropClasses = getDropClasses(
    isActiveDrop,
    groupingClass,
    location,
    drop.rank,
    isDrop
  );

  const onContainerClick = () => {
    if (drop.drop_type === ApiDropType.Participatory) {
      onDropClick(drop);
    }
  };

  return (
    <div
      className={`${
        isDrop && location === DropLocation.WAVE ? "tw-py-0.5 tw-px-4" : ""
      } tw-w-full`}
    >
      <div
        className={dropClasses}
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
        onTouchMove={handleTouchMove}
      >
        {drop.reply_to &&
          drop.reply_to.drop_id !== previousDrop?.reply_to?.drop_id &&
          drop.reply_to.drop_id !== dropViewDropId && (
            <WaveDetailedDropReply
              onReplyClick={onReplyClick}
              dropId={drop.reply_to.drop_id}
              dropPartId={drop.reply_to.drop_part_id}
              maybeDrop={
                drop.reply_to.drop
                  ? { ...drop.reply_to.drop, wave: drop.wave }
                  : null
              }
            />
          )}
        <div
          onClick={onContainerClick}
          className={`tw-flex tw-gap-x-3 tw-relative tw-z-10 ${
            drop.drop_type === ApiDropType.Participatory
              ? "tw-cursor-pointer"
              : ""
          }`}
        >
          {!shouldGroupWithPreviousDrop && (
            <WaveDetailedDropAuthorPfp drop={drop} />
          )}
          <div className="tw-flex tw-flex-col tw-w-full">
            {!shouldGroupWithPreviousDrop && (
              <WaveDetailedDropHeader
                drop={drop}
                showWaveInfo={showWaveInfo}
                isStorm={isStorm}
                currentPartIndex={activePartIndex}
                partsCount={drop.parts.length}
              />
            )}
            <div className={shouldGroupWithPreviousDrop ? "tw-ml-[52px]" : ""}>
              <WaveDetailedDropContent
                drop={drop}
                activePartIndex={activePartIndex}
                setActivePartIndex={setActivePartIndex}
                onLongPress={handleLongPress}
                onDropClick={handleDropClick}
                onQuoteClick={onQuoteClick}
                setLongPressTriggered={setLongPressTriggered}
                parentContainerRef={parentContainerRef}
              />
            </div>
          </div>
        </div>
        {!isMobile && showReplyAndQuote && (
          <WaveDetailedDropActions
            drop={drop}
            activePartIndex={activePartIndex}
            onReply={handleOnReply}
            onQuote={handleOnQuote}
          />
        )}
        <div className="tw-flex tw-w-full tw-justify-end tw-items-center tw-gap-x-2 tw-mt-1">
          {drop.metadata.length > 0 && (
            <WaveDetailedDropMetadata metadata={drop.metadata} />
          )}
          {!!drop.raters_count && <WaveDetailedDropRatings drop={drop} />}
        </div>
        <WaveDetailedDropMobileMenu
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
};

export default memo(WaveDetailedDrop);
