import { AnimatePresence } from "framer-motion";
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
    <div className="tw-space-y-4">
      <AnimatePresence>
        {filters.map((filter) => (
          <CommunityCurationFiltersSelectItemsItem
            key={filter.id}
            filter={filter}
            onEditClick={onEditClick}
          />
        ))}
      </AnimatePresence>
    </div>
  );
}
