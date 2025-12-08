"use client";

import { INotificationIdentityMentioned } from "@/types/feed.types";
import { getTimeAgoShort } from "@/helpers/Helpers";
import { ActiveDropState } from "@/types/dropInteractionTypes";
import Drop, {
  DropInteractionParams,
  DropLocation,
} from "@/components/waves/drops/Drop";
import { DropSize, ExtendedDrop } from "@/helpers/waves/drop.helpers";
import { UserFollowBtnSize } from "@/components/user/utils/UserFollowBtn";
import NotificationsFollowBtn from "../NotificationsFollowBtn";
import NotificationHeader from "../subcomponents/NotificationHeader";
import {
  useWaveNavigation,
  getIsDirectMessage,
} from "../utils/navigationUtils";

export default function NotificationIdentityMentioned({
  notification,
  activeDrop,
  onReply,
  onQuote,
  onDropContentClick,
}: {
  readonly notification: INotificationIdentityMentioned;
  readonly activeDrop: ActiveDropState | null;
  readonly onReply: (param: DropInteractionParams) => void;
  readonly onQuote: (param: DropInteractionParams) => void;
  readonly onDropContentClick?: (drop: ExtendedDrop) => void;
}) {
  const { navigateToWave, createQuoteClickHandler } = useWaveNavigation();
  const baseWave = notification.related_drops[0].wave;
  const baseIsDm = getIsDirectMessage(baseWave);

  const onReplyClick = (serialNo: number) => {
    navigateToWave(baseWave.id, serialNo, baseIsDm);
  };

  const onQuoteClick = createQuoteClickHandler(baseIsDm);

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
          mentioned you
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
