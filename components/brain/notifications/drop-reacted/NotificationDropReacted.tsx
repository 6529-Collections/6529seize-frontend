"use client";

import { UserFollowBtnSize } from "@/components/user/utils/UserFollowBtn";
import type { DropInteractionParams } from "@/components/waves/drops/Drop";
import { useEmoji } from "@/contexts/EmojiContext";
import { ApiNotificationCause } from "@/generated/models/ApiNotificationCause";
import { numberWithCommas } from "@/helpers/Helpers";
import type { ExtendedDrop } from "@/helpers/waves/drop.helpers";
import type { ActiveDropState } from "@/types/dropInteractionTypes";
import type {
  INotificationDropBoosted,
  INotificationDropReacted,
  INotificationDropVoted,
} from "@/types/feed.types";
import ReactionEmojiPreview from "./ReactionEmojiPreview";
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

type NotificationUnion =
  | INotificationDropVoted
  | INotificationDropReacted
  | INotificationDropBoosted;

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

  const isVoted = notification.cause === ApiNotificationCause.DropVoted;
  const isReacted = notification.cause === ApiNotificationCause.DropReacted;
  const isBoosted = notification.cause === ApiNotificationCause.DropBoosted;

  let actionElement: React.ReactNode = null;

  if (isVoted) {
    const voteValue = notification.additional_context.vote;

    actionElement = (
      <>
        <span className="tw-text-sm tw-font-normal tw-text-iron-400">
          rated
        </span>
        <span
          className={`${getNotificationVoteColor(
            voteValue
          )} tw-text-sm tw-font-medium`}
        >
          {voteValue > 0 && "+"}
          {numberWithCommas(voteValue)}
        </span>
        <NotificationTimestamp createdAt={notification.created_at} />
      </>
    );
  } else if (isBoosted) {
    actionElement = (
      <>
        <span className="tw-text-sm tw-font-normal tw-text-iron-400">
          🔥 boosted 🔥
        </span>
        <NotificationTimestamp createdAt={notification.created_at} />
      </>
    );
  } else if (isReacted) {
    const rawId = notification.additional_context.reaction.replaceAll(":", "");
    if (!findCustomEmoji(rawId) && !findNativeEmoji(rawId)) {
      return null;
    }
    actionElement = (
      <>
        <span className="tw-text-sm tw-font-normal tw-text-iron-400">
          reacted
        </span>
        <ReactionEmojiPreview rawId={rawId} />
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
    <div className="tw-flex tw-w-full tw-flex-col tw-space-y-2">
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
