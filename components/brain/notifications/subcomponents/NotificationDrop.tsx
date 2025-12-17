"use client";

import Drop, {
  DropInteractionParams,
  DropLocation,
} from "@/components/waves/drops/Drop";
import { ApiDrop } from "@/generated/models/ApiDrop";
import { convertApiDropToExtendedDrop, ExtendedDrop } from "@/helpers/waves/drop.helpers";
import { ActiveDropState } from "@/types/dropInteractionTypes";

interface NotificationDropProps {
  readonly drop: ApiDrop;
  readonly activeDrop: ActiveDropState | null;
  readonly onReply: (param: DropInteractionParams) => void;
  readonly onQuote: (param: DropInteractionParams) => void;
  readonly onReplyClick: (serialNo: number) => void;
  readonly onQuoteClick: (quote: ApiDrop) => void;
  readonly onDropContentClick?: (drop: ExtendedDrop) => void;
}

export default function NotificationDrop({
  drop,
  activeDrop,
  onReply,
  onQuote,
  onReplyClick,
  onQuoteClick,
  onDropContentClick,
}: NotificationDropProps) {
  const extendedDrop = convertApiDropToExtendedDrop(drop);

  return (
    <Drop
      drop={extendedDrop}
      previousDrop={null}
      nextDrop={null}
      showWaveInfo={true}
      showReplyAndQuote={true}
      activeDrop={activeDrop}
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
