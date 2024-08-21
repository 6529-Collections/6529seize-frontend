import { IFeedItemDropCreated } from "../../../../../types/feed.types";
import DropsListItem from "../../../../drops/view/item/DropsListItem";

export default function FeedItemDropCreated({
  item,
  showWaveInfo,
  availableCredit,
}: {
  readonly item: IFeedItemDropCreated;
  readonly showWaveInfo: boolean;
  readonly availableCredit: number | null;
}) {
  return (
    <DropsListItem
      drop={item.item}
      replyToDrop={null}
      showWaveInfo={showWaveInfo}
      availableCredit={availableCredit}
    />
  );
}
