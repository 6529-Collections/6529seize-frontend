"use client";

import Drop, {
  DropInteractionParams,
  DropLocation,
} from "@/components/waves/drops/Drop";
import { ApiDrop } from "@/generated/models/ApiDrop";
import { getTimeAgoShort } from "@/helpers/Helpers";
import { getScaledImageUri, ImageScale } from "@/helpers/image.helpers";
import { getWaveRoute } from "@/helpers/navigation.helpers";
import { DropSize, ExtendedDrop } from "@/helpers/waves/drop.helpers";
import useDeviceInfo from "@/hooks/useDeviceInfo";
import { ActiveDropState } from "@/types/dropInteractionTypes";
import { INotificationPriorityAlert } from "@/types/feed.types";
import Link from "next/link";
import { useRouter } from "next/navigation";

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
  const router = useRouter();
  const { isApp } = useDeviceInfo();

  const headerSection = (
    <div className="tw-flex tw-gap-x-2 tw-items-center">
      <div className="tw-h-7 tw-w-7">
        {notification.related_identity.pfp ? (
          <img
            src={getScaledImageUri(
              notification.related_identity.pfp,
              ImageScale.W_AUTO_H_50
            )}
            alt="#"
            className="tw-flex-shrink-0 tw-object-contain tw-h-full tw-w-full tw-rounded-md tw-bg-iron-800 tw-ring-1 tw-ring-iron-700"
          />
        ) : (
          <div className="tw-flex-shrink-0 tw-object-contain tw-h-full tw-w-full tw-rounded-md tw-bg-iron-800 tw-ring-1 tw-ring-iron-700" />
        )}
      </div>
      <span className="tw-text-sm tw-font-normal tw-text-iron-50">
        <Link
          href={`/${notification.related_identity.handle}`}
          className="tw-no-underline tw-font-semibold">
          {notification.related_identity.handle}
        </Link>{" "}
        <span className="tw-text-iron-400">sent a priority alert 🚨</span>{" "}
        <span className="tw-text-sm tw-text-iron-300 tw-font-normal tw-whitespace-nowrap">
          <span className="tw-font-bold tw-mr-1 tw-text-xs tw-text-iron-400">
            &#8226;
          </span>{" "}
          {getTimeAgoShort(notification.created_at)}
        </span>
      </span>
    </div>
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

  const baseWave = notification.related_drops[0]?.wave as any;
  const isDirectMessage =
    baseWave?.chat?.scope?.group?.is_direct_message ?? false;

  const onReplyClick = (serialNo: number) => {
    const firstDrop = notification.related_drops[0];
    if (!firstDrop?.wave?.id) return;
    router.push(
      getWaveRoute({
        waveId: firstDrop.wave.id,
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

  return (
    <div className="tw-w-full tw-flex tw-gap-x-3">
      <div className="tw-w-full tw-flex tw-flex-col tw-space-y-2">
        {headerSection}

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
