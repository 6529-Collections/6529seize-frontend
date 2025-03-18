import Link from "next/link";
import {
  getScaledImageUri,
  ImageScale,
} from "../../../../helpers/image.helpers";
import { INotificationAllDrops } from "../../../../types/feed.types";
import { getTimeAgoShort, numberWithCommas } from "../../../../helpers/Helpers";
import { ActiveDropState } from "../../../../types/dropInteractionTypes";
import Drop, {
  DropInteractionParams,
  DropLocation,
} from "../../../waves/drops/Drop";
import { ExtendedDrop } from "../../../../helpers/waves/drop.helpers";
import { useRouter } from "next/router";
import { ApiDrop } from "../../../../generated/models/ApiDrop";
import { getNotificationVoteColor } from "../drop-voted/NotificationDropVoted";

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
        new post from{" "}
        <Link
          href={`/${notification.related_drops[0].author.handle}`}
          className="tw-no-underline tw-font-semibold">
          {notification.related_drops[0].author.handle}
        </Link>
      </>
    );
  };

  return (
    <div className="tw-w-full tw-flex tw-gap-x-3">
      <div className="tw-w-full tw-flex tw-flex-col tw-space-y-2">
        <div className="tw-inline-flex tw-items-center">
          <div className="sm:tw-hidden tw-mr-2 tw-size-6 md:tw-absolute md:-tw-left-12 tw-flex-shrink-0 md:tw-size-8 tw-rounded-full tw-bg-iron-800 tw-flex tw-items-center tw-justify-center">
            <svg
              className="tw-flex-shrink-0 tw-size-4 md:tw-size-5 tw-text-iron-300"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              aria-hidden="true"
              viewBox="0 0 24 24"
              strokeWidth="1.5"
              stroke="currentColor">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M20.25 8.511c.884.284 1.5 1.128 1.5 2.097v4.286c0 1.136-.847 2.1-1.98 2.193-.34.027-.68.052-1.02.072v3.091l-3-3c-1.354 0-2.694-.055-4.02-.163a2.115 2.115 0 0 1-.825-.242m9.345-8.334a2.126 2.126 0 0 0-.476-.095 48.64 48.64 0 0 0-8.048 0c-1.131.094-1.976 1.057-1.976 2.192v4.286c0 .837.46 1.58 1.155 1.951m9.345-8.334V6.637c0-1.621-1.152-3.026-2.76-3.235A48.455 48.455 0 0 0 11.25 3c-2.115 0-4.198.137-6.24.402-1.608.209-2.76 1.614-2.76 3.235v6.226c0 1.621 1.152 3.026 2.76 3.235.577.075 1.157.14 1.74.194V21l4.155-4.155"
              />
            </svg>
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
              {getContent()}{" "}
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
