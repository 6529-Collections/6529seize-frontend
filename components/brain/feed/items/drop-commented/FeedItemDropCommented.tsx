import { IFeedItemDropCommented } from "../../../../../types/feed.types";

export default function FeedItemDropCommented({
  item,
}: {
  readonly item: IFeedItemDropCommented;
}) {
  return (
    <div>
      Drop commented - {item.serial_no} 
    </div>
  );
}