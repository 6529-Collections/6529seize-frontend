"use client";

import { UserFollowBtnSize } from "@/components/user/utils/UserFollowBtn";
import type { DropInteractionParams } from "@/components/waves/drops/Drop";
import { numberWithCommas } from "@/helpers/Helpers";
import type { ExtendedDrop } from "@/helpers/waves/drop.helpers";
import type { ActiveDropState } from "@/types/dropInteractionTypes";
import type { INotificationAllDrops } from "@/types/feed.types";
import { getNotificationVoteColor } from "../drop-reacted/NotificationDropReacted";
import NotificationsFollowBtn from "../NotificationsFollowBtn";
import NotificationDrop from "../subcomponents/NotificationDrop";
import NotificationHeader from "../subcomponents/NotificationHeader";
import NotificationTimestamp from "../subcomponents/NotificationTimestamp";
import {
  getIsDirectMessage,
  useWaveNavigation,
} from "../utils/navigationUtils";

export default function NotificationAllDrops({
  notification,
  activeDrop,
  onReply,
  onQuote,
  onDropContentClick,
}: {
  readonly notification: INotificationAllDrops;
  readonly activeDrop: ActiveDropState | null;
  readonly onReply: (param: DropInteractionParams) => void;
  readonly onQuote: (param: DropInteractionParams) => void;
  readonly onDropContentClick?: ((drop: ExtendedDrop) => void) | undefined;
}) {
  const { createReplyClickHandler, createQuoteClickHandler } =
    useWaveNavigation();
  const drop = notification.related_drops?.[0];

  if (!drop) {
    return null;
  }

  const isDirectMessage = getIsDirectMessage(drop.wave);

  const getContent = () => {
    if (typeof notification.additional_context.vote === "number") {
      const isReset = notification.additional_context.vote === 0;

      if (isReset) {
        return <span className="tw-text-iron-400">reset rating to 0</span>;
      }

      return (
        <>
          <span className="tw-text-iron-400">rated</span>
          <span
            className={`${getNotificationVoteColor(
              notification.additional_context.vote
            )} tw-pl-1 tw-font-medium`}
          >
            {notification.additional_context.vote > 0 && "+"}
            {numberWithCommas(notification.additional_context.vote)}
          </span>
        </>
      );
    }

    return <span className="tw-text-iron-400">posted</span>;
  };

  return (
    <div className="tw-w-full tw-flex tw-flex-col tw-space-y-2">
      <NotificationHeader
        author={notification.related_identity}
        actions={
          <NotificationsFollowBtn
            profile={notification.related_identity}
            size={UserFollowBtnSize.SMALL}
          />
        }
      >
        <span className="tw-text-sm tw-font-normal tw-text-iron-50">
          {getContent()}{" "}
          <NotificationTimestamp createdAt={notification.created_at} />
        </span>
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
