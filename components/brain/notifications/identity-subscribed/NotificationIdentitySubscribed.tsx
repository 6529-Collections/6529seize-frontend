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
    <div className="tw-w-full tw-inline-flex tw-justify-between gap-2">
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
          started following you{" "}
          <span className="tw-text-sm tw-text-iron-500 tw-font-normal tw-whitespace-nowrap">
            <span className="tw-font-bold tw-mx-0.5">&#8226;</span>{" "}
            {getTimeAgoShort(notification.created_at)}
          </span>
        </span>
      </div>
      <UserFollowBtn
        handle={notification.related_identity.handle}
        size={UserFollowBtnSize.SMALL}
      />
    </div>
  );
}
