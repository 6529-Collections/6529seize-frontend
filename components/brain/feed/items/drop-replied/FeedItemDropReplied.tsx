import DropsListItem from "../../../../drops/view/item/DropsListItem";
import { IFeedItemDropReplied } from "../../../../../types/feed.types";

export default function FeedItemDropReplied({
  item,
  showWaveInfo,
  availableCredit,
}: {
  readonly item: IFeedItemDropReplied;
  readonly showWaveInfo: boolean;
  readonly availableCredit: number | null;
}) {
  return (
    <DropsListItem
      drop={item.item.drop}
      replyToDrop={item.item.reply}
      showWaveInfo={showWaveInfo}
      availableCredit={availableCredit}
    />
  );
}
