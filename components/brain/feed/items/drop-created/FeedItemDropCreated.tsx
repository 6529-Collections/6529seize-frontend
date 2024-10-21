import { IFeedItemDropCreated } from "../../../../../types/feed.types";
import WaveDetailedDrop from "../../../../waves/detailed/drops/WaveDetailedDrop";

export default function FeedItemDropCreated({
  item,
  showWaveInfo,
}: {
  readonly item: IFeedItemDropCreated;
  readonly showWaveInfo: boolean;
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
      onReply={() => {}}
      onQuote={() => {}}
      onReplyClick={() => {}}
      onQuoteClick={() => {}}
    />
  );
}
