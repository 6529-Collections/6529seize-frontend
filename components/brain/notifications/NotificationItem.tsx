import { memo } from "react";

import type { DropInteractionParams } from "@/components/waves/drops/Drop";
import { ApiNotificationCause } from "@/generated/models/ApiNotificationCause";
import type { ExtendedDrop } from "@/helpers/waves/drop.helpers";
import type { ActiveDropState } from "@/types/dropInteractionTypes";
import type {
  INotificationGeneric,
  TypedNotification,
} from "@/types/feed.types";

import NotificationAllDrops from "./all-drops/NotificationAllDrops";
import NotificationDropQuoted from "./drop-quoted/NotificationDropQuoted";
import NotificationDropReacted from "./drop-reacted/NotificationDropReacted";
import NotificationDropReplied from "./drop-replied/NotificationDropReplied";
import NotificationGeneric from "./generic/NotificationGeneric";
import NotificationIdentityMentioned from "./identity-mentioned/NotificationIdentityMentioned";
import NotificationIdentityRating from "./identity-rating/NotificationIdentityRating";
import NotificationIdentitySubscribed from "./identity-subscribed/NotificationIdentitySubscribed";
import NotificationPriorityAlert from "./priority-alert/NotificationPriorityAlert";
import NotificationWaveCreated from "./wave-created/NotificationWaveCreated";

import type { JSX } from "react";

function NotificationItemComponent({
  notification,
  activeDrop,
  onReply,
  onDropContentClick,
}: {
  readonly notification: TypedNotification;
  readonly activeDrop: ActiveDropState | null;
  readonly onReply: (param: DropInteractionParams) => void;
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
            onDropContentClick={onDropContentClick}
          />
        );
      case ApiNotificationCause.DropReplied:
        return (
          <NotificationDropReplied
            notification={notification}
            activeDrop={activeDrop}
            onReply={onReply}
            onDropContentClick={onDropContentClick}
          />
        );
      case ApiNotificationCause.DropVoted:
      case ApiNotificationCause.DropReacted:
      case ApiNotificationCause.DropBoosted:
        return (
          <NotificationDropReacted
            notification={notification}
            activeDrop={activeDrop}
            onReply={onReply}
            onDropContentClick={onDropContentClick}
          />
        );
      case ApiNotificationCause.IdentityMentioned:
        return (
          <NotificationIdentityMentioned
            notification={notification}
            activeDrop={activeDrop}
            onReply={onReply}
            onDropContentClick={onDropContentClick}
          />
        );
      case ApiNotificationCause.IdentitySubscribed:
        return <NotificationIdentitySubscribed notification={notification} />;
      case ApiNotificationCause.IdentityRep:
      case ApiNotificationCause.IdentityNic:
        return <NotificationIdentityRating notification={notification} />;
      case ApiNotificationCause.WaveCreated:
        return <NotificationWaveCreated notification={notification} />;
      case ApiNotificationCause.AllDrops:
        return (
          <NotificationAllDrops
            notification={notification}
            activeDrop={activeDrop}
            onReply={onReply}
            onDropContentClick={onDropContentClick}
          />
        );
      case ApiNotificationCause.PriorityAlert:
        return (
          <NotificationPriorityAlert
            notification={notification}
            activeDrop={activeDrop}
            onReply={onReply}
            onDropContentClick={onDropContentClick}
          />
        );
      default:
        return (
          <NotificationGeneric
            notification={notification as unknown as INotificationGeneric}
          />
        );
    }
  };

  return (
    <div className="tw-flex">
      <div className="tw-relative lg:tw-hidden">
        <div className="tw-h-full tw-w-[1px] -tw-translate-x-8 tw-bg-iron-800"></div>
      </div>
      <div className="tw-w-full">{getComponent()}</div>
    </div>
  );
}

const NotificationItem = memo(NotificationItemComponent);

NotificationItem.displayName = "NotificationItem";

export default NotificationItem;
