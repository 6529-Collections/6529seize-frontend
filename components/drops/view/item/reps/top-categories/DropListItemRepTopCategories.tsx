import { DropFull } from "../../../../../../entities/IDrop";
import DropListItemRepTopCategoriesItem from "./DropListItemRepTopCategoriesItem";

export default function DropListItemRepTopCategories({
  drop,
}: {
  readonly drop: DropFull;
}) {
  return (
    <div className="tw-mt-2 tw-flex tw-items-center tw-gap-2">
      {drop.top_rep_categories.map((topRepCategory) => (
        <DropListItemRepTopCategoriesItem
          key={topRepCategory.category}
          item={topRepCategory}
        />
      ))}
    </div>
  );
}
