import Link from "next/link";
import { INotificationIdentitySubscribed } from "../../../../types/feed.types";
import {
  getScaledImageUri,
  ImageScale,
} from "../../../../helpers/image.helpers";
import { getTimeAgoShort } from "../../../../helpers/Helpers";
import UserFollowBtn, {
  UserFollowBtnSize,
} from "../../../user/utils/UserFollowBtn";

export default function NotificationIdentitySubscribed({
  notification,
}: {
  readonly notification: INotificationIdentitySubscribed;
}) {
  return (
    <div className="tw-w-full tw-flex tw-items-start md:tw-items-center tw-gap-x-3 tw-flex-wrap">
      <div className="tw-h-7 tw-w-7 tw-flex-shrink-0">
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
      <div className="tw-flex tw-flex-1 tw-justify-between tw-gap-x-3 tw-gap-y-1">
        <div className="tw-flex tw-flex-col md:tw-flex-row md:tw-items-center tw-gap-x-1 tw-gap-y-1">
          <span className="tw-text-sm tw-font-normal tw-text-iron-400">
            <Link
              href={`/${notification.related_identity.handle}`}
              className="tw-no-underline tw-font-semibold">
              {notification.related_identity.handle}
            </Link>{" "}
            started following you
          </span>
          <span className="tw-size-[3px] tw-bg-iron-600 tw-rounded-full tw-flex-shrink-0 tw-hidden md:tw-block"></span>
          <span className="tw-text-sm tw-text-iron-500 tw-font-normal tw-whitespace-nowrap">
            {getTimeAgoShort(notification.created_at)}
          </span>
        </div>

        <UserFollowBtn
          handle={notification.related_identity.handle}
          size={UserFollowBtnSize.SMALL}
        />
      </div>
    </div>
  );
}
