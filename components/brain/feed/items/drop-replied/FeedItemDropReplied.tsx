import DropsListItem from "../../../../drops/view/item/DropsListItem";
import { IFeedItemDropReplied } from "../../../../../types/feed.types";

export default function FeedItemDropReplied({
  item,
  showWaveInfo,
}: {
  readonly item: IFeedItemDropReplied;
  readonly showWaveInfo: boolean;
}) {
  return (
    <DropsListItem
      drop={item.item.reply}
      replyToDrop={item.item.drop}
      showWaveInfo={showWaveInfo}
    />
  );
}
