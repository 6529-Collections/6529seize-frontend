import { Drop } from "../../../../generated/models/Drop";
import WaveDetailedDropActions from "./WaveDetailedDropActions";
import WaveDetailedDropReply from "./WaveDetailedDropReply";
import WaveDetailedDropContent from "./WaveDetailedDropContent";
import WaveDetailedDropHeader from "./WaveDetailedDropHeader";
import WaveDetailedDropAuthorPfp from "./WaveDetailedDropAuthorPfp";
import WaveDetailedDropRatings from "./WaveDetailedDropRatings";
import { ActiveDropState } from "../WaveDetailedContent";
import { useState } from "react";
import WaveDetailedDropMetadata from "./WaveDetailedDropMetadata";

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
  const isActiveDrop = activeDrop?.drop.id === drop.id;
  const [activePartIndex, setActivePartIndex] = useState<number>(0);

  const isPreviousDropSameAuthor =
    !!previousDrop &&
    previousDrop.author.handle === drop.author.handle &&
    Math.abs(
      new Date(previousDrop.created_at).getTime() -
        new Date(drop.created_at).getTime()
    ) <= 60000;

  const isNextDropSameAuthor =
    !!nextDrop &&
    nextDrop.author.handle === drop.author.handle &&
    Math.abs(
      new Date(nextDrop.created_at).getTime() -
        new Date(drop.created_at).getTime()
    ) <= 60000;

  return (
    <div
      className={`tw-relative tw-group tw-w-full tw-flex tw-flex-col tw-px-4 tw-transition-colors tw-duration-300 ${
        isActiveDrop
          ? "tw-bg-[#3CCB7F]/10 tw-border-l-2 tw-border-l-[#3CCB7F] tw-border-solid tw-border-y-0 tw-border-r-0"
          : "tw-bg-iron-950"
      } ${
        isPreviousDropSameAuthor
          ? ""
          : isNextDropSameAuthor
          ? "tw-pt-4"
          : "tw-py-4"
      }`}
    >
      {!!drop.reply_to &&
        drop.reply_to.drop_id !== rootDropId &&
        !isPreviousDropSameAuthor && (
          <WaveDetailedDropReply
            dropId={drop.reply_to.drop_id}
            dropPartId={drop.reply_to.drop_part_id}
            maybeDrop={
              drop.reply_to.drop
                ? {
                    ...drop.reply_to.drop,
                    wave: drop.wave,
                  }
                : null
            }
          />
        )}
      <div className="tw-flex tw-gap-x-3">
        {!isPreviousDropSameAuthor && <WaveDetailedDropAuthorPfp drop={drop} />}
        <div
          className={`${
            isPreviousDropSameAuthor ? "" : "tw-mt-1"
          } tw-flex tw-flex-col tw-w-full`}
        >
          {!isPreviousDropSameAuthor && (
            <WaveDetailedDropHeader
              drop={drop}
              showWaveInfo={showWaveInfo}
              isStorm={!!drop.parts.length && drop.parts.length > 1}
              currentPartIndex={activePartIndex}
              partsCount={drop.parts.length}
            />
          )}

          <div className={`${isPreviousDropSameAuthor ? "tw-ml-[52px]" : ""}`}>
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
