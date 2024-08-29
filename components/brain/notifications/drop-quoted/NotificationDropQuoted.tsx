import { INotificationDropQuoted } from "../../../../types/feed.types";
import DropsListItem from "../../../drops/view/item/DropsListItem";

export default function NotificationDropQuoted({
  notification,
  availableCredit,
}: {
  readonly notification: INotificationDropQuoted;
  readonly availableCredit: number | null;
}) {
  return (
    <DropsListItem
      drop={notification.related_drops[0]}
      replyToDrop={null}
      showWaveInfo={true}
      availableCredit={availableCredit}
    />
  );
}
