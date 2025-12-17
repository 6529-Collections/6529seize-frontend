import { INotificationIdentitySubscribed } from "@/types/feed.types";
import { UserFollowBtnSize } from "@/components/user/utils/UserFollowBtn";
import NotificationsFollowBtn from "../NotificationsFollowBtn";
import NotificationHeader from "../subcomponents/NotificationHeader";
import NotificationTimestamp from "../subcomponents/NotificationTimestamp";

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
        <NotificationTimestamp createdAt={notification.created_at} />
      </NotificationHeader>
    </div>
  );
}
