import { ApiFeedItemType } from "../../../generated/models/ApiFeedItemType";
import { assertUnreachable } from "../../../helpers/AllowlistToolHelpers";
import { TypedFeedItem } from "../../../types/feed.types";
import FeedItemDropReplied from "./items/drop-replied/FeedItemDropReplied";
import FeedItemDropCreated from "./items/drop-created/FeedItemDropCreated";
import FeedItemWaveCreated from "./items/wave-created/FeedItemWaveCreated";
import { ActiveDropState } from "../../waves/detailed/chat/WaveChat";
import { ExtendedDrop } from "../../../helpers/waves/drop.helpers";
import { DropInteractionParams } from "../../waves/detailed/drops/Drop";

export interface FeedItemProps {
  readonly item: TypedFeedItem;
  readonly showWaveInfo: boolean;
  readonly activeDrop: ActiveDropState | null;
  readonly onReply: (param: DropInteractionParams) => void;
  readonly onQuote: (param: DropInteractionParams) => void;
  readonly onDropClick: (drop: ExtendedDrop) => void;
}

export default function FeedItem({
  item,
  showWaveInfo,
  activeDrop,
  onReply,
  onQuote,
  onDropClick,
}: FeedItemProps) {
  const getComponent = (): JSX.Element => {
    switch (item.type) {
      case ApiFeedItemType.WaveCreated:
        return (
          <FeedItemWaveCreated
            item={item}
            showWaveInfo={showWaveInfo}
            activeDrop={activeDrop}
            onReply={onReply}
            onQuote={onQuote}
            onDropClick={onDropClick}
          />
        );
      case ApiFeedItemType.DropCreated:
        return (
          <FeedItemDropCreated
            item={item}
            showWaveInfo={showWaveInfo}
            activeDrop={activeDrop}
            onReply={onReply}
            onQuote={onQuote}
            onDropClick={onDropClick}
          />
        );
      case ApiFeedItemType.DropReplied:
        return (
          <FeedItemDropReplied
            item={item}
            showWaveInfo={showWaveInfo}
            activeDrop={activeDrop}
            onReply={onReply}
            onQuote={onQuote}
            onDropClick={onDropClick}
          />
        );
      default:
        assertUnreachable(item);
        return <div />;
    }
  };

  return (
    <div className="tw-flex">
      <div className="tw-relative tw-hidden">
        <div className="tw-h-full tw-w-[1px] tw-bg-iron-800 -tw-translate-x-8"></div>
      </div>
      <div className="tw-w-full tw-mb-2">{getComponent()}</div>
    </div>
  );
}
