import { IFeedItemDropCreated } from "../../../../../types/feed.types";
import DropsListItem from "../../../../drops/view/item/DropsListItem";

export default function FeedItemDropCreated({
  item,
  showWaveInfo,
}: {
  readonly item: IFeedItemDropCreated;
  readonly showWaveInfo: boolean;
}) {
  return (
    <DropsListItem
      drop={item.item}
      replyToDrop={null}
      showWaveInfo={showWaveInfo}
    />
  );
}
