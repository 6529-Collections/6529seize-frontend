import Link from "next/link";
import { INotificationIdentitySubscribed } from "../../../../types/feed.types";
import {
  getScaledImageUri,
  ImageScale,
} from "../../../../helpers/image.helpers";
import { getTimeAgoShort } from "../../../../helpers/Helpers";
import { UserFollowBtnSize } from "../../../user/utils/UserFollowBtn";
import NotificationsFollowBtn from "../NotificationsFollowBtn";
import UserProfileTooltipWrapper from "../../../utils/tooltip/UserProfileTooltipWrapper";

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
        <span className="tw-inline tw-flex-wrap tw-items-center">
          <span className="tw-text-sm tw-font-normal tw-text-iron-400">
            <UserProfileTooltipWrapper user={notification.related_identity.handle ?? ""}>
              <Link
                href={`/${notification.related_identity.handle}`}
                className="tw-no-underline tw-font-semibold">
                {notification.related_identity.handle}
              </Link>
            </UserProfileTooltipWrapper>{" "}
            started following you
          </span>{" "}
          <span className="tw-text-sm tw-text-iron-300 tw-font-normal tw-whitespace-nowrap">
            <span className="tw-font-bold tw-mr-1 tw-text-xs tw-text-iron-400">
              &#8226;
            </span>{" "}
            {getTimeAgoShort(notification.created_at)}
          </span>
        </span>

        <NotificationsFollowBtn
          profile={notification.related_identity}
          size={UserFollowBtnSize.SMALL}
        />
      </div>
    </div>
  );
}
