import { TypedNotification } from "../../../types/feed.types";
import NotificationItem from "./NotificationItem";

export interface NotificationItemsProps {
  readonly items: TypedNotification[];
}

export default function NotificationItems({ items }: NotificationItemsProps) {
  return (
    <div className="tw-flex tw-flex-col lg:tw-w-[672px]">
      {items.map((item) => (
        <NotificationItem key={item.id} notification={item} />
      ))}
    </div>
  );
}
