import { useRef } from "react";
import { ExtendedDrop } from "../../../helpers/waves/drop.helpers";
import { TypedFeedItem } from "../../../types/feed.types";
import { ActiveDropState } from "../../../types/dropInteractionTypes";
import { DropInteractionParams } from "../../waves/detailed/drops/Drop";
import FeedItems from "./FeedItems";
import { FeedScrollContainer } from "./FeedScrollContainer";

interface FeedWrapperProps {
  readonly items: TypedFeedItem[];
  readonly loading: boolean;
  readonly showWaveInfo: boolean;
  readonly activeDrop: ActiveDropState | null;
  readonly onBottomIntersection: (state: boolean) => void;
  readonly onReply: (param: DropInteractionParams) => void;
  readonly onQuote: (param: DropInteractionParams) => void;
  readonly onDropContentClick?: (drop: ExtendedDrop) => void;
}

export default function FeedWrapper({
  items,
  loading,
  showWaveInfo,
  activeDrop,
  onBottomIntersection,
  onReply,
  onQuote,
  onDropContentClick,
}: FeedWrapperProps) {
  const scrollRef = useRef<HTMLDivElement>(null);

  const handleScrollUpNearTop = () => {
    onBottomIntersection(true);
  };

  return (
    <FeedScrollContainer
      ref={scrollRef}
      onScrollUpNearTop={handleScrollUpNearTop}
      isFetchingNextPage={loading}
    >
      <FeedItems
        items={items}
        showWaveInfo={showWaveInfo}
        activeDrop={activeDrop}
        onReply={onReply}
        onQuote={onQuote}
        onDropContentClick={onDropContentClick}
      />
    </FeedScrollContainer>
  );
}
