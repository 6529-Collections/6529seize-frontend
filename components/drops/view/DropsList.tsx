import { useEffect, useState } from "react";
import { Drop } from "../../../generated/models/Drop";
import CommonIntersectionElement from "../../utils/CommonIntersectionElement";
import { getDropKey } from "../../../helpers/waves/drop.helpers";
import WaveDetailedDrop from "../../waves/detailed/drops/WaveDetailedDrop";
import { ActiveDropState } from "../../waves/detailed/WaveDetailedContent";

interface DropsListProps {
  readonly drops: Drop[];
  readonly showWaveInfo: boolean;
  readonly activeDrop: ActiveDropState | null;
  readonly rootDropId: string | null;
  readonly showReplyAndQuote: boolean;
  readonly onIntersection: (state: boolean) => void;
  readonly onReply: ({ drop, partId }: { drop: Drop; partId: number }) => void;
  readonly onQuote: ({ drop, partId }: { drop: Drop; partId: number }) => void;
}

export default function DropsList({
  drops,
  showWaveInfo,
  activeDrop,
  rootDropId,
  showReplyAndQuote,
  onIntersection,
  onReply,
  onQuote,
}: DropsListProps) {
  const [intersectionTargetIndex, setIntersectionTargetIndex] = useState<
    number | null
  >(null);

  useEffect(() => {
    setIntersectionTargetIndex(drops.length >= 10 ? 9 : null);
  }, [drops]);

  return (
    <div className="tw-flex tw-flex-col">
      {drops.map((drop, i) => (
        <div key={getDropKey({ drop, returnOriginal: i !== drops.length - 1 })}>
          {intersectionTargetIndex === i && (
            <CommonIntersectionElement onIntersection={onIntersection} />
          )}
          <WaveDetailedDrop
            drop={drop}
            previousDrop={drops[i - 1] ?? null}
            showWaveInfo={showWaveInfo}
            activeDrop={activeDrop}
            onReply={onReply}
            onQuote={onQuote}
            rootDropId={rootDropId}
            showReplyAndQuote={showReplyAndQuote}
          />
        </div>
      ))}
    </div>
  );
}
