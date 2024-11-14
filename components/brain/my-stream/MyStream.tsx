import FeedWrapper from "../feed/FeedWrapper";
import { DropInteractionParams } from "../../waves/detailed/drops/WaveDetailedDrop";
import { TypedFeedItem } from "../../../types/feed.types";
import { ActiveDropState } from "../../waves/detailed/chat/WaveChat";

interface MyStreamProps {
  readonly onReply: (param: DropInteractionParams) => void;
  readonly onQuote: (param: DropInteractionParams) => void;
  readonly activeDrop: ActiveDropState | null;
  readonly items: TypedFeedItem[];
  readonly isFetching: boolean;
  readonly onBottomIntersection: (state: boolean) => void;
}

export default function MyStream({
  onReply,
  onQuote,
  activeDrop,
  items,
  isFetching,
  onBottomIntersection,
}: MyStreamProps) {

  return (
    <div className="tw-flex-shrink-0">
      <FeedWrapper
        items={items}
        loading={isFetching}
        showWaveInfo={true}
        activeDrop={activeDrop}
        onBottomIntersection={onBottomIntersection}
        onReply={onReply}
        onQuote={onQuote}
      />
    </div>
  );
}
