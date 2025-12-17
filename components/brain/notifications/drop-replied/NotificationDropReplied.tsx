"use client";

import { INotificationDropReplied } from "@/types/feed.types";
import { ActiveDropState } from "@/types/dropInteractionTypes";
import { DropInteractionParams } from "@/components/waves/drops/Drop";
import { ExtendedDrop } from "@/helpers/waves/drop.helpers";
import NotificationsFollowBtn from "../NotificationsFollowBtn";
import { UserFollowBtnSize } from "@/components/user/utils/UserFollowBtn";
import NotificationHeader from "../subcomponents/NotificationHeader";
import NotificationDrop from "../subcomponents/NotificationDrop";
import NotificationTimestamp from "../subcomponents/NotificationTimestamp";
import {
  useWaveNavigation,
  getIsDirectMessage,
} from "../utils/navigationUtils";

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
  const { createReplyClickHandler, createQuoteClickHandler } =
    useWaveNavigation();
  const drop = notification.related_drops[1];
  const isDirectMessage = getIsDirectMessage(drop.wave);

  return (
    <div className="tw-w-full tw-flex tw-flex-col tw-space-y-2">
      <NotificationHeader
        author={drop.author}
        actions={
          <NotificationsFollowBtn
            profile={drop.author}
            size={UserFollowBtnSize.SMALL}
          />
        }
      >
        <span className="tw-text-iron-400 tw-font-normal tw-text-sm">
          replied
        </span>
        <NotificationTimestamp createdAt={notification.created_at} />
      </NotificationHeader>

      <NotificationDrop
        drop={drop}
        activeDrop={activeDrop}
        onReply={onReply}
        onQuote={onQuote}
        onReplyClick={createReplyClickHandler(drop.wave.id, isDirectMessage)}
        onQuoteClick={createQuoteClickHandler(isDirectMessage)}
        onDropContentClick={onDropContentClick}
      />
    </div>
  );
}
