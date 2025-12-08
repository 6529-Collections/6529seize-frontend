"use client";

import { INotificationDropReplied } from "@/types/feed.types";
import { getTimeAgoShort } from "@/helpers/Helpers";
import { ActiveDropState } from "@/types/dropInteractionTypes";
import Drop, {
  DropInteractionParams,
  DropLocation,
} from "@/components/waves/drops/Drop";
import { DropSize, ExtendedDrop } from "@/helpers/waves/drop.helpers";
import { ApiDrop } from "@/generated/models/ApiDrop";
import NotificationsFollowBtn from "../NotificationsFollowBtn";
import { UserFollowBtnSize } from "@/components/user/utils/UserFollowBtn";
import NotificationHeader from "../subcomponents/NotificationHeader";
import { useWaveNavigation } from "../utils/navigationUtils";

export default function NotificationDropReplied({
  notification,
  activeDrop,
  onReply,
  onQuote,
  onDropContentClick,
}: {
  readonly notification: INotificationDropReplied;
  readonly activeDrop: ActiveDropState | null;
  readonly onReply: (param: DropInteractionParams) => void;
  readonly onQuote: (param: DropInteractionParams) => void;
  readonly onDropContentClick?: (drop: ExtendedDrop) => void;
}) {
  const { navigateToWave } = useWaveNavigation();
  const baseWave = notification.related_drops[1].wave as any;
  const isDirectMessage =
    baseWave?.chat?.scope?.group?.is_direct_message ?? false;

  const onReplyClick = (serialNo: number) => {
    navigateToWave(notification.related_drops[1].wave.id, serialNo, isDirectMessage);
  };

  const onQuoteClick = (quote: ApiDrop) => {
    const quoteWave = quote.wave as any;
    const quoteIsDm =
      quoteWave?.chat?.scope?.group?.is_direct_message ?? isDirectMessage;
    navigateToWave(quote.wave.id, quote.serial_no, quoteIsDm);
  };
  return (
    <div className="tw-w-full tw-flex tw-flex-col tw-space-y-2">
      <NotificationHeader
        author={notification.related_drops[1].author}
        actions={
          <NotificationsFollowBtn
            profile={notification.related_drops[1].author}
            size={UserFollowBtnSize.SMALL}
          />
        }
      >
        <span className="tw-text-iron-400 tw-font-normal tw-text-sm">
          replied
        </span>
        <span className="tw-text-sm tw-text-iron-300 tw-font-normal tw-whitespace-nowrap">
          <span className="tw-font-bold tw-mr-1 tw-text-iron-400">
            &#8226;
          </span>
          {getTimeAgoShort(notification.created_at)}
        </span>
      </NotificationHeader>

      <Drop
        drop={{
          type: DropSize.FULL,
          ...notification.related_drops[1],
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
