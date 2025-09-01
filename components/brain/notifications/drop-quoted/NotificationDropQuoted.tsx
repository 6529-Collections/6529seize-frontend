"use client";

import { DropSize, ExtendedDrop } from "../../../../helpers/waves/drop.helpers";
import { INotificationDropQuoted } from "../../../../types/feed.types";
import { ActiveDropState } from "../../../../types/dropInteractionTypes";
import Drop, {
  DropInteractionParams,
  DropLocation,
} from "../../../waves/drops/Drop";
import { useRouter } from "next/navigation";
import { ApiDrop } from "../../../../generated/models/ApiDrop";

export default function NotificationDropQuoted({
  notification,
  activeDrop,
  onReply,
  onQuote,
  onDropContentClick,
}: {
  readonly notification: INotificationDropQuoted;
  readonly activeDrop: ActiveDropState | null;
  readonly onReply: (param: DropInteractionParams) => void;
  readonly onQuote: (param: DropInteractionParams) => void;
  readonly onDropContentClick?: (drop: ExtendedDrop) => void;
}) {
  const router = useRouter();

  const navigateToWave = (waveId: string, serialNo: number) => {
    router.push(`/my-stream?wave=${waveId}&serialNo=${serialNo}/`);
  };

  const onReplyClick = (serialNo: number) => {
    navigateToWave(notification.related_drops[0].wave.id, serialNo);
  };

  const onQuoteClick = (quote: ApiDrop) => {
    navigateToWave(quote.wave.id, quote.serial_no);
  };

  return (
    <Drop
      drop={{
        type: DropSize.FULL,
        ...notification.related_drops[0],
        stableKey: "",
        stableHash: "",
      }}
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
