import { TypedFeedItem } from "../../../types/feed.types";

export interface FeedItemProps {
  readonly item: TypedFeedItem;
  readonly showWaveInfo: boolean;
  readonly availableCredit: number | null;
}

export default function FeedItem({
  item,
  showWaveInfo,
  availableCredit,
}: FeedItemProps) {
  return <div>{item.type}</div>;
}
