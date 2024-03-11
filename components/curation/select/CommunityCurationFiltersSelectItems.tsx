import { CurationFilterResponse } from "../../../helpers/filters/Filters.types";
import CommunityCurationFiltersSelectItemsItem from "./CommunityCurationFiltersSelectItemsItem";

export default function CommunityCurationFiltersSelectItems({
  filters,
}: {
  readonly filters: CurationFilterResponse[];
}) {
  return (
    <div>
      <ul>
        {filters.map((filter) => (
          <CommunityCurationFiltersSelectItemsItem
            key={filter.id}
            filter={filter}
          />
        ))}
      </ul>
    </div>
  );
}
