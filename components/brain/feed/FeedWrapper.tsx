import { useMemo } from "react";
import { ExtendedDrop } from "../../../helpers/waves/drop.helpers";
import { useScrollBehavior } from "../../../hooks/useScrollBehavior";
import { TypedFeedItem } from "../../../types/feed.types";
import { ActiveDropState } from "../../waves/detailed/chat/WaveChat";
import { DropInteractionParams } from "../../waves/detailed/drops/Drop";
import { WaveDropsScrollContainer } from "../../waves/detailed/drops/WaveDropsScrollContainer";
import FeedItems from "./FeedItems";
import useCapacitor from "../../../hooks/useCapacitor";

interface FeedWrapperProps {
  readonly items: TypedFeedItem[];
  readonly loading: boolean;
  readonly showWaveInfo: boolean;
  readonly activeDrop: ActiveDropState | null;
  readonly onTopIntersection: () => void;
  readonly onReply: (param: DropInteractionParams) => void;
  readonly onQuote: (param: DropInteractionParams) => void;
  readonly onDropClick: (drop: ExtendedDrop) => void;
  readonly showInput?: boolean;
}

export default function FeedWrapper({
  items,
  loading,
  showWaveInfo,
  activeDrop,
  onTopIntersection,
  onReply,
  onQuote,
  onDropClick,
  showInput = false
}: FeedWrapperProps) {
  const {
    scrollContainerRef,
    isAtBottom,
    scrollToBottom,
    scrollToTop,
    handleScroll,
  } = useScrollBehavior();

  const capacitor = useCapacitor();
  const containerClassName = useMemo(() => {
    if (showInput) {
      return `tw-w-full tw-flex tw-flex-col ${
        capacitor.isCapacitor
          ? "tw-h-[calc(100vh-21rem)]"
          : "tw-h-[calc(100vh-21rem)] lg:tw-h-[calc(100vh-14.5rem)]"
      }`;
    }
    return `tw-w-full tw-flex tw-flex-col ${
      capacitor.isCapacitor
        ? "tw-h-[calc(100vh-16rem)]"
        : "tw-h-[calc(100vh-16rem)] lg:tw-h-[calc(100vh-8.5rem)]"
    }`;
  }, [capacitor.isCapacitor, showInput]);

  if (!items.length) {
    return null;
  }

  return (
    <div className={containerClassName}>
      <div className="tw-flex tw-flex-col tw-relative tw-overflow-y-auto">
        <WaveDropsScrollContainer
          ref={scrollContainerRef}
          onScroll={handleScroll}
          newItemsCount={0}
          isFetchingNextPage={false}
          onTopIntersection={onTopIntersection}
        >
          <div>
            {loading && (
              <div className="tw-w-full tw-h-0.5 tw-bg-iron-800 tw-overflow-hidden">
                <div className="tw-w-full tw-h-full tw-bg-indigo-400 tw-animate-loading-bar"></div>
              </div>
            )}
            <FeedItems
              items={items}
              showWaveInfo={showWaveInfo}
              activeDrop={activeDrop}
              onReply={onReply}
              onQuote={onQuote}
              onDropClick={onDropClick}
            />
          </div>
        </WaveDropsScrollContainer>
      </div>
    </div>
  );
}
