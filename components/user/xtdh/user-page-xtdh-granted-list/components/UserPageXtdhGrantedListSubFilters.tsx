import CommonDropdown from "@/components/utils/select/dropdown/CommonDropdown";
import { GRANTED_ACTIVE_FILTERS } from "../constants";
import type { GrantedActiveFilter } from "../types";

interface UserPageXtdhGrantedListSubFiltersProps {
  readonly activeSubFilter: GrantedActiveFilter;
  readonly onSubFilterChange: (filter: GrantedActiveFilter) => void;
}

export function UserPageXtdhGrantedListSubFilters({
  activeSubFilter,
  onSubFilterChange,
}: UserPageXtdhGrantedListSubFiltersProps) {
  const items: import("@/components/utils/select/CommonSelect").CommonSelectItem<GrantedActiveFilter>[] = GRANTED_ACTIVE_FILTERS.map((filter) => ({
    ...filter,
    label: filter.label,
  }));

  return (
    <CommonDropdown<GrantedActiveFilter>
      items={items}
      activeItem={activeSubFilter}
      setSelected={onSubFilterChange}
      filterLabel="Status"
      size="tabs"
    />
  );
}
