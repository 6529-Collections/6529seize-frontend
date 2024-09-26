import { useEffect, useState, useMemo } from "react";
import { Drop } from "../../../generated/models/Drop";
import CommonIntersectionElement from "../../utils/CommonIntersectionElement";
import WaveDetailedDrop from "../../waves/detailed/drops/WaveDetailedDrop";
import { ActiveDropState } from "../../waves/detailed/WaveDetailedContent";
import { ExtendedDrop } from "../../../helpers/waves/drop.helpers";
import { useIntersectionObserver } from "../../../hooks/useIntersectionObserver";
type DropActionHandler = ({
  drop,
  partId,
}: {
  drop: Drop;
  partId: number;
}) => void;

interface DropsListProps {
  readonly drops: ExtendedDrop[];
  readonly showWaveInfo: boolean;
  readonly activeDrop: ActiveDropState | null;
  readonly showReplyAndQuote: boolean;
  readonly isFetchingNextPage: boolean;
  readonly onIntersection: (state: boolean) => void;
  readonly onReply: DropActionHandler;
  readonly onQuote: DropActionHandler;
  readonly onActiveDropClick?: () => void;
}

export default function DropsList({
  drops,
  showWaveInfo,
  activeDrop,
  showReplyAndQuote,
  isFetchingNextPage,
  onIntersection,
  onReply,
  onQuote,
  onActiveDropClick,
}: DropsListProps) {
  const [intersectionTargetIndex, setIntersectionTargetIndex] = useState<
    number | null
  >(null);
  const intersectionElementRef = useIntersectionObserver(onIntersection);

  useEffect(() => {
    setIntersectionTargetIndex(drops.length >= 40 ? 30 : drops.length - 1);
  }, [drops]);

  const memoizedDrops = useMemo(
    () =>
      drops.map((drop, i) => (
        <div key={drop.stableKey}>
          {intersectionTargetIndex === i && (
            <div ref={intersectionElementRef}>
              <CommonIntersectionElement onIntersection={onIntersection} />
            </div>
          )}
          <WaveDetailedDrop
            drop={drop}
            previousDrop={drops[i - 1] ?? null}
            nextDrop={drops[i + 1] ?? null}
            showWaveInfo={showWaveInfo}
            activeDrop={activeDrop}
            onReply={onReply}
            onQuote={onQuote}
            showReplyAndQuote={showReplyAndQuote}
            onActiveDropClick={onActiveDropClick}
          />
        </div>
      )),
    [
      drops,
      intersectionTargetIndex,
      showWaveInfo,
      activeDrop,
      onReply,
      onQuote,
      showReplyAndQuote,
      onActiveDropClick,
    ]
  );

  return (
    <div className="tw-flex tw-flex-col">
      {isFetchingNextPage && (
        <div className="tw-w-full tw-h-0.5 tw-bg-iron-800 tw-overflow-hidden">
          <div className="tw-w-full tw-h-full tw-bg-indigo-400 tw-animate-loading-bar"></div>
        </div>
      )}
      {memoizedDrops}
    </div>
  );
}
