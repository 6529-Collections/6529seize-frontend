"use client";

import { getTimeAgoShort, numberWithCommas } from "@/helpers/Helpers";
import Drop, {
  DropInteractionParams,
  DropLocation,
} from "@/components/waves/drops/Drop";
import { ActiveDropState } from "@/types/dropInteractionTypes";
import { ApiDrop } from "@/generated/models/ApiDrop";
import { DropSize, ExtendedDrop } from "@/helpers/waves/drop.helpers";
import NotificationsFollowBtn from "../NotificationsFollowBtn";
import { UserFollowBtnSize } from "@/components/user/utils/UserFollowBtn";
import { useEmoji } from "@/contexts/EmojiContext";
import type {
  INotificationDropVoted,
  INotificationDropReacted,
} from "@/types/feed.types";
import NotificationHeader from "../subcomponents/NotificationHeader";
import { useWaveNavigation } from "../utils/navigationUtils";

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
  readonly onDropContentClick?: (drop: ExtendedDrop) => void;
}

export default function NotificationDropReacted({
  notification,
  activeDrop,
  onReply,
  onQuote,
  onDropContentClick,
}: Props) {
  const { navigateToWave } = useWaveNavigation();
  const { findCustomEmoji, findNativeEmoji } = useEmoji();

  // Determine if this notification is a "vote" or a "reaction"
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
    const timeAgo = getTimeAgoShort(notification.created_at);

    actionElement = (
      <>
        <span className="tw-text-iron-400 tw-font-normal tw-text-sm">
          rated
        </span>
        <span
          className={`${getNotificationVoteColor(
            voteValue
          )} tw-font-medium tw-text-sm`}>
          {voteValue > 0 && "+"}
          {numberWithCommas(voteValue)}
        </span>
        <span className="tw-text-sm tw-text-iron-300 tw-font-normal tw-whitespace-nowrap">
          <span className="tw-font-bold tw-mr-1 tw-text-xs tw-text-iron-400">
            &#8226;
          </span>
          {timeAgo}
        </span>
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
          src={custom.skins[0].src}
          alt={rawId}
          className="tw-max-w-5 tw-max-h-5 tw-object-contain"
        />
      );
    } else {
      const native = findNativeEmoji(rawId);
      if (native) {
        emojiNode = (
          <span className="tw-text-[1.2rem] tw-flex tw-items-center tw-justify-center">
            {native.skins[0].native}
          </span>
        );
      }
    }

    if (!emojiNode) {
      return null;
    }

    const timeAgo = getTimeAgoShort(notification.created_at);

    actionElement = (
      <>
        <span className="tw-text-iron-400 tw-font-normal tw-text-sm">
          reacted
        </span>
        {emojiNode}
        <span className="tw-text-sm tw-text-iron-300 tw-font-normal tw-whitespace-nowrap">
          <span className="tw-font-bold tw-mr-1 tw-text-xs tw-text-iron-400">
            &#8226;
          </span>
          {timeAgo}
        </span>
      </>
    );
  } else {
    return null;
  }

  const baseWave = notification.related_drops[0].wave as any;
  const baseIsDm = baseWave?.chat?.scope?.group?.is_direct_message ?? false;

  const onReplyClick = (serialNo: number) => {
    navigateToWave(baseWave.id, serialNo, baseIsDm);
  };

  const onQuoteClick = (quote: ApiDrop) => {
    const quoteWave = quote.wave as any;
    const isDirectMessage =
      quoteWave?.chat?.scope?.group?.is_direct_message ?? baseIsDm;
    navigateToWave(quote.wave.id, quote.serial_no, isDirectMessage);
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
        {actionElement}
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
