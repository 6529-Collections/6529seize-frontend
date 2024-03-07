import { IProfileAndConsolidations } from "../../entities/IProfile";
import FilterBuilder, { GeneralFilter } from "./FilterBuilder";
import FilterModalHeader from "./FilterModalHeader";

import FilterModalWrapper from "./FilterModalWrapper";

export default function FilterModal({
  profile,
  filters,
  onClose,
  onFilters,
}: {
  readonly profile: IProfileAndConsolidations;
  readonly filters: GeneralFilter;
  readonly onClose: () => void;
  readonly onFilters: (filters: GeneralFilter) => void;
}) {
  return (
    <FilterModalWrapper onClose={onClose}>
      <FilterModalHeader onClose={onClose} />
      <FilterBuilder
        profile={profile}
        filters={filters}
        onFilters={onFilters}
      />
    </FilterModalWrapper>
  );
}
