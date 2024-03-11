import { useState } from "react";
import { CurationFilterResponse } from "../../../helpers/filters/Filters.types";
import CommonInput from "../../utils/input/CommonInput";
import CommunityCurationFiltersSearchFilterDropdown from "./CommunityCurationFiltersSearchFilterDropdown";

export default function CommunityCurationFiltersSearchFilter({
  filterName,
  filters,
  setFilterName,
}: {
  readonly filterName: string | null;
  readonly filters: CurationFilterResponse[];
  readonly setFilterName: (name: string | null) => void;
}) {
  const [isOpen, setIsOpen] = useState(false);
  return (
    <div>
      <CommonInput
        inputType="text"
        placeholder="Search filter"
        value={filterName ?? ""}
        onChange={setFilterName}
        onFocusChange={(newV) => setIsOpen(newV)}
      />
      <CommunityCurationFiltersSearchFilterDropdown
        open={isOpen}
        selected={filterName}
        filters={filters}
        onSelect={setFilterName}
      />
    </div>
  );
}
