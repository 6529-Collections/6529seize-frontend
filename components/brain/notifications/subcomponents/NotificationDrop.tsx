"use client";

import type { DropInteractionParams } from "@/components/waves/drops/Drop";
import Drop, { DropLocation } from "@/components/waves/drops/Drop";
import type { ApiDrop } from "@/generated/models/ApiDrop";
import type { ExtendedDrop } from "@/helpers/waves/drop.helpers";
import { convertApiDropToExtendedDrop } from "@/helpers/waves/drop.helpers";
import useDeviceInfo from "@/hooks/useDeviceInfo";
import type { ActiveDropState } from "@/types/dropInteractionTypes";
import type { ReactNode } from "react";
import CompactDropPreview from "./CompactDropPreview";

function wrapDropContentInCompact(content: ReactNode) {
  return (
    <CompactDropPreview>
      <div className="tw-w-full tw-min-w-0">{content}</div>
    </CompactDropPreview>
  );
}

interface NotificationDropProps {
  readonly drop: ApiDrop;
  readonly activeDrop: ActiveDropState | null;
  readonly onReply: (param: DropInteractionParams) => void;
  readonly onReplyClick: (serialNo: number) => void;
  readonly onQuoteClick: (quote: ApiDrop) => void;
  readonly onDropContentClick?: ((drop: ExtendedDrop) => void) | undefined;
}

export default function NotificationDrop({
  drop,
  activeDrop,
  onReply,
  onReplyClick,
  onQuoteClick,
  onDropContentClick,
}: NotificationDropProps) {
  const { isApp } = useDeviceInfo();
  const extendedDrop = convertApiDropToExtendedDrop(drop);

  return (
    <div
      className={`tw-w-full tw-min-w-0 ${isApp ? "[--drop-card-background:theme(colors.iron.900)]" : ""}`}
    >
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
        onReplyClick={onReplyClick}
        onQuoteClick={onQuoteClick}
        onDropContentClick={onDropContentClick}
        wrapContentOnly={wrapDropContentInCompact}
      />
    </div>
  );
}
