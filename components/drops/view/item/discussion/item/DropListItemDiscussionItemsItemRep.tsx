import { DropActivityLogRepEdit } from "../../../../../../entities/IDrop";
import { assertUnreachable } from "../../../../../../helpers/AllowlistToolHelpers";
import { formatNumberWithCommas } from "../../../../../../helpers/Helpers";

enum RepChangeType {
  ADDED = "ADDED",
  REMOVED = "REMOVED",
}

const REP_CHANGE_TEXT: Record<RepChangeType, string> = {
  [RepChangeType.ADDED]: "Added",
  [RepChangeType.REMOVED]: "Reduced",
};

export default function DropListItemDiscussionItemsItemRep({
  item,
}: {
  readonly item: DropActivityLogRepEdit;
}) {
  const getRepChangeType = (): RepChangeType =>
    item.contents.new_rating < item.contents.old_rating
      ? RepChangeType.REMOVED
      : RepChangeType.ADDED;
  const action = getRepChangeType();
  const diff = Math.abs(item.contents.new_rating - item.contents.old_rating);
  const getDiffColor = () => {
    switch (action) {
      case RepChangeType.ADDED:
        return "tw-text-green";
      case RepChangeType.REMOVED:
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
        {REP_CHANGE_TEXT[action]}
      </span>
      <span className={`${diffColor} tw-text-sm tw-font-medium`}>
        {formatNumberWithCommas(diff)}
      </span>
      <span
        className={`${getTotalRatingClass()} tw-whitespace-nowrap tw-text-sm tw-font-medium`}
      >
        (total {item.contents.new_rating})
      </span>
      <span className="tw-whitespace-nowrap tw-text-sm tw-text-iron-400 tw-font-medium">
        Rep
      </span>
    </div>
  );
}
