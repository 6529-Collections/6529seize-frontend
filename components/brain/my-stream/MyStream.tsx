import FeedWrapper from "../feed/FeedWrapper";
import { TypedFeedItem } from "../../../types/feed.types";
import { ActiveDropState } from "../../waves/detailed/chat/WaveChat";
import { ExtendedDrop } from "../../../helpers/waves/drop.helpers";
import { DropInteractionParams } from "../../waves/detailed/drops/Drop";

interface MyStreamProps {
  readonly onReply: (param: DropInteractionParams) => void;
  readonly onQuote: (param: DropInteractionParams) => void;
  readonly activeDrop: ActiveDropState | null;
  readonly items: TypedFeedItem[];
  readonly isFetching: boolean;
  readonly onTopIntersection: () => void;
  readonly onDropClick: (drop: ExtendedDrop) => void;
}

export default function MyStream({
  onReply,
  onQuote,
  activeDrop,
  items,
  isFetching,
  onTopIntersection,
  onDropClick,
}: MyStreamProps) {

  return (
    <div className="tw-flex-shrink-0">
      <FeedWrapper
        items={items}
        loading={isFetching}
        showWaveInfo={true}
        activeDrop={activeDrop}
        onTopIntersection={onTopIntersection}
        onReply={onReply}
        onQuote={onQuote}
        onDropClick={onDropClick}
      />
    </div>
  );
}
