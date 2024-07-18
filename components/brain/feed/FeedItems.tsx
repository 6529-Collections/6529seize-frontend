import { TypedFeedItem } from "../../../types/feed.types";

export interface FeedItemsProps {
  readonly items: TypedFeedItem[];
  readonly showWaveInfo: boolean;
  readonly availableCredit: number | null;
}

export default function FeedItems({
  items,
  showWaveInfo,
  availableCredit,
}: FeedItemsProps) {
  return <div className="tw-flex tw-flex-col tw-gap-y-4">items</div>;
}
