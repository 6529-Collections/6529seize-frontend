import { ApiFeedItemType } from "@/generated/models/ApiFeedItemType";
import { assertUnreachable } from "@/helpers/AllowlistToolHelpers";
import { TypedFeedItem } from "@/types/feed.types";
import FeedItemDropReplied from "./items/drop-replied/FeedItemDropReplied";
import FeedItemDropCreated from "./items/drop-created/FeedItemDropCreated";
import FeedItemWaveCreated from "./items/wave-created/FeedItemWaveCreated";
import { ActiveDropState } from "@/types/dropInteractionTypes";
import { ExtendedDrop } from "@/helpers/waves/drop.helpers";
import { DropInteractionParams } from "@/components/waves/drops/Drop";

import type { JSX } from "react";

interface FeedItemProps {
  readonly item: TypedFeedItem;
  readonly showWaveInfo: boolean;
  readonly activeDrop: ActiveDropState | null;
  readonly onReply: (param: DropInteractionParams) => void;
  readonly onQuote: (param: DropInteractionParams) => void;
  readonly onDropContentClick?: (drop: ExtendedDrop) => void;
}

export default function FeedItem({
  item,
  showWaveInfo,
  activeDrop,
  onReply,
  onQuote,
  onDropContentClick,
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
            onDropContentClick={onDropContentClick}
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
            onDropContentClick={onDropContentClick}
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
            onDropContentClick={onDropContentClick}
          />
        );
      default:
        assertUnreachable(item);
        return <div />;
    }
  };

  return (
    <div className="tw-flex">
      <div className="tw-w-full">{getComponent()}</div>
    </div>
  );
}
