import { CurationFilterResponse } from "../../../helpers/filters/Filters.types";
import CommunityCurationFiltersSelectItemsItem from "./item/CommunityCurationFiltersSelectItemsItem";

export default function CommunityCurationFiltersSelectItems({
  filters,
  onEditClick,
}: {
  readonly filters: CurationFilterResponse[];
  readonly onEditClick: (filter: CurationFilterResponse) => void;
}) {
  return (
    <div className="tw-space-y-3">
      {filters.map((filter) => (
        <CommunityCurationFiltersSelectItemsItem
          key={filter.id}
          filter={filter}
          onEditClick={onEditClick}
        />
      ))}
    </div>
  );
}
