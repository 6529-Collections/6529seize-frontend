import { useRouter } from "next/router";
import { IFeedItemDropReplied } from "../../../../../types/feed.types";
import { ApiDrop } from "../../../../../generated/models/ApiDrop";
import { ActiveDropState } from "../../../../waves/detailed/chat/WaveChat";
import { ExtendedDrop } from "../../../../../helpers/waves/drop.helpers";
import Drop, { DropInteractionParams, DropLocation } from "../../../../waves/detailed/drops/Drop";

export default function FeedItemDropReplied({
  item,
  showWaveInfo,
  activeDrop,
  onReply,
  onQuote,
  onDropClick,
}: {
  readonly item: IFeedItemDropReplied;
  readonly showWaveInfo: boolean;
  readonly activeDrop: ActiveDropState | null;
  readonly onReply: (param: DropInteractionParams) => void;
  readonly onQuote: (param: DropInteractionParams) => void;
  readonly onDropClick: (drop: ExtendedDrop) => void;
}) {
  const router = useRouter();
  const onReplyClick = (serialNo: number) => {
    router.push(`/waves/${item.item.reply.wave.id}?drop=${serialNo}/`);
  };

  const onQuoteClick = (quote: ApiDrop) => {
    router.push(`/waves/${quote.wave.id}?drop=${quote.serial_no}/`);
  };

  return (
    <Drop
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
      location={DropLocation.MY_STREAM}
      dropViewDropId={null}
      onReply={onReply}
      onQuote={onQuote}
      onReplyClick={onReplyClick}
      onQuoteClick={onQuoteClick}
      onDropClick={onDropClick}
    />
  );
}
