import { INotificationIdentitySubscribed } from "@/types/feed.types";
import { getTimeAgoShort } from "@/helpers/Helpers";
import { UserFollowBtnSize } from "@/components/user/utils/UserFollowBtn";
import NotificationsFollowBtn from "../NotificationsFollowBtn";
import NotificationHeader from "../subcomponents/NotificationHeader";

export default function NotificationIdentitySubscribed({
  notification,
}: {
  readonly notification: INotificationIdentitySubscribed;
}) {
  return (
    <div className="tw-w-full">
      <NotificationHeader
        author={notification.related_identity}
        actions={
          <NotificationsFollowBtn
            profile={notification.related_identity}
            size={UserFollowBtnSize.SMALL}
          />
        }
      >
        <span className="tw-text-iron-400 tw-font-normal tw-text-sm">
          started following you
        </span>
        <span className="tw-text-sm tw-text-iron-300 tw-font-normal tw-whitespace-nowrap">
          <span className="tw-font-bold tw-mr-1 tw-text-xs tw-text-iron-400">
            &#8226;
          </span>
          {getTimeAgoShort(notification.created_at)}
        </span>
      </NotificationHeader>
    </div>
  );
}
