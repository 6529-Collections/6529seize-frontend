import { ApiNotificationCause } from "../../../generated/models/ApiNotificationCause";
import { assertUnreachable } from "../../../helpers/AllowlistToolHelpers";
import { TypedNotification } from "../../../types/feed.types";
import NotificationDropQuoted from "./drop-quoted/NotificationDropQuoted";
import NotificationDropReplied from "./drop-replied/NotificationDropReplied";
import NotificationDropVoted from "./drop-voted/NotificationDropVoted";
import NotificationIdentityMentioned from "./identity-mentioned/NotificationIdentityMentioned";
import NotificationIdentitySubscribed from "./identity-subscribed/NotificationIdentitySubscribed";

export default function NotificationItem({
  notification,
  availableCredit,
}: {
  readonly notification: TypedNotification;
  readonly availableCredit: number | null;
}) {
  const getComponent = (): JSX.Element => {
    switch (notification.cause) {
      case ApiNotificationCause.DropQuoted:
        return (
          <NotificationDropQuoted
            notification={notification}
            availableCredit={availableCredit}
          />
        );
      case ApiNotificationCause.DropReplied:
        return (
          <NotificationDropReplied
            notification={notification}
            availableCredit={availableCredit}
          />
        );
      case ApiNotificationCause.DropVoted:
        return (
          <NotificationDropVoted
            notification={notification}
            availableCredit={availableCredit}
          />
        );
      case ApiNotificationCause.IdentityMentioned:
        return (
          <NotificationIdentityMentioned
            notification={notification}
            availableCredit={availableCredit}
          />
        );
      case ApiNotificationCause.IdentitySubscribed:
        return <NotificationIdentitySubscribed notification={notification} />;
      default:
        assertUnreachable(notification);
        return <div />;
    }
  };

  return (
    <div className="tw-flex">
      <div className="tw-relative">
        <div className="tw-h-full tw-w-[1px] tw-bg-iron-800 -tw-translate-x-8"></div>
      </div>
      <div className="tw-w-full tw-mb-4">{getComponent()}</div>
    </div>
  );
}
