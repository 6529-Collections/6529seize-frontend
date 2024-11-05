import {
  getScaledImageUri,
  ImageScale,
} from "../../../../helpers/image.helpers";
import { INotificationDropVoted } from "../../../../types/feed.types";
import RateClapOutlineIcon from "../../../utils/icons/RateClapOutlineIcon";
import { getTimeAgoShort, numberWithCommas } from "../../../../helpers/Helpers";
import Link from "next/link";
import DropsListItem from "../../../drops/view/item/DropsListItem";

export default function NotificationDropVoted({
  notification,
}: {
  readonly notification: INotificationDropVoted;
}) {
  const getVoteColor = (vote: number) => {
    if (vote > 0) {
      return "tw-text-green";
    }
    if (vote < 0) {
      return "tw-text-red";
    }
    return "tw-text-iron-500";
  };

  return (
    <div className="tw-flex tw-gap-x-3 tw-w-full">
      <div className="tw-space-y-2 tw-w-full">
        <div className="tw-inline-flex tw-items-center">
          <div className="tw-mr-2 tw-size-6 md:tw-absolute md:-tw-left-12 tw-flex-shrink-0 md:tw-size-8 tw-rounded-full tw-bg-iron-800 tw-flex tw-items-center tw-justify-center">
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
                className="tw-no-underline tw-font-semibold"
              >
                {notification.related_identity.handle}
              </Link>{" "}
              rated
              <span
                className={`${getVoteColor(
                  notification.additional_context.vote
                )} tw-pl-1 tw-font-medium`}
              >
                {notification.additional_context.vote > 0 && "+"}
                {numberWithCommas(notification.additional_context.vote)}
              </span>
            </span>
            <div className="tw-w-1 tw-h-1 tw-rounded-full tw-bg-iron-600"></div>
            <span className="tw-text-sm tw-text-iron-500 tw-font-normal">
              {getTimeAgoShort(notification.created_at)}
            </span>
          </div>
        </div>

        <DropsListItem
          drop={notification.related_drops[0]}
          replyToDrop={null}
          showWaveInfo={true}
        />
      </div>
    </div>
  );
}
