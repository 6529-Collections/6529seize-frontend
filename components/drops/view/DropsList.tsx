import { useEffect, useState, useRef } from "react";
import { Drop } from "../../../generated/models/Drop";
import CommonIntersectionElement from "../../utils/CommonIntersectionElement";
import WaveDetailedDrop from "../../waves/detailed/drops/WaveDetailedDrop";
import { ActiveDropState } from "../../waves/detailed/WaveDetailedContent";
import { ExtendedDrop } from "../../waves/detailed/drops/WaveDrops";

interface DropsListProps {
  readonly drops: ExtendedDrop[];
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
  const intersectionElementRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setIntersectionTargetIndex(drops.length >= 10 ? 9 : drops.length - 1);
  }, [drops]);

  useEffect(() => {
    if (intersectionElementRef.current) {
      const observer = new IntersectionObserver(
        ([entry]) => {
          if (entry.isIntersecting) {
            onIntersection(true);
            observer.disconnect();
          }
        },
        { threshold: 0.1 }
      );

      observer.observe(intersectionElementRef.current);

      return () => observer.disconnect();
    }
  }, [onIntersection, intersectionTargetIndex]);

  return (
    <div className="tw-flex tw-flex-col">
      {drops.map((drop, i) => (
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
      ))}
    </div>
  );
}
