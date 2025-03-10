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
    <div className="tw-w-full tw-flex tw-items-start tw-gap-x-2 tw-flex-wrap">
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
      
      <div className="tw-flex tw-flex-1 tw-min-w-0 tw-items-center tw-flex-wrap tw-gap-x-2">
        <span className="tw-text-sm tw-font-normal tw-text-iron-50">
          <Link
            href={`/${notification.related_identity.handle}`}
            className="tw-no-underline tw-font-semibold">
            {notification.related_identity.handle}
          </Link>{" "}
          started following you
        </span>

        <div className="tw-w-1 tw-h-1 tw-rounded-full tw-bg-iron-600 tw-flex-shrink-0"></div>
        <span className="tw-text-sm tw-text-iron-500 tw-font-normal tw-whitespace-nowrap">
          {getTimeAgoShort(notification.created_at)}
        </span>
      </div>
      
      <UserFollowBtn
        handle={notification.related_identity.handle}
        size={UserFollowBtnSize.SMALL}
      />
    </div>
  );
}
