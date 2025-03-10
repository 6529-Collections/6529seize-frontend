import {
  getScaledImageUri,
  ImageScale,
} from "../../../../helpers/image.helpers";
import { INotificationDropVoted } from "../../../../types/feed.types";
import RateClapOutlineIcon from "../../../utils/icons/RateClapOutlineIcon";
import { getTimeAgoShort, numberWithCommas } from "../../../../helpers/Helpers";
import Link from "next/link";
import Drop, {
  DropInteractionParams,
  DropLocation,
} from "../../../waves/drops/Drop";
import { ActiveDropState } from "../../../../types/dropInteractionTypes";
import { useRouter } from "next/router";
import { ApiDrop } from "../../../../generated/models/ApiDrop";
import { ExtendedDrop } from "../../../../helpers/waves/drop.helpers";

export const getNotificationVoteColor = (vote: number) => {
  if (vote > 0) {
    return "tw-text-green";
  }
  if (vote < 0) {
    return "tw-text-red";
  }
  return "tw-text-iron-500";
};

export default function NotificationDropVoted({
  notification,
  activeDrop,
  onReply,
  onQuote,
  onDropContentClick,
}: {
  readonly notification: INotificationDropVoted;
  readonly activeDrop: ActiveDropState | null;
  readonly onReply: (param: DropInteractionParams) => void;
  readonly onQuote: (param: DropInteractionParams) => void;
  readonly onDropContentClick?: (drop: ExtendedDrop) => void;
}) {
  const router = useRouter();
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
        <div className="tw-inline-flex tw-items-center">
          <div className="sm:tw-hidden tw-mr-2 tw-size-6 md:tw-absolute md:-tw-left-12 tw-flex-shrink-0 md:tw-size-8 tw-rounded-full tw-bg-iron-800 tw-flex tw-items-center tw-justify-center">
            <div className="tw-size-4 md:tw-size-[1.15rem] md:-tw-mt-2.5 tw-text-iron-300 tw-flex tw-items-center tw-justify-center">
              <RateClapOutlineIcon />
            </div>
          </div>
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
              rated
              <span
                className={`${getNotificationVoteColor(
                  notification.additional_context.vote
                )} tw-pl-1 tw-font-medium`}>
                {notification.additional_context.vote > 0 && "+"}
                {numberWithCommas(notification.additional_context.vote)}
              </span>{" "}
              <span className="tw-text-sm tw-text-iron-500 tw-font-normal tw-whitespace-nowrap">
                <span className="tw-font-bold tw-mx-0.5">&#8226;</span>{" "}
                {getTimeAgoShort(notification.created_at)}
              </span>
            </span>
          </div>
        </div>

        <Drop
          drop={{
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
