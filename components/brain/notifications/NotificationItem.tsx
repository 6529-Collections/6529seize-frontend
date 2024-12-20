import { ApiNotificationCause } from "../../../generated/models/ApiNotificationCause";
import { assertUnreachable } from "../../../helpers/AllowlistToolHelpers";
import { ExtendedDrop } from "../../../helpers/waves/drop.helpers";
import { TypedNotification } from "../../../types/feed.types";
import { ActiveDropState } from "../../waves/detailed/chat/WaveChat";
import { DropInteractionParams } from "../../waves/detailed/drops/Drop";
import NotificationDropQuoted from "./drop-quoted/NotificationDropQuoted";
import NotificationDropReplied from "./drop-replied/NotificationDropReplied";
import NotificationDropVoted from "./drop-voted/NotificationDropVoted";
import NotificationIdentityMentioned from "./identity-mentioned/NotificationIdentityMentioned";
import NotificationIdentitySubscribed from "./identity-subscribed/NotificationIdentitySubscribed";

export default function NotificationItem({
  notification,
  activeDrop,
  onReply,
  onQuote,
  onDropClick,
}: {
  readonly notification: TypedNotification;
  readonly activeDrop: ActiveDropState | null;
  readonly onReply: (param: DropInteractionParams) => void;
  readonly onQuote: (param: DropInteractionParams) => void;
  readonly onDropClick: (drop: ExtendedDrop) => void;
}) {
  const getComponent = (): JSX.Element => {
    switch (notification.cause) {
      case ApiNotificationCause.DropQuoted:
        return (
          <NotificationDropQuoted
            notification={notification}
            activeDrop={activeDrop}
            onReply={onReply}
            onQuote={onQuote}
            onDropClick={onDropClick}
          />
        );
      case ApiNotificationCause.DropReplied:
        return (
          <NotificationDropReplied
            notification={notification}
            activeDrop={activeDrop}
            onReply={onReply}
            onQuote={onQuote}
            onDropClick={onDropClick}
          />
        );
      case ApiNotificationCause.DropVoted:
        return (
          <NotificationDropVoted
            notification={notification}
            activeDrop={activeDrop}
            onReply={onReply}
            onQuote={onQuote}
            onDropClick={onDropClick}
          />
        );
      case ApiNotificationCause.IdentityMentioned:
        return (
          <NotificationIdentityMentioned
            notification={notification}
            activeDrop={activeDrop}
            onReply={onReply}
            onQuote={onQuote}
            onDropClick={onDropClick}
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
      <div className="tw-relative lg:tw-hidden">
        <div className="tw-h-full tw-w-[1px] tw-bg-iron-800 -tw-translate-x-8"></div>
      </div>
      <div className="tw-w-full tw-my-2">{getComponent()}</div>
    </div>
  );
}
