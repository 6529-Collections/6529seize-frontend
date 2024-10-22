import { useRouter } from "next/router";
import { IFeedItemDropReplied } from "../../../../../types/feed.types";
import WaveDetailedDrop, {
  DropInteractionParams,
} from "../../../../waves/detailed/drops/WaveDetailedDrop";
import { ActiveDropState } from "../../../../waves/detailed/WaveDetailedContent";
import { ApiDrop } from "../../../../../generated/models/ApiDrop";

export default function FeedItemDropReplied({
  item,
  showWaveInfo,
  activeDrop,
  onReply,
  onQuote,
}: {
  readonly item: IFeedItemDropReplied;
  readonly showWaveInfo: boolean;
  readonly activeDrop: ActiveDropState | null;
  readonly onReply: (param: DropInteractionParams) => void;
  readonly onQuote: (param: DropInteractionParams) => void;
}) {
  const router = useRouter();
  const onReplyClick = (serialNo: number) => {
    router.push(`/waves/${item.item.reply.wave.id}?drop=${serialNo}/`);
  };

  const onQuoteClick = (quote: ApiDrop) => {
    router.push(`/waves/${quote.wave.id}?drop=${quote.serial_no}/`);
  };

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
      activeDrop={activeDrop}
      showReplyAndQuote={true}
      border={true}
      onReply={onReply}
      onQuote={onQuote}
      onReplyClick={onReplyClick}
      onQuoteClick={onQuoteClick}
    />
  );
}
