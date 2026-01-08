import type { DropInteractionParams } from "@/components/waves/drops/Drop";
import { ApiNotificationCause } from "@/generated/models/ApiNotificationCause";
import { assertUnreachable } from "@/helpers/AllowlistToolHelpers";
import type { ExtendedDrop } from "@/helpers/waves/drop.helpers";
import type { ActiveDropState } from "@/types/dropInteractionTypes";
import type { TypedNotification } from "@/types/feed.types";
import { memo } from "react";
import NotificationAllDrops from "./all-drops/NotificationAllDrops";
import NotificationDropQuoted from "./drop-quoted/NotificationDropQuoted";
import NotificationDropReplied from "./drop-replied/NotificationDropReplied";
import NotificationIdentityMentioned from "./identity-mentioned/NotificationIdentityMentioned";
import NotificationIdentitySubscribed from "./identity-subscribed/NotificationIdentitySubscribed";
import NotificationPriorityAlert from "./priority-alert/NotificationPriorityAlert";
import NotificationWaveCreated from "./wave-created/NotificationWaveCreated";

import type { JSX } from "react";
import NotificationDropReacted from "./drop-reacted/NotificationDropReacted";

function NotificationItemComponent({
  notification,
  activeDrop,
  onReply,
  onQuote,
  onDropContentClick,
}: {
  readonly notification: TypedNotification;
  readonly activeDrop: ActiveDropState | null;
  readonly onReply: (param: DropInteractionParams) => void;
  readonly onQuote: (param: DropInteractionParams) => void;
  readonly onDropContentClick?: ((drop: ExtendedDrop) => void) | undefined;
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
            onDropContentClick={onDropContentClick}
          />
        );
      case ApiNotificationCause.DropReplied:
        return (
          <NotificationDropReplied
            notification={notification}
            activeDrop={activeDrop}
            onReply={onReply}
            onQuote={onQuote}
            onDropContentClick={onDropContentClick}
          />
        );
      case ApiNotificationCause.DropVoted:
      case ApiNotificationCause.DropReacted:
        return (
          <NotificationDropReacted
            notification={notification}
            activeDrop={activeDrop}
            onReply={onReply}
            onQuote={onQuote}
            onDropContentClick={onDropContentClick}
          />
        );
      case ApiNotificationCause.IdentityMentioned:
        return (
          <NotificationIdentityMentioned
            notification={notification}
            activeDrop={activeDrop}
            onReply={onReply}
            onQuote={onQuote}
            onDropContentClick={onDropContentClick}
          />
        );
      case ApiNotificationCause.IdentitySubscribed:
        return <NotificationIdentitySubscribed notification={notification} />;
      case ApiNotificationCause.WaveCreated:
        return <NotificationWaveCreated notification={notification} />;
      case ApiNotificationCause.AllDrops:
        return (
          <NotificationAllDrops
            notification={notification}
            activeDrop={activeDrop}
            onReply={onReply}
            onQuote={onQuote}
            onDropContentClick={onDropContentClick}
          />
        );
      case ApiNotificationCause.PriorityAlert:
        return (
          <NotificationPriorityAlert
            notification={notification}
            activeDrop={activeDrop}
            onReply={onReply}
            onQuote={onQuote}
            onDropContentClick={onDropContentClick}
          />
        );
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
      <div className="tw-w-full">{getComponent()}</div>
    </div>
  );
}

const NotificationItem = memo(NotificationItemComponent);

NotificationItem.displayName = "NotificationItem";

export default NotificationItem;
