import Link from "next/link";
import { INotificationIdentitySubscribed } from "@/types/feed.types";
import {
  getScaledImageUri,
  ImageScale,
} from "@/helpers/image.helpers";
import { getTimeAgoShort } from "@/helpers/Helpers";
import { UserFollowBtnSize } from "@/components/user/utils/UserFollowBtn";
import NotificationsFollowBtn from "../NotificationsFollowBtn";
import UserProfileTooltipWrapper from "@/components/utils/tooltip/UserProfileTooltipWrapper";

export default function NotificationIdentitySubscribed({
  notification,
}: {
  readonly notification: INotificationIdentitySubscribed;
}) {
  return (
    <div className="tw-w-full tw-flex tw-items-start tw-gap-x-3">
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
      <div className="tw-flex tw-flex-1 tw-flex-col tw-items-start min-[390px]:tw-flex-row min-[390px]:tw-justify-between min-[390px]:tw-items-center tw-gap-y-2 min-[390px]:tw-gap-x-2 tw-min-w-0">
        <div className="tw-flex tw-flex-wrap tw-items-center tw-gap-x-1">
          <UserProfileTooltipWrapper user={notification.related_identity.handle ?? ""}>
            <Link
              href={`/${notification.related_identity.handle}`}
              className="tw-no-underline tw-font-semibold tw-text-sm tw-text-iron-50">
              {notification.related_identity.handle}
            </Link>
          </UserProfileTooltipWrapper>{" "}
          <span className="tw-text-iron-400 tw-font-normal tw-text-sm">
            started following you
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
            profile={notification.related_identity}
            size={UserFollowBtnSize.SMALL}
          />
        </div>
      </div>
    </div>
  );
}
