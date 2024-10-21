import { IFeedItemDropCreated } from "../../../../../types/feed.types";
import WaveDetailedDrop, {
  DropInteractionParams,
} from "../../../../waves/detailed/drops/WaveDetailedDrop";

export default function FeedItemDropCreated({
  item,
  showWaveInfo,
  onReply,
  onQuote,
}: {
  readonly item: IFeedItemDropCreated;
  readonly showWaveInfo: boolean;
  readonly onReply: (param: DropInteractionParams) => void;
  readonly onQuote: (param: DropInteractionParams) => void;
}) {
  return (
    <WaveDetailedDrop
      drop={{
        ...item.item,
        stableKey: "",
        stableHash: "",
      }}
      previousDrop={null}
      nextDrop={null}
      showWaveInfo={showWaveInfo}
      activeDrop={null}
      showReplyAndQuote={true}
      onReply={onReply}
      onQuote={onQuote}
      onReplyClick={() => {}}
      onQuoteClick={() => {}}
    />
  );
}
