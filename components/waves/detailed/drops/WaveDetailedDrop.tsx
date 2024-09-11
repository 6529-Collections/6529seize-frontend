import { Drop } from "../../../../generated/models/Drop";
import WaveDetailedDropActions from "./WaveDetailedDropActions";
import WaveDetailedDropReply from "./WaveDetailedDropReply";
import WaveDetailedDropContent from "./WaveDetailedDropContent";
import WaveDetailedDropHeader from "./WaveDetailedDropHeader";
import WaveDetailedDropAuthorPfp from "./WaveDetailedDropAuthorPfp";
import WaveDetailedDropRatings from "./WaveDetailedDropRatings";
import { ActiveDropState } from "../WaveDetailedContent";

interface WaveDetailedDropProps {
  readonly drop: Drop;
  readonly showWaveInfo: boolean;
  readonly activeDrop: ActiveDropState | null;
  readonly onReply: () => void;
  readonly onQuote: () => void;
}

export default function WaveDetailedDrop({
  drop,
  showWaveInfo,
  activeDrop,
  onReply,
  onQuote,
}: WaveDetailedDropProps) {
  const isActiveDrop = activeDrop?.drop.id === drop.id;
  
  return (
    <div 
      className={`tw-relative tw-group tw-w-full tw-flex tw-flex-col tw-p-2 tw-transition-colors tw-duration-300 ${
        isActiveDrop ? 'tw-bg-iron-900' : 'tw-bg-iron-950'
      }`}
    >
      {!!drop.reply_to && (
        <WaveDetailedDropReply
          dropId={drop.reply_to.drop_id}
          dropPartId={drop.reply_to.drop_part_id}
        />
      )}
      <div className="tw-flex tw-gap-x-3">
        <WaveDetailedDropAuthorPfp drop={drop} />
        <div className="-tw-mt-0.5 tw-flex tw-flex-col">
          <WaveDetailedDropHeader drop={drop} showWaveInfo={showWaveInfo} />

          <div className="tw-mt-1">
            <WaveDetailedDropContent drop={drop} />
          </div>
        </div>
      </div>

      <WaveDetailedDropActions
        drop={drop}
        onReply={onReply}
        onQuote={onQuote}
      />
      <WaveDetailedDropRatings drop={drop} />
    </div>
  );
}
