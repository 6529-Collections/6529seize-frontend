"use client";

import { UserFollowBtnSize } from "@/components/user/utils/UserFollowBtn";
import { DropInteractionParams } from "@/components/waves/drops/Drop";
import { ExtendedDrop } from "@/helpers/waves/drop.helpers";
import { ActiveDropState } from "@/types/dropInteractionTypes";
import { INotificationIdentityMentioned } from "@/types/feed.types";
import NotificationsFollowBtn from "../NotificationsFollowBtn";
import NotificationDrop from "../subcomponents/NotificationDrop";
import NotificationHeader from "../subcomponents/NotificationHeader";
import NotificationTimestamp from "../subcomponents/NotificationTimestamp";
import {
  getIsDirectMessage,
  useWaveNavigation,
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
  const { createReplyClickHandler, createQuoteClickHandler } =
    useWaveNavigation();
  const drop = notification.related_drops[0];
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
        }>
        <span className="tw-text-iron-400 tw-font-normal tw-text-sm">
          mentioned you
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
