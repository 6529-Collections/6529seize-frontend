"use client";

import { UserFollowBtnSize } from "@/components/user/utils/UserFollowBtn";
import { DropInteractionParams } from "@/components/waves/drops/Drop";
import { ExtendedDrop } from "@/helpers/waves/drop.helpers";
import { ActiveDropState } from "@/types/dropInteractionTypes";
import { INotificationPriorityAlert } from "@/types/feed.types";
import NotificationsFollowBtn from "../NotificationsFollowBtn";
import NotificationDrop from "../subcomponents/NotificationDrop";
import NotificationHeader from "../subcomponents/NotificationHeader";
import NotificationTimestamp from "../subcomponents/NotificationTimestamp";
import {
  getIsDirectMessage,
  useWaveNavigation,
} from "../utils/navigationUtils";

export default function NotificationPriorityAlert({
  notification,
  activeDrop,
  onReply,
  onQuote,
  onDropContentClick,
}: {
  readonly notification: INotificationPriorityAlert;
  readonly activeDrop: ActiveDropState | null;
  readonly onReply: (param: DropInteractionParams) => void;
  readonly onQuote: (param: DropInteractionParams) => void;
  readonly onDropContentClick?: (drop: ExtendedDrop) => void;
}) {
  const { createReplyClickHandler, createQuoteClickHandler } =
    useWaveNavigation();

  const headerSection = (
    <NotificationHeader
      author={notification.related_identity}
      actions={
        <NotificationsFollowBtn
          profile={notification.related_identity}
          size={UserFollowBtnSize.SMALL}
        />
      }>
      <span className="tw-text-sm tw-font-normal tw-text-iron-50">
        <span className="tw-text-iron-400">sent a priority alert 🚨</span>{" "}
        <NotificationTimestamp createdAt={notification.created_at} />
      </span>
    </NotificationHeader>
  );

  if (!notification.related_drops || notification.related_drops.length === 0) {
    return (
      <div className="tw-w-full tw-flex tw-gap-x-3">
        <div className="tw-w-full tw-flex tw-flex-col tw-space-y-2">
          {headerSection}
        </div>
      </div>
    );
  }

  const drop = notification.related_drops[0];
  const isDirectMessage = getIsDirectMessage(drop.wave);

  return (
    <div className="tw-w-full tw-flex tw-gap-x-3">
      <div className="tw-w-full tw-flex tw-flex-col tw-space-y-2">
        {headerSection}

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
    </div>
  );
}
