"use client";

import type { DropInteractionParams } from "@/components/waves/drops/Drop";
import Drop, { DropLocation } from "@/components/waves/drops/Drop";
import type { ApiDrop } from "@/generated/models/ApiDrop";
import type { ExtendedDrop } from "@/helpers/waves/drop.helpers";
import { convertApiDropToExtendedDrop } from "@/helpers/waves/drop.helpers";
import type { ActiveDropState } from "@/types/dropInteractionTypes";
import CollapsibleDropPreview from "./CollapsibleDropPreview";

interface NotificationDropProps {
  readonly drop: ApiDrop;
  readonly activeDrop: ActiveDropState | null;
  readonly onReply: (param: DropInteractionParams) => void;
  readonly onQuote: (param: DropInteractionParams) => void;
  readonly onReplyClick: (serialNo: number) => void;
  readonly onQuoteClick: (quote: ApiDrop) => void;
  readonly onDropContentClick?: ((drop: ExtendedDrop) => void) | undefined;
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
      wrapContentOnly={(content) => (
        <CollapsibleDropPreview>
          <div className="tw-w-full tw-min-w-0">{content}</div>
        </CollapsibleDropPreview>
      )}
    />
  );
}
