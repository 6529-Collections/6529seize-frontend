import { ApiFeedItemType } from "../../../generated/models/ApiFeedItemType";
import { assertUnreachable } from "../../../helpers/AllowlistToolHelpers";
import { TypedFeedItem } from "../../../types/feed.types";
import FeedItemDropReplied from "./items/drop-replied/FeedItemDropReplied";
import FeedItemDropCreated from "./items/drop-created/FeedItemDropCreated";
import FeedItemWaveCreated from "./items/wave-created/FeedItemWaveCreated";

export interface FeedItemProps {
  readonly item: TypedFeedItem;
  readonly showWaveInfo: boolean;
}

export default function FeedItem({
  item,
  showWaveInfo,
}: FeedItemProps) {
  const getComponent = (): JSX.Element => {
    switch (item.type) {
      case ApiFeedItemType.WaveCreated:
        return (
          <FeedItemWaveCreated
            item={item}
            showWaveInfo={showWaveInfo}
          />
        );
      case ApiFeedItemType.DropCreated:
        return (
          <FeedItemDropCreated
            item={item}
            showWaveInfo={showWaveInfo}
          />
        );
      case ApiFeedItemType.DropReplied:
        return (
          <FeedItemDropReplied
            item={item}
            showWaveInfo={showWaveInfo}
          />
        );
      default:
        assertUnreachable(item);
        return <div />;
    }
  };

  return (
    <div className="tw-flex">
      <div className="tw-relative">
        <div className="tw-h-full tw-w-[1px] tw-bg-iron-800 -tw-translate-x-8"></div>
      </div>
      <div className="tw-w-full tw-mb-2">{getComponent()}</div>
    </div>
  );
}
