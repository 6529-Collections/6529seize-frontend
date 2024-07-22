import { IFeedItemDropVoted } from "../../../../../types/feed.types";

export default function FeedItemDropVoted({
  item,
}: {
  readonly item: IFeedItemDropVoted;
}) {
  return <div>Drop voted - {item.serial_no}</div>;
}
