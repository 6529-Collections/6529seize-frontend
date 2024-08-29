import { NotificationCause } from "../../../generated/models/NotificationCause";
import { assertUnreachable } from "../../../helpers/AllowlistToolHelpers";
import { TypedNotification } from "../../../types/feed.types";
import NotificationDropQuoted from "./drop-quoted/NotificationDropQuoted";
import NotificationDropReplied from "./drop-replied/NotificationDropReplied";
import NotificationDropVoted from "./drop-voted/NotificationDropVoted";
import NotificationIdentityMentioned from "./identity-mentioned/NotificationIdentityMentioned";
import NotificationIdentitySubscribed from "./identity-subscribed/NotificationIdentitySubscribed";

export default function NotificationItem({
  notification,
}: {
  readonly notification: TypedNotification;
}) {
  const getComponent = (): JSX.Element => {
    switch (notification.cause) {
      case NotificationCause.DropQuoted:
        return <NotificationDropQuoted notification={notification} />;
      case NotificationCause.DropReplied:
        return <NotificationDropReplied notification={notification} />;
      case NotificationCause.DropVoted:
        return <NotificationDropVoted notification={notification} />;
      case NotificationCause.IdentityMentioned:
        return <NotificationIdentityMentioned notification={notification} />;
      case NotificationCause.IdentitySubscribed:
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
      <div className="tw-w-full tw-mb-2">{getComponent()}</div>
    </div>
  );
}
