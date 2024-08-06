import { TypedNotification } from "../../../types/feed.types";
import NotificationItem from "./NotificationItem";

export interface NotificationItemsProps {
  readonly items: TypedNotification[];
}

export default function NotificationItems({ items }: NotificationItemsProps) {
  return (
    <div className="tw-w-full tw-flex tw-gap-x-3">
      <div className="tw-flex tw-flex-col tw-w-[672px]">
        {items.map((item) => (
          <NotificationItem key={item.id} notification={item} />
        ))}
      </div>
    </div>
  );
}
