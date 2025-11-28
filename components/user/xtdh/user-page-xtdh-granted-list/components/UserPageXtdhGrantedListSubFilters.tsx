import CommonTabs from "@/components/utils/select/tabs/CommonTabs";
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
    <div className="tw-border-b tw-border-iron-800 tw-pb-4">
      <CommonTabs<GrantedActiveFilter>
        items={items}
        activeItem={activeSubFilter}
        setSelected={onSubFilterChange}
        filterLabel="Select filter"
      />
    </div>
  );
}
