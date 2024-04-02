import { DropFullTopRepCategory } from "../../../../../../entities/IDrop";
import { formatNumberWithCommas } from "../../../../../../helpers/Helpers";

export default function DropListItemRepTopCategoriesItem({
  item,
  activeCategory,
  setActiveCategory,
}: {
  readonly item: DropFullTopRepCategory;
  readonly activeCategory: string;
  readonly setActiveCategory: (category: string) => void;
}) {
  const isPositive = item.rep_given >= 0;
  const isActiveCategory = activeCategory === item.category;
  return (
    <button
      onClick={() => setActiveCategory(item.category)}
      className={`${
        isActiveCategory ? "tw-ring-blue-500" : "tw-ring-iron-700"
      } tw-border-none tw-px-2 tw-py-1 tw-flex tw-items-center tw-gap-x-1 tw-justify-center tw-rounded-full tw-ring-1 tw-ring-inset tw-bg-iron-700 tw-text-iron-300 tw-font-normal tw-text-xxs tw-transition tw-duration-300 tw-ease-out`}
    >
      <span>{item.category}</span>
      <span
        className={`${
          isPositive ? "tw-text-green" : "tw-text-red"
        } tw-font-medium`}
      >
        {formatNumberWithCommas(item.rep_given)}
      </span>
    </button>
  );
}
