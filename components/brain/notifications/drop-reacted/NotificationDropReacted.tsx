import {
  getScaledImageUri,
  ImageScale,
} from "../../../../helpers/image.helpers";
import { INotificationDropReacted } from "../../../../types/feed.types";
import { getTimeAgoShort } from "../../../../helpers/Helpers";
import Link from "next/link";
import Drop, {
  DropInteractionParams,
  DropLocation,
} from "../../../waves/drops/Drop";
import { ActiveDropState } from "../../../../types/dropInteractionTypes";
import { useRouter } from "next/router";
import { ApiDrop } from "../../../../generated/models/ApiDrop";
import { DropSize, ExtendedDrop } from "../../../../helpers/waves/drop.helpers";
import NotificationsFollowBtn from "../NotificationsFollowBtn";
import { UserFollowBtnSize } from "../../../user/utils/UserFollowBtn";
import { useEmoji } from "../../../../contexts/EmojiContext";

export default function NotificationDropReacted({
  notification,
  activeDrop,
  onReply,
  onQuote,
  onDropContentClick,
}: {
  readonly notification: INotificationDropReacted;
  readonly activeDrop: ActiveDropState | null;
  readonly onReply: (param: DropInteractionParams) => void;
  readonly onQuote: (param: DropInteractionParams) => void;
  readonly onDropContentClick?: (drop: ExtendedDrop) => void;
}) {
  const router = useRouter();
  const { emojiMap, findNativeEmoji } = useEmoji();

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

  const emojiId = notification.additional_context.reaction.replaceAll(":", "");

  let emojiNode = null;
  const custom = emojiMap
    .flatMap((cat) => cat.emojis)
    .find((e) => e.id === emojiId);

  if (custom) {
    emojiNode = (
      <img
        src={custom.skins[0].src}
        alt={emojiId}
        className="tw-max-w-5 tw-max-h-5 tw-object-contain"
      />
    );
  } else {
    const native = findNativeEmoji(emojiId);
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
                  alt="#"
                  className="tw-flex-shrink-0 tw-object-contain tw-h-full tw-w-full tw-rounded-md tw-bg-iron-800 tw-ring-1 tw-ring-iron-700"
                />
              ) : (
                <div className="tw-flex-shrink-0 tw-object-contain tw-h-full tw-w-full tw-rounded-md tw-bg-iron-800 tw-ring-1 tw-ring-iron-700" />
              )}
            </div>
            <span className="tw-inline-flex tw-flex-wrap tw-gap-x-1 tw-items-center">
              <Link
                href={`/${notification.related_identity.handle}`}
                className="tw-no-underline tw-font-semibold tw-text-sm tw-text-iron-50">
                {notification.related_identity.handle}
              </Link>
              <span className="tw-text-iron-400 tw-font-normal tw-text-sm">
                reacted
              </span>
              {emojiNode}
              <span className="tw-text-sm tw-text-iron-300 tw-font-normal tw-whitespace-nowrap">
                <span className="tw-font-bold tw-mr-1 tw-text-xs tw-text-iron-400">
                  &#8226;
                </span>
                {getTimeAgoShort(notification.created_at)}
              </span>
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
