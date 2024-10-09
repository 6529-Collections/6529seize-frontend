import { memo, useCallback, useEffect, useState, useRef } from "react";
import WaveDetailedDropActions from "./WaveDetailedDropActions";
import WaveDetailedDropReply from "./WaveDetailedDropReply";
import WaveDetailedDropContent from "./WaveDetailedDropContent";
import WaveDetailedDropHeader from "./WaveDetailedDropHeader";
import WaveDetailedDropAuthorPfp from "./WaveDetailedDropAuthorPfp";
import WaveDetailedDropRatings from "./WaveDetailedDropRatings";
import { ActiveDropState } from "../WaveDetailedContent";
import { ExtendedDrop } from "../../../../helpers/waves/drop.helpers";
import WaveDetailedDropMetadata from "./WaveDetailedDropMetadata";
import { Drop } from "../../../../generated/models/Drop";
import useIsMobileDevice from "../../../../hooks/isMobileDevice";
import WaveDetailedDropMobileMenu from "./WaveDetailedDropMobileMenu";

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

interface WaveDetailedDropProps {
  readonly drop: ExtendedDrop;
  readonly previousDrop: ExtendedDrop | null;
  readonly nextDrop: ExtendedDrop | null;
  readonly showWaveInfo: boolean;
  readonly activeDrop: ActiveDropState | null;
  readonly showReplyAndQuote: boolean;
  readonly onReply: ({
    drop,
    partId,
  }: {
    drop: ExtendedDrop;
    partId: number;
  }) => void;
  readonly onQuote: ({
    drop,
    partId,
  }: {
    drop: ExtendedDrop;
    partId: number;
  }) => void;
  readonly onReplyClick: (serialNo: number) => void;
  readonly onQuoteClick: (drop: Drop) => void;
}

const WaveDetailedDrop = ({
  drop,
  previousDrop,
  nextDrop,
  showWaveInfo,
  activeDrop,
  onReply,
  onQuote,
  onReplyClick,
  onQuoteClick,
  showReplyAndQuote,
}: WaveDetailedDropProps) => {
  const [activePartIndex, setActivePartIndex] = useState<number>(0);
  const [isSlideUp, setIsSlideUp] = useState(false);
  const [longPressTriggered, setLongPressTriggered] = useState(false);
  const longPressTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const touchStartPosition = useRef<{ x: number; y: number } | null>(null);

  const isActiveDrop = activeDrop?.drop.id === drop.id;
  const isStorm = drop.parts.length > 1;

  const shouldGroupWithPreviousDrop = shouldGroupWithDrop(drop, previousDrop);
  const shouldGroupWithNextDrop = shouldGroupWithDrop(drop, nextDrop);

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
    if (isMobile) return;
    onReply({ drop, partId: drop.parts[activePartIndex].part_id });
  }, [onReply, drop, activePartIndex, isMobile]);

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

  return (
    <div
      className={`tw-relative tw-group tw-w-full tw-flex tw-flex-col tw-px-4 tw-transition-colors tw-duration-300 ${
        isActiveDrop
          ? "tw-bg-[#3CCB7F]/10 tw-border-l-2 tw-border-l-[#3CCB7F] tw-border-solid tw-border-y-0 tw-border-r-0"
          : "tw-bg-iron-950 tw-rounded-xl"
      } ${groupingClass}`}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
      onTouchMove={handleTouchMove}
    >
      {drop.reply_to &&
        drop.reply_to.drop_id !== previousDrop?.reply_to?.drop_id && (
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
      <div className="tw-flex tw-gap-x-3">
        {!shouldGroupWithPreviousDrop && (
          <WaveDetailedDropAuthorPfp drop={drop} />
        )}
        <div
          className={`${
            shouldGroupWithPreviousDrop ? "" : "tw-mt-1"
          } tw-flex tw-flex-col tw-w-full`}
        >
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
      <div className="tw-flex tw-w-full tw-justify-end tw-items-center tw-gap-x-2">
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
  );
};

export default memo(WaveDetailedDrop);
