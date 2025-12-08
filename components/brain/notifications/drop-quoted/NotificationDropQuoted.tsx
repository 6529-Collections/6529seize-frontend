"use client";

import { getTimeAgoShort } from "@/helpers/Helpers";
import { UserFollowBtnSize } from "@/components/user/utils/UserFollowBtn";
import NotificationsFollowBtn from "../NotificationsFollowBtn";
import { DropSize, ExtendedDrop } from "@/helpers/waves/drop.helpers";
import { INotificationDropQuoted } from "@/types/feed.types";
import { ActiveDropState } from "@/types/dropInteractionTypes";
import Drop, {
  DropInteractionParams,
  DropLocation,
} from "@/components/waves/drops/Drop";
import { ApiDrop } from "@/generated/models/ApiDrop";
import NotificationHeader from "../subcomponents/NotificationHeader";
import { useWaveNavigation } from "../utils/navigationUtils";

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
  const { navigateToWave } = useWaveNavigation();

  const onReplyClick = (serialNo: number) => {
    const baseWave = notification.related_drops[0].wave as any;
    const isDirectMessage =
      baseWave?.chat?.scope?.group?.is_direct_message ?? false;
    navigateToWave(notification.related_drops[0].wave.id, serialNo, isDirectMessage);
  };

  const onQuoteClick = (quote: ApiDrop) => {
    const quoteWave = quote.wave as any;
    const isDirectMessage =
      quoteWave?.chat?.scope?.group?.is_direct_message ?? false;
    navigateToWave(quote.wave.id, quote.serial_no, isDirectMessage);
  };

  return (
    <div className="tw-w-full tw-flex tw-flex-col tw-space-y-2">
      <NotificationHeader
        author={notification.related_drops[0].author}
        actions={
          <NotificationsFollowBtn
            profile={notification.related_drops[0].author}
            size={UserFollowBtnSize.SMALL}
          />
        }
      >
        <span className="tw-text-iron-400 tw-font-normal tw-text-sm">
          quoted you
        </span>
        <span className="tw-text-sm tw-text-iron-300 tw-font-normal tw-whitespace-nowrap">
          <span className="tw-font-bold tw-mr-1 tw-text-xs tw-text-iron-400">
            &#8226;
          </span>
          {getTimeAgoShort(notification.created_at)}
        </span>
      </NotificationHeader>

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
    </div>
  );
}
