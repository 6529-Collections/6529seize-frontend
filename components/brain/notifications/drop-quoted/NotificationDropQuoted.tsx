import { ExtendedDrop } from "../../../../helpers/waves/drop.helpers";
import { INotificationDropQuoted } from "../../../../types/feed.types";
import { ActiveDropState } from "../../../waves/detailed/chat/WaveChat";
import Drop, {
  DropInteractionParams,
  DropLocation,
} from "../../../waves/detailed/drops/Drop";
import { useRouter } from "next/router";
import { ApiDrop } from "../../../../generated/models/ApiDrop";

export default function NotificationDropQuoted({
  notification,
  activeDrop,
  onReply,
  onQuote,
  onDropClick,
}: {
  readonly notification: INotificationDropQuoted;
  readonly activeDrop: ActiveDropState | null;
  readonly onReply: (param: DropInteractionParams) => void;
  readonly onQuote: (param: DropInteractionParams) => void;
  readonly onDropClick: (drop: ExtendedDrop) => void;
}) {
  const router = useRouter();
  const onReplyClick = (serialNo: number) => {
    router.push(
      `/waves/${notification.related_drops[0].wave.id}?drop=${serialNo}/`
    );
  };

  const onQuoteClick = (quote: ApiDrop) => {
    router.push(`/waves/${quote.wave.id}?drop=${quote.serial_no}/`);
  };
  return (
    <Drop
      drop={{
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
      onDropClick={onDropClick}
    />
  );
}
