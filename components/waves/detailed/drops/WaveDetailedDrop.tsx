import { useState } from "react";
import { Drop } from "../../../../generated/models/Drop";
import WaveDetailedDropActions from "./WaveDetailedDropActions";
import WaveDetailedDropReply from "./WaveDetailedDropReply";
import WaveDetailedDropContent from "./WaveDetailedDropContent";
import WaveDetailedDropHeader from "./WaveDetailedDropHeader";
import WaveDetailedDropAuthorPfp from "./WaveDetailedDropAuthorPfp";
import WaveDetailedDropRatings from "./WaveDetailedDropRatings";
import WaveDetailedDropMetadata from "./WaveDetailedDropMetadata";
import { ActiveDropState } from "../WaveDetailedContent";

enum GroupingThreshold {
  TIME_DIFFERENCE = 60000,
}

interface WaveDetailedDropProps {
  readonly drop: Drop;
  readonly previousDrop: Drop | null;
  readonly nextDrop: Drop | null;
  readonly showWaveInfo: boolean;
  readonly activeDrop: ActiveDropState | null;
  readonly rootDropId: string | null;
  readonly showReplyAndQuote: boolean;
  readonly onReply: ({ drop, partId }: { drop: Drop; partId: number }) => void;
  readonly onQuote: ({ drop, partId }: { drop: Drop; partId: number }) => void;
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

  const shouldGroupWithDrop = (otherDrop: Drop | null) =>
    !isStorm &&
    otherDrop &&
    otherDrop.author.handle === drop.author.handle &&
    Math.abs(new Date(otherDrop.created_at).getTime() - new Date(drop.created_at).getTime()) <= GroupingThreshold.TIME_DIFFERENCE;

  const shouldGroupWithPreviousDrop = shouldGroupWithDrop(previousDrop);
  const shouldGroupWithNextDrop = shouldGroupWithDrop(nextDrop);

  const groupingClass = shouldGroupWithPreviousDrop
    ? ""
    : shouldGroupWithNextDrop
    ? "tw-pt-4"
    : "tw-py-4";

  return (
    <div
      className={`tw-relative tw-group tw-w-full tw-flex tw-flex-col tw-px-4 tw-transition-colors tw-duration-300 ${
        isActiveDrop
          ? "tw-bg-[#3CCB7F]/10 tw-border-l-2 tw-border-l-[#3CCB7F] tw-border-solid tw-border-y-0 tw-border-r-0"
          : "tw-bg-iron-950"
      } ${groupingClass}`}
    >
      {drop.reply_to &&
        drop.reply_to.drop_id !== rootDropId &&
        !shouldGroupWithPreviousDrop && (
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
        {!shouldGroupWithPreviousDrop && <WaveDetailedDropAuthorPfp drop={drop} />}
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
          onReply={() => onReply({ drop, partId: drop.parts[activePartIndex].part_id })}
          onQuote={() => onQuote({ drop, partId: drop.parts[activePartIndex].part_id })}
        />
      )}
      <div className="tw-flex tw-w-full tw-justify-end tw-items-center tw-gap-x-2">
     {/*    {drop.metadata.length > 0 && (
          <WaveDetailedDropMetadata metadata={drop.metadata} />
        )} */}
        {!!drop.raters_count && <WaveDetailedDropRatings drop={drop} />}
      </div>
    </div>
  );
}
