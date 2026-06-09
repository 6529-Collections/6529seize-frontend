"use client";

import { UserFollowBtnSize } from "@/components/user/utils/UserFollowBtn";
import type { DropInteractionParams } from "@/components/waves/drops/Drop";
import { useEmoji } from "@/contexts/EmojiContext";
import { ApiNotificationCause } from "@/generated/models/ApiNotificationCause";
import type { ExtendedDrop } from "@/helpers/waves/drop.helpers";
import type { ActiveDropState } from "@/types/dropInteractionTypes";
import {
  DROP_POLL_VOTED_NOTIFICATION_CAUSE,
  type INotificationDropBoosted,
  type INotificationDropPollVoted,
  type INotificationDropReacted,
  type INotificationDropVoted,
  type NotificationPollVoteOption,
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
import {
  formatSignedNotificationNumber,
  getNotificationRatingColor,
  isNotificationNumber,
} from "../utils/notificationRatingUtils";

export const getNotificationVoteColor = (vote: number) => {
  const color = getNotificationRatingColor(vote);
  return color === "tw-text-iron-400" ? "tw-text-iron-500" : color;
};

type NotificationUnion =
  | INotificationDropVoted
  | INotificationDropPollVoted
  | INotificationDropReacted
  | INotificationDropBoosted;

interface Props {
  readonly notification: NotificationUnion;
  readonly activeDrop: ActiveDropState | null;
  readonly onReply: (param: DropInteractionParams) => void;
  readonly onDropContentClick?: ((drop: ExtendedDrop) => void) | undefined;
}

function NotificationVoteInlinePart({
  label,
  value,
  separator = "bullet",
  textClassName = "tw-text-sm",
}: {
  readonly label: string;
  readonly value: number | null | undefined;
  readonly separator?: "bullet" | "arrow";
  readonly textClassName?: "tw-text-sm" | "tw-text-base";
}) {
  if (!isNotificationNumber(value)) {
    return null;
  }

  return (
    <span className="tw-inline-flex tw-items-center tw-gap-x-1 tw-whitespace-nowrap">
      <span
        className={
          separator === "arrow"
            ? `${textClassName} tw-font-bold tw-text-iron-400`
            : "tw-text-xs tw-font-bold tw-text-iron-400"
        }
      >
        {separator === "arrow" ? "\u2192" : "\u2022"}
      </span>
      <span className={`${textClassName} tw-font-normal tw-text-iron-400`}>
        {label}:
      </span>
      <span
        className={`${getNotificationVoteColor(
          value
        )} ${textClassName} tw-font-medium tw-tabular-nums`}
      >
        {formatSignedNotificationNumber(value)}
      </span>
    </span>
  );
}

function getPollOptionText(
  options: readonly NotificationPollVoteOption[]
): string | null {
  const optionText = options
    .map((option) => option.option_string.trim())
    .filter((option) => option.length > 0)
    .join(", ");

  return optionText.length > 0 ? optionText : null;
}

export default function NotificationDropReacted({
  notification,
  activeDrop,
  onReply,
  onDropContentClick,
}: Props) {
  const { createReplyClickHandler, createQuoteClickHandler } =
    useWaveNavigation();
  const { findCustomEmoji, findNativeEmoji } = useEmoji();

  const isVoted = notification.cause === ApiNotificationCause.DropVoted;
  const isPollVoted = notification.cause === DROP_POLL_VOTED_NOTIFICATION_CAUSE;
  const isReacted = notification.cause === ApiNotificationCause.DropReacted;
  const isBoosted = notification.cause === ApiNotificationCause.DropBoosted;
  const drop = notification.related_drops[0];
  if (!drop) {
    return null;
  }

  let actionElement: React.ReactNode = null;

  if (isVoted) {
    const voteTextClassName = "tw-text-base";
    const voteValue = notification.additional_context.vote;
    const voteChange = notification.additional_context.vote_change;
    const totalVote = notification.additional_context.total_vote;
    const hasVoteChange = isNotificationNumber(voteChange);
    const isInitialRating = !hasVoteChange || voteChange === voteValue;

    actionElement = (
      <>
        {isInitialRating ? (
          <>
            <span
              className={`${voteTextClassName} tw-font-normal tw-text-iron-400`}
            >
              rated
            </span>
            <span
              className={`${getNotificationVoteColor(
                voteValue
              )} ${voteTextClassName} tw-font-medium tw-tabular-nums`}
            >
              {formatSignedNotificationNumber(voteValue)}
            </span>
          </>
        ) : (
          <>
            <span
              className={`${voteTextClassName} tw-font-normal tw-text-iron-400`}
            >
              updated rating by
            </span>
            <span
              className={`${getNotificationVoteColor(
                voteChange
              )} ${voteTextClassName} tw-font-medium tw-tabular-nums`}
            >
              {formatSignedNotificationNumber(voteChange)}
            </span>
            <NotificationVoteInlinePart
              label="New rating"
              value={voteValue}
              separator="arrow"
              textClassName={voteTextClassName}
            />
          </>
        )}
        <NotificationVoteInlinePart
          label="New Total"
          value={totalVote}
          textClassName={voteTextClassName}
        />
        <NotificationTimestamp
          createdAt={notification.created_at}
          className={voteTextClassName}
        />
      </>
    );
  } else if (isPollVoted) {
    const pollOptionText = getPollOptionText(
      notification.additional_context.poll_options
    );

    actionElement = (
      <>
        {pollOptionText ? (
          <>
            <span className="tw-text-sm tw-font-normal tw-text-iron-400">
              voted for
            </span>
            <span className="tw-min-w-0 tw-max-w-full tw-break-words tw-text-sm tw-font-medium tw-text-iron-200">
              {pollOptionText}
            </span>
          </>
        ) : (
          <span className="tw-text-sm tw-font-normal tw-text-iron-400">
            voted in poll
          </span>
        )}
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

  const isDirectMessage = getIsDirectMessage(drop.wave);

  return (
    <div className="tw-flex tw-w-full tw-flex-col tw-space-y-2">
      <NotificationHeader
        author={notification.related_identity}
        authorClassName={isVoted ? "tw-text-base" : undefined}
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
        onReplyClick={createReplyClickHandler(drop.wave.id, isDirectMessage)}
        onQuoteClick={createQuoteClickHandler(isDirectMessage)}
        onDropContentClick={onDropContentClick}
      />
    </div>
  );
}
