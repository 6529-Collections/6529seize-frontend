"use client";

import { UserFollowBtnSize } from "@/components/user/utils/UserFollowBtn";
import { DropInteractionParams } from "@/components/waves/drops/Drop";
import { numberWithCommas } from "@/helpers/Helpers";
import { ExtendedDrop } from "@/helpers/waves/drop.helpers";
import { ActiveDropState } from "@/types/dropInteractionTypes";
import { INotificationAllDrops } from "@/types/feed.types";
import Link from "next/link";
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
  readonly onDropContentClick?: (drop: ExtendedDrop) => void;
}) {
  const { createReplyClickHandler, createQuoteClickHandler } =
    useWaveNavigation();
  const drop = notification.related_drops[0];
  const isDirectMessage = getIsDirectMessage(drop.wave);

  const getContent = () => {
    const userLink = (
      <Link
        href={`/${notification.related_identity.handle}`}
        className="tw-no-underline tw-font-semibold">
        {notification.related_identity.handle}
      </Link>
    );

    if (typeof notification.additional_context.vote === "number") {
      const isReset = notification.additional_context.vote === 0;

      const voteText = isReset ? (
        "reset rating to 0"
      ) : (
        <>
          rated{" "}
          <span
            className={`${getNotificationVoteColor(
              notification.additional_context.vote
            )} tw-pl-1 tw-font-medium`}>
            {notification.additional_context.vote > 0 && "+"}
            {numberWithCommas(notification.additional_context.vote)}
          </span>
        </>
      );

      return (
        <>
          {userLink} {voteText}
        </>
      );
    }

    return (
      <>
        <span className="tw-text-iron-400"> new post from </span>
        <Link
          href={`/${drop.author.handle}`}
          className="tw-no-underline tw-font-semibold">
          {drop.author.handle}
        </Link>
      </>
    );
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
        }>
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
