import { INotificationDropQuoted } from "../../../../types/feed.types";
import DropsListItem from "../../../drops/view/item/DropsListItem";

export default function NotificationDropQuoted({
  notification,
}: {
  readonly notification: INotificationDropQuoted;
}) {
  return (
    <DropsListItem
      drop={notification.related_drops[0]}
      showWaveInfo={true}
      availableCredit={0}
    />
  );
}
