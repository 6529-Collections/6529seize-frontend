import { useEffect, useState } from "react";
import { TypedNotification } from "../../../types/feed.types";
import NotificationItem from "./NotificationItem";
import CommonIntersectionElement from "../../utils/CommonIntersectionElement";

export interface NotificationItemsProps {
  readonly items: TypedNotification[];
  readonly availableCredit: number | null;
  readonly onBottomIntersection: (state: boolean) => void;
}

export default function NotificationItems({
  items,
  availableCredit,
  onBottomIntersection,
}: NotificationItemsProps) {
  const getIntersectionTargetIndex = () => {
    if (items.length < 5) {
      return null;
    }
    return items.length - 5;
  };

  const [intersectionTargetIndex, setIntersectionTargetIndex] = useState<
    number | null
  >(getIntersectionTargetIndex());

  useEffect(() => {
    setIntersectionTargetIndex(getIntersectionTargetIndex());
  }, [items]);
  return (
    <div className="tw-flex tw-flex-col lg:tw-w-[672px]">
      {items.map((item, i) => (
        <div key={item.id}>
          <NotificationItem key={item.id} notification={item} availableCredit={availableCredit}/>
          {!!intersectionTargetIndex && intersectionTargetIndex === i && (
            <CommonIntersectionElement onIntersection={onBottomIntersection} />
          )}
        </div>
      ))}
    </div>
  );
}
