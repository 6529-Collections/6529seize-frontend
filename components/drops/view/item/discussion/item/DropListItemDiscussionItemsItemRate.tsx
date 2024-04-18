import { DropActivityLogRepEdit } from "../../../../../../entities/IDrop";
import { assertUnreachable } from "../../../../../../helpers/AllowlistToolHelpers";
import { formatNumberWithCommas } from "../../../../../../helpers/Helpers";

enum RateChangeType {
  ADDED = "ADDED",
  REMOVED = "REMOVED",
}

const RATE_CHANGE_TEXT: Record<RateChangeType, string> = {
  [RateChangeType.ADDED]: "Added",
  [RateChangeType.REMOVED]: "Reduced",
};

export default function DropListItemDiscussionItemsItemRate({
  item,
}: {
  readonly item: DropActivityLogRepEdit;
}) {
  const getRateChangeType = (): RateChangeType =>
    item.contents.new_rating < item.contents.old_rating
      ? RateChangeType.REMOVED
      : RateChangeType.ADDED;
  const action = getRateChangeType();
  const diff = Math.abs(item.contents.new_rating - item.contents.old_rating);
  const getDiffColor = () => {
    switch (action) {
      case RateChangeType.ADDED:
        return "tw-text-green";
      case RateChangeType.REMOVED:
        return "tw-text-red";
      default:
        assertUnreachable(action);
    }
  };

  const getTotalRatingClass = () => {
    if (item.contents.new_rating > 0) {
      return "tw-text-green";
    } else if (item.contents.new_rating < 0) {
      return "tw-text-red";
    }
    return "tw-text-iron-400";
  };
  const diffColor = getDiffColor();
  return (
    <div className="tw-space-x-1 tw-inline-flex tw-items-center">
      <span className="tw-whitespace-nowrap tw-text-sm tw-text-iron-400 tw-font-medium">
        {RATE_CHANGE_TEXT[action]}
      </span>
      <span className={`${diffColor} tw-text-sm tw-font-medium`}>
        {formatNumberWithCommas(diff)}
      </span>
      <span
        className={`${getTotalRatingClass()} tw-whitespace-nowrap tw-text-sm tw-font-medium`}
      >
        (total {formatNumberWithCommas(item.contents.new_rating)})
      </span>
      <span className="tw-whitespace-nowrap tw-text-sm tw-text-iron-400 tw-font-medium">
        Votes
      </span>
    </div>
  );
}
