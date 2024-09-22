import { useEffect, useState, useRef, useMemo } from "react";
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
  readonly rootDropId: string | null;
  readonly showReplyAndQuote: boolean;
  readonly onIntersection: (state: boolean) => void;
  readonly onReply: DropActionHandler;
  readonly onQuote: DropActionHandler;
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
  const intersectionElementRef = useIntersectionObserver(onIntersection);

  useEffect(() => {
    setIntersectionTargetIndex(drops.length >= 10 ? 9 : drops.length - 1);
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
            rootDropId={rootDropId}
            showReplyAndQuote={showReplyAndQuote}
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
      rootDropId,
      showReplyAndQuote,
    ]
  );

  return <div className="tw-flex tw-flex-col">{memoizedDrops}</div>;
}
