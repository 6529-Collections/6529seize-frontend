"use client";

import {
  getScaledImageUri,
  ImageScale,
} from "@/helpers/image.helpers";
import { getTimeAgoShort, numberWithCommas } from "@/helpers/Helpers";
import Link from "next/link";
import Drop, {
  DropInteractionParams,
  DropLocation,
} from "@/components/waves/drops/Drop";
import { ActiveDropState } from "@/types/dropInteractionTypes";
import { useRouter } from "next/navigation";
import { ApiDrop } from "@/generated/models/ApiDrop";
import { DropSize, ExtendedDrop } from "@/helpers/waves/drop.helpers";
import NotificationsFollowBtn from "../NotificationsFollowBtn";
import { UserFollowBtnSize } from "@/components/user/utils/UserFollowBtn";
import { useEmoji } from "@/contexts/EmojiContext";
import type {
  INotificationDropVoted,
  INotificationDropReacted,
} from "@/types/feed.types";
import UserProfileTooltipWrapper from "@/components/utils/tooltip/UserProfileTooltipWrapper";

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
  const router = useRouter();
  const { emojiMap, findNativeEmoji } = useEmoji();

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
        <UserProfileTooltipWrapper user={notification.related_identity.handle ?? ""}>
          <Link
            href={`/${notification.related_identity.handle}`}
            className="tw-no-underline tw-font-semibold tw-text-sm tw-text-iron-50">
            {notification.related_identity.handle}
          </Link>
        </UserProfileTooltipWrapper>
        <span className="tw-text-iron-400 tw-font-normal tw-text-sm">
          rated
        </span>
        <span
          className={`${getNotificationVoteColor(
            voteValue
          )} tw-pl-1 tw-font-medium tw-text-sm`}>
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

    const custom = emojiMap
      .flatMap((cat) => cat.emojis)
      .find((e) => e.id === rawId);
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
        <UserProfileTooltipWrapper user={notification.related_identity.handle ?? ""}>
          <Link
            href={`/${notification.related_identity.handle}`}
            className="tw-no-underline tw-font-semibold tw-text-sm tw-text-iron-50">
            {notification.related_identity.handle}
          </Link>
        </UserProfileTooltipWrapper>
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

  const onReplyClick = (serialNo: number) => {
    router.push(
      `/my-stream?wave=${notification.related_drops[0].wave.id}&serialNo=${serialNo}/`
    );
  };
  const onQuoteClick = (quote: ApiDrop) => {
    router.push(
      `/my-stream?wave=${quote.wave.id}&serialNo=${quote.serial_no}/`
    );
  };

  return (
    <div className="tw-flex tw-gap-x-3 tw-w-full">
      <div className="tw-space-y-2 tw-w-full">
        <div className="tw-flex tw-justify-between tw-gap-x-4 tw-gap-y-1">
          <div className="tw-flex-1 tw-flex tw-gap-x-2 tw-items-center">
            <div className="tw-h-7 tw-w-7">
              {notification.related_identity.pfp ? (
                <img
                  src={getScaledImageUri(
                    notification.related_identity.pfp,
                    ImageScale.W_AUTO_H_50
                  )}
                  alt={notification.related_identity.handle ?? ""}
                  className="tw-flex-shrink-0 tw-object-contain tw-h-full tw-w-full tw-rounded-md tw-bg-iron-800 tw-ring-1 tw-ring-iron-700"
                />
              ) : (
                <div className="tw-flex-shrink-0 tw-object-contain tw-h-full tw-w-full tw-rounded-md tw-bg-iron-800 tw-ring-1 tw-ring-iron-700" />
              )}
            </div>
            <span className="tw-inline-flex tw-flex-wrap tw-gap-x-1 tw-items-center">
              {actionElement}
            </span>
          </div>

          <NotificationsFollowBtn
            profile={notification.related_identity}
            size={UserFollowBtnSize.SMALL}
          />
        </div>

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
    </div>
  );
}
