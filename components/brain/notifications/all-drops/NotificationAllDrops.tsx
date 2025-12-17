"use client";

import { UserFollowBtnSize } from "@/components/user/utils/UserFollowBtn";
import Drop, {
  DropInteractionParams,
  DropLocation,
} from "@/components/waves/drops/Drop";
import { ApiDrop } from "@/generated/models/ApiDrop";
import { getTimeAgoShort, numberWithCommas } from "@/helpers/Helpers";
import { getWaveRoute } from "@/helpers/navigation.helpers";
import { DropSize, ExtendedDrop } from "@/helpers/waves/drop.helpers";
import useDeviceInfo from "@/hooks/useDeviceInfo";
import { ActiveDropState } from "@/types/dropInteractionTypes";
import { INotificationAllDrops } from "@/types/feed.types";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { getNotificationVoteColor } from "../drop-reacted/NotificationDropReacted";
import NotificationsFollowBtn from "../NotificationsFollowBtn";
import NotificationHeader from "../subcomponents/NotificationHeader";

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
  const router = useRouter();
  const { isApp } = useDeviceInfo();
  const baseWave = notification.related_drops[0].wave as any;
  const isDirectMessage =
    baseWave?.chat?.scope?.group?.is_direct_message ?? false;

  const onReplyClick = (serialNo: number) => {
    router.push(
      getWaveRoute({
        waveId: notification.related_drops[0].wave.id,
        serialNo,
        isDirectMessage,
        isApp,
      })
    );
  };

  const onQuoteClick = (quote: ApiDrop) => {
    const quoteWave = quote.wave as any;
    const quoteIsDm =
      quoteWave?.chat?.scope?.group?.is_direct_message ?? isDirectMessage;

    router.push(
      getWaveRoute({
        waveId: quote.wave.id,
        serialNo: quote.serial_no,
        isDirectMessage: quoteIsDm,
        isApp,
      })
    );
  };

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
          href={`/${notification.related_drops[0].author.handle}`}
          className="tw-no-underline tw-font-semibold">
          {notification.related_drops[0].author.handle}
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
          <span className="tw-text-sm tw-text-iron-300 tw-font-normal tw-whitespace-nowrap">
            <span className="tw-font-bold tw-mr-1 tw-text-xs tw-text-iron-400">
              &#8226;
            </span>{" "}
            {getTimeAgoShort(notification.created_at)}
          </span>
        </span>
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
