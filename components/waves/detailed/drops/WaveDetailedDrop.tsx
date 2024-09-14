import { Drop } from "../../../../generated/models/Drop";
import WaveDetailedDropActions from "./WaveDetailedDropActions";
import WaveDetailedDropReply from "./WaveDetailedDropReply";
import WaveDetailedDropContent from "./WaveDetailedDropContent";
import WaveDetailedDropHeader from "./WaveDetailedDropHeader";
import WaveDetailedDropAuthorPfp from "./WaveDetailedDropAuthorPfp";
import WaveDetailedDropRatings from "./WaveDetailedDropRatings";
import { ActiveDropState } from "../WaveDetailedContent";
import { useState } from "react";

interface WaveDetailedDropProps {
  readonly drop: Drop;
  readonly showWaveInfo: boolean;
  readonly activeDrop: ActiveDropState | null;
  readonly rootDropId: string | null;
  readonly onReply: ({ drop, partId }: { drop: Drop; partId: number }) => void;
  readonly onQuote: ({ drop, partId }: { drop: Drop; partId: number }) => void;
}

export default function WaveDetailedDrop({
  drop,
  showWaveInfo,
  activeDrop,
  rootDropId,
  onReply,
  onQuote,
}: WaveDetailedDropProps) {
  const isActiveDrop = activeDrop?.drop.id === drop.id;
  const [activePartIndex, setActivePartIndex] = useState<number>(0);

  return (
    <div
      className={`tw-relative tw-group tw-w-full tw-flex tw-flex-col tw-px-4 tw-py-2 tw-transition-colors tw-duration-300 ${
        isActiveDrop
          ? "tw-bg-[#3CCB7F]/10 tw-border-l-2 tw-border-l-[#3CCB7F] tw-border-solid tw-border-y-0 tw-border-r-0"
          : "tw-bg-iron-950"
      }`}
    >
      {!!drop.reply_to && drop.reply_to.drop_id !== rootDropId && (
        <WaveDetailedDropReply
          dropId={drop.reply_to.drop_id}
          dropPartId={drop.reply_to.drop_part_id}
        />
      )}
      <div className="tw-flex tw-gap-x-3">
        <WaveDetailedDropAuthorPfp drop={drop} />
        <div className="tw-mt-1 tw-flex tw-flex-col tw-w-full">
          <WaveDetailedDropHeader drop={drop} showWaveInfo={showWaveInfo} />

          <div className="tw-mt-0.5">
            <WaveDetailedDropContent
              drop={drop}
              activePartIndex={activePartIndex}
              setActivePartIndex={setActivePartIndex}
            />
          </div>
        </div>
      </div>

      <WaveDetailedDropActions
        drop={drop}
        onReply={() =>
          onReply({ drop, partId: drop.parts[activePartIndex].part_id })
        }
        onQuote={() =>
          onQuote({ drop, partId: drop.parts[activePartIndex].part_id })
        }
      />
      <WaveDetailedDropRatings drop={drop} />
    </div>
  );
}
