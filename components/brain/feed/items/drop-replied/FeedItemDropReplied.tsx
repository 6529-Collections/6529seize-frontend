import DropsListItem from "../../../../drops/view/item/DropsListItem";
import { IFeedItemDropReplied } from "../../../../../types/feed.types";
import WaveDetailedDrop, { DropInteractionParams } from "../../../../waves/detailed/drops/WaveDetailedDrop";

export default function FeedItemDropReplied({
  item,
  showWaveInfo,
  onReply,
  onQuote,
}: {
  readonly item: IFeedItemDropReplied;
  readonly showWaveInfo: boolean;
  readonly onReply: (param: DropInteractionParams) => void;
  readonly onQuote: (param: DropInteractionParams) => void;
}) {
  return (
    <WaveDetailedDrop
      drop={{
        ...item.item.reply,
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
