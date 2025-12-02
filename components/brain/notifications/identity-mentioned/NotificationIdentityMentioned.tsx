"use client";

import Link from "next/link";
import {
  getScaledImageUri,
  ImageScale,
} from "@/helpers/image.helpers";
import { INotificationIdentityMentioned } from "@/types/feed.types";
import { getTimeAgoShort } from "@/helpers/Helpers";
import { ActiveDropState } from "@/types/dropInteractionTypes";
import Drop, {
  DropInteractionParams,
  DropLocation,
} from "@/components/waves/drops/Drop";
import { DropSize, ExtendedDrop } from "@/helpers/waves/drop.helpers";
import { useRouter } from "next/navigation";
import { ApiDrop } from "@/generated/models/ApiDrop";
import { UserFollowBtnSize } from "@/components/user/utils/UserFollowBtn";
import NotificationsFollowBtn from "../NotificationsFollowBtn";
import UserProfileTooltipWrapper from "@/components/utils/tooltip/UserProfileTooltipWrapper";
import useDeviceInfo from "@/hooks/useDeviceInfo";
import { getWaveRoute } from "@/helpers/navigation.helpers";

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
  const router = useRouter();
  const { isApp } = useDeviceInfo();
  const baseWave = notification.related_drops[0].wave as any;
  const baseIsDm = baseWave.chat?.scope?.group?.is_direct_message ?? false;

  const navigateToDropInWave = (
    waveId: string,
    serialNo: number,
    isDirectMessage: boolean
  ) => {
    router.push(
      getWaveRoute({
        waveId,
        serialNo,
        isDirectMessage,
        isApp,
      })
    );
  };

  const onReplyClick = (serialNo: number) => {
    navigateToDropInWave(baseWave.id, serialNo, baseIsDm);
  };

  const onQuoteClick = (quote: ApiDrop) => {
    const quoteWave = quote.wave as any;
    const quoteIsDm =
      quoteWave?.chat?.scope?.group?.is_direct_message ?? baseIsDm;
    navigateToDropInWave(quote.wave.id, quote.serial_no, quoteIsDm);
  };

  return (
    <div className="tw-w-full tw-flex tw-gap-x-3">
      <div className="tw-w-full tw-flex tw-flex-col tw-space-y-2">
        <div className="tw-flex tw-items-start tw-gap-x-3">
          <div className="tw-h-7 tw-w-7 tw-flex-shrink-0">
            {notification.related_drops[0].author.pfp ? (
              <img
                src={getScaledImageUri(
                  notification.related_drops[0].author.pfp,
                  ImageScale.W_AUTO_H_50
                )}
                alt="#"
                className="tw-flex-shrink-0 tw-object-contain tw-h-full tw-w-full tw-rounded-md tw-bg-iron-800 tw-ring-1 tw-ring-iron-700"
              />
            ) : (
              <div className="tw-flex-shrink-0 tw-object-contain tw-h-full tw-w-full tw-rounded-md tw-bg-iron-800 tw-ring-1 tw-ring-iron-700" />
            )}
          </div>
          <div className="tw-flex tw-flex-1 tw-flex-col tw-items-start min-[390px]:tw-flex-row min-[390px]:tw-justify-between min-[390px]:tw-items-center tw-gap-y-2 min-[390px]:tw-gap-x-2 tw-min-w-0">
            <div className="tw-flex tw-flex-wrap tw-items-center tw-gap-x-1">
              <UserProfileTooltipWrapper user={notification.related_drops[0].author.handle ?? ""}>
                <Link
                  href={`/${notification.related_drops[0].author.handle}`}
                  className="tw-no-underline tw-font-semibold tw-text-sm tw-text-iron-50">
                  {notification.related_drops[0].author.handle}
                </Link>
              </UserProfileTooltipWrapper>{" "}
              <span className="tw-text-iron-400 tw-font-normal tw-text-sm">
                mentioned you
              </span>{" "}
              <span className="tw-text-sm tw-text-iron-300 tw-font-normal tw-whitespace-nowrap">
                <span className="tw-font-bold tw-mr-1 tw-text-xs tw-text-iron-400">
                  &#8226;
                </span>{" "}
                {getTimeAgoShort(notification.created_at)}
              </span>
            </div>
            <div className="tw-flex-shrink-0">
              <NotificationsFollowBtn
                profile={notification.related_drops[0].author}
                size={UserFollowBtnSize.SMALL}
              />
            </div>
          </div>
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
