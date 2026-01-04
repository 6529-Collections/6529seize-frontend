"use client";

import { UserFollowBtnSize } from "@/components/user/utils/UserFollowBtn";
import type { DropInteractionParams } from "@/components/waves/drops/Drop";
import { useEmoji } from "@/contexts/EmojiContext";
import { numberWithCommas } from "@/helpers/Helpers";
import type { ExtendedDrop } from "@/helpers/waves/drop.helpers";
import type { ActiveDropState } from "@/types/dropInteractionTypes";
import type {
  INotificationDropReacted,
  INotificationDropVoted,
} from "@/types/feed.types";
import NotificationsFollowBtn from "../NotificationsFollowBtn";
import NotificationDrop from "../subcomponents/NotificationDrop";
import NotificationHeader from "../subcomponents/NotificationHeader";
import NotificationTimestamp from "../subcomponents/NotificationTimestamp";
import {
  getIsDirectMessage,
  useWaveNavigation,
} from "../utils/navigationUtils";

export const getNotificationVoteColor = (vote: number) => {
  if (vote > 0) return "tw-text-green";
  if (vote < 0) return "tw-text-red";
  return "tw-text-iron-500";
};

type NotificationUnion = INotificationDropVoted | INotificationDropReacted;

interface Props {
  readonly notification: NotificationUnion;
  readonly activeDrop: ActiveDropState | null;
  readonly onReply: (param: DropInteractionParams) => void;
  readonly onQuote: (param: DropInteractionParams) => void;
  readonly onDropContentClick?: ((drop: ExtendedDrop) => void) | undefined;
}

export default function NotificationDropReacted({
  notification,
  activeDrop,
  onReply,
  onQuote,
  onDropContentClick,
}: Props) {
  const { createReplyClickHandler, createQuoteClickHandler } =
    useWaveNavigation();
  const { findCustomEmoji, findNativeEmoji } = useEmoji();

  const isVoted =
    (notification as INotificationDropVoted).additional_context.vote !==
    undefined;
  const isReacted =
    (notification as INotificationDropReacted).additional_context.reaction !==
    undefined;

  let actionElement: React.ReactNode = null;

  if (isVoted) {
    const voteValue = (notification as INotificationDropVoted)
      .additional_context.vote;

    actionElement = (
      <>
        <span className="tw-text-iron-400 tw-font-normal tw-text-sm">
          rated
        </span>
        <span
          className={`${getNotificationVoteColor(
            voteValue
          )} tw-font-medium tw-text-sm`}
        >
          {voteValue > 0 && "+"}
          {numberWithCommas(voteValue)}
        </span>
        <NotificationTimestamp createdAt={notification.created_at} />
      </>
    );
  } else if (isReacted) {
    const rawId = (
      notification as INotificationDropReacted
    ).additional_context.reaction.replaceAll(":", "");
    let emojiNode: React.ReactNode = null;

    const custom = findCustomEmoji(rawId);
    if (custom) {
      emojiNode = (
        <img
          src={custom.skins[0]?.src}
          alt={rawId}
          className="tw-max-w-5 tw-max-h-5 tw-object-contain"
        />
      );
    } else {
      const native = findNativeEmoji(rawId);
      if (native) {
        emojiNode = (
          <span className="tw-text-[1.2rem] tw-flex tw-items-center tw-justify-center">
            {native.skins[0]?.native}
          </span>
        );
      }
    }

    if (!emojiNode) {
      return null;
    }

    actionElement = (
      <>
        <span className="tw-text-iron-400 tw-font-normal tw-text-sm">
          reacted
        </span>
        {emojiNode}
        <NotificationTimestamp createdAt={notification.created_at} />
      </>
    );
  } else {
    return null;
  }

  const drop = notification.related_drops[0];
  if (!drop) {
    return null;
  }
  const isDirectMessage = getIsDirectMessage(drop.wave);

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
        {actionElement}
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
