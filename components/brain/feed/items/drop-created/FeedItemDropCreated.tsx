"use client";

import { useRouter } from "next/navigation";
import { IFeedItemDropCreated } from "@/types/feed.types";
import Drop, {
  DropInteractionParams,
  DropLocation,
} from "@/components/waves/drops/Drop";
import { ApiDrop } from "@/generated/models/ApiDrop";
import { ActiveDropState } from "@/types/dropInteractionTypes";
import {
  DropSize,
  ExtendedDrop,
} from "@/helpers/waves/drop.helpers";

export default function FeedItemDropCreated({
  item,
  showWaveInfo,
  activeDrop,
  onReply,
  onQuote,
  onDropContentClick,
}: {
  readonly item: IFeedItemDropCreated;
  readonly showWaveInfo: boolean;
  readonly activeDrop: ActiveDropState | null;
  readonly onReply: (param: DropInteractionParams) => void;
  readonly onQuote: (param: DropInteractionParams) => void;
  readonly onDropContentClick?: (drop: ExtendedDrop) => void;
}) {
  const router = useRouter();
  const onReplyClick = (serialNo: number) => {
    router.push(`/my-stream?wave=${item.item.wave.id}&serialNo=${serialNo}/`);
  };

  const onQuoteClick = (quote: ApiDrop) => {
    router.push(
      `/my-stream?wave=${quote.wave.id}&serialNo=${quote.serial_no}/`
    );
  };
  return (
    <Drop
      drop={{
        type: DropSize.FULL,
        ...item.item,
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
      onDropContentClick={onDropContentClick}
    />
  );
}
