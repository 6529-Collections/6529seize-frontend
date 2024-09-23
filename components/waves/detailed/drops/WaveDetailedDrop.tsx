import { useState } from "react";
import WaveDetailedDropActions from "./WaveDetailedDropActions";
import WaveDetailedDropReply from "./WaveDetailedDropReply";
import WaveDetailedDropContent from "./WaveDetailedDropContent";
import WaveDetailedDropHeader from "./WaveDetailedDropHeader";
import WaveDetailedDropAuthorPfp from "./WaveDetailedDropAuthorPfp";
import WaveDetailedDropRatings from "./WaveDetailedDropRatings";
import { ActiveDropState } from "../WaveDetailedContent";
import { ExtendedDrop } from "../../../../helpers/waves/drop.helpers";
import WaveDetailedDropMetadata from "./WaveDetailedDropMetadata";

enum GroupingThreshold {
  TIME_DIFFERENCE = 60000,
}

const shouldGroupWithDrop = (
  currentDrop: ExtendedDrop,
  otherDrop: ExtendedDrop | null,
  rootDropId: string | null
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
  const currentReplyToRoot = currentDrop.reply_to?.drop_id === rootDropId;
  const repliesInSameThread =
    currentDrop.reply_to?.drop_id === otherDrop.reply_to?.drop_id;

  return bothNotReplies || currentReplyToRoot || repliesInSameThread;
};

interface WaveDetailedDropProps {
  readonly drop: ExtendedDrop;
  readonly previousDrop: ExtendedDrop | null;
  readonly nextDrop: ExtendedDrop | null;
  readonly showWaveInfo: boolean;
  readonly activeDrop: ActiveDropState | null;
  readonly rootDropId: string | null;
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
}

export default function WaveDetailedDrop({
  drop,
  previousDrop,
  nextDrop,
  showWaveInfo,
  activeDrop,
  rootDropId,
  onReply,
  onQuote,
  showReplyAndQuote,
}: WaveDetailedDropProps) {
  const [activePartIndex, setActivePartIndex] = useState<number>(0);

  const isActiveDrop = activeDrop?.drop.id === drop.id;
  const isStorm = drop.parts.length > 1;

  const shouldGroupWithPreviousDrop = shouldGroupWithDrop(
    drop,
    previousDrop,
    rootDropId
  );
  const shouldGroupWithNextDrop = shouldGroupWithDrop(
    drop,
    nextDrop,
    rootDropId
  );

  const getGroupingClass = () => {
    if (shouldGroupWithPreviousDrop) return "";
    if (shouldGroupWithNextDrop) return "tw-pt-4";
    return "tw-py-4";
  };

  const groupingClass = getGroupingClass();

  return (
    <div
      className={`tw-relative tw-group tw-w-full tw-flex tw-flex-col tw-px-4 tw-transition-colors tw-duration-300 ${
        isActiveDrop
          ? "tw-bg-[#3CCB7F]/10 tw-border-l-2 tw-border-l-[#3CCB7F] tw-border-solid tw-border-y-0 tw-border-r-0"
          : "tw-bg-iron-950 hover:tw-bg-iron-900"
      } ${groupingClass}`}
    >
      {drop.reply_to &&
        drop.reply_to.drop_id !== rootDropId &&
        drop.reply_to.drop_id !== previousDrop?.reply_to?.drop_id && (
          <WaveDetailedDropReply
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
            />
          </div>
        </div>
      </div>
      {showReplyAndQuote && (
        <WaveDetailedDropActions
          drop={drop}
          activePartIndex={activePartIndex}
          onReply={() =>
            onReply({ drop, partId: drop.parts[activePartIndex].part_id })
          }
          onQuote={() =>
            onQuote({ drop, partId: drop.parts[activePartIndex].part_id })
          }
        />
      )}
      <div className="tw-flex tw-w-full tw-justify-end tw-items-center tw-gap-x-2">
        {drop.metadata.length > 0 && (
          <WaveDetailedDropMetadata metadata={drop.metadata} />
        )}
        {!!drop.raters_count && <WaveDetailedDropRatings drop={drop} />}
      </div>
    </div>
  );
}
