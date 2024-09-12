import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { Drop } from "../../../generated/models/Drop";
import CommonIntersectionElement from "../../utils/CommonIntersectionElement";
import { getDropKey } from "../../../helpers/waves/drop.helpers";
import WaveDetailedDrop from "../../waves/detailed/drops/WaveDetailedDrop";
import { ActiveDropState } from "../../waves/detailed/WaveDetailedContent";

interface DropsListProps {
  readonly drops: Drop[];
  readonly showWaveInfo: boolean;
  readonly activeDrop: ActiveDropState | null;
  readonly onBottomIntersection: (state: boolean) => void;
  readonly onReply: ({ drop }: { drop: Drop }) => void;
  readonly onQuote: ({ drop }: { drop: Drop }) => void;
}

export default function DropsList({
  drops,
  showWaveInfo,
  activeDrop,
  onBottomIntersection,
  onReply,
  onQuote,
}: DropsListProps) {
  const getIntersectionTargetIndex = () => {
    if (drops.length < 5) {
      return null;
    }
    return drops.length - 5;
  };

  const [intersectionTargetIndex, setIntersectionTargetIndex] = useState<
    number | null
  >(getIntersectionTargetIndex());
  const listRef = useRef<HTMLDivElement>(null);
  const scrollPositionRef = useRef<number>(0);

  useEffect(() => {
    setIntersectionTargetIndex(getIntersectionTargetIndex());
  }, [drops]);

  useLayoutEffect(() => {
    if (listRef.current) {
      listRef.current.scrollTop = scrollPositionRef.current;
    }
  });

  const handleScroll = () => {
    if (listRef.current) {
      scrollPositionRef.current = listRef.current.scrollTop;
    }
  };

  return (
    <div
      className="tw-flex tw-flex-col"
      ref={listRef}
      onScroll={handleScroll}
    >
      {drops.map((drop, i) => (
        <div key={getDropKey({ drop, index: i })}>
          <WaveDetailedDrop
            drop={drop}
            showWaveInfo={showWaveInfo}
            activeDrop={activeDrop}
            onReply={() => onReply({ drop })}
            onQuote={() => onQuote({ drop })}
          />
          {!!intersectionTargetIndex && intersectionTargetIndex === i && (
            <CommonIntersectionElement onIntersection={onBottomIntersection} />
          )}
        </div>
      ))}
    </div>
  );
}
