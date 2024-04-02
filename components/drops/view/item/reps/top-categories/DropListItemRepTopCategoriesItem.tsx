import { DropFullTopRepCategory } from "../../../../../../entities/IDrop";
import { formatNumberWithCommasOrDash } from "../../../../../../helpers/Helpers";

export default function DropListItemRepTopCategoriesItem({
  item,
}: {
  readonly item: DropFullTopRepCategory;
}) {
  const isPositive = item.rep_given >= 0;
  return (
    <div className="tw-px-2 tw-py-1 tw-flex tw-items-center tw-gap-x-1 tw-justify-center tw-rounded-full tw-ring-1 tw-ring-inset tw-ring-iron-700 tw-bg-iron-700 tw-text-iron-300 tw-font-normal tw-text-xxs">
      <span>{item.category}</span>
      <span
        className={`${
          isPositive ? "tw-text-green" : "tw-text-red"
        } tw-font-medium`}
      >
        {formatNumberWithCommasOrDash(item.rep_given)}
      </span>
    </div>
  );
}
