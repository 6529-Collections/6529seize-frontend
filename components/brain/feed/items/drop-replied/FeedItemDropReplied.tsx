import DropsListItem from "../../../../drops/view/item/DropsListItem";
import { IFeedItemDropReplied } from "../../../../../types/feed.types";
import WaveDetailedDrop from "../../../../waves/detailed/drops/WaveDetailedDrop";

export default function FeedItemDropReplied({
  item,
  showWaveInfo,
}: {
  readonly item: IFeedItemDropReplied;
  readonly showWaveInfo: boolean;
}) {
  return (
    <WaveDetailedDrop
      drop={{
        ...item.item.drop,
        stableKey: "",
        stableHash: "",
      }}
      previousDrop={null}
      nextDrop={null}
      showWaveInfo={showWaveInfo}
      activeDrop={null}
      showReplyAndQuote={true}
      onReply={() => {}}
      onQuote={() => {}}
      onReplyClick={() => {}}
      onQuoteClick={() => {}}
    />
  );
}
