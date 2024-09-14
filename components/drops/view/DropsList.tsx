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
  readonly rootDropId: string | null;
  readonly onBottomIntersection: (state: boolean) => void;
  readonly onReply: ({ drop, partId }: { drop: Drop; partId: number }) => void;
  readonly onQuote: ({ drop, partId }: { drop: Drop; partId: number }) => void;
}

export default function DropsList({
  drops,
  showWaveInfo,
  activeDrop,
  rootDropId,
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
            onReply={onReply}
            onQuote={onQuote}
            rootDropId={rootDropId}
          />
          {!!intersectionTargetIndex && intersectionTargetIndex === i && (
            <CommonIntersectionElement onIntersection={onBottomIntersection} />
          )}
        </div>
      ))}
    </div>
  );
}
