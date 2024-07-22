import { FeedItemType } from "../../../generated/models/FeedItemType";
import { assertUnreachable } from "../../../helpers/AllowlistToolHelpers";
import { TypedFeedItem } from "../../../types/feed.types";
import FeedItemDropCommented from "./items/drop-commented/FeedItemDropCommented";
import FeedItemDropCreated from "./items/drop-created/FeedItemDropCreated";
import FeedItemDropVoted from "./items/drop-voted/FeedItemDropVoted";
import FeedItemWaveCreated from "./items/wave-created/FeedItemWaveCreated";

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
  const getComponent = (): JSX.Element => {
    switch (item.type) {
      case FeedItemType.WaveCreated:
        return <FeedItemWaveCreated item={item} />;
      case FeedItemType.DropCreated:
        return (
          <FeedItemDropCreated
            item={item}
            availableCredit={availableCredit}
            showWaveInfo={showWaveInfo}
          />
        );
      case FeedItemType.DropCommented:
        return <FeedItemDropCommented item={item} />;
      case FeedItemType.DropVoted:
        return <FeedItemDropVoted item={item} />;
      default:
        assertUnreachable(item);
        return <div />;
    }
  };
  return getComponent();
}
