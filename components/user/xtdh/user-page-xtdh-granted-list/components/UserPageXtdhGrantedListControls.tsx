import CommonSelect from "@/components/utils/select/CommonSelect";
import type { CommonSelectItem } from "@/components/utils/select/CommonSelect";
import { SortDirection } from "@/entities/ISort";

import { SORT_ITEMS } from "../constants";
import type {
  GrantedFilterStatus,
  GrantedFilterStatuses,
  GrantedSortField,
} from "../types";
import { UserPageXtdhGrantedStatusDropdown } from "./UserPageXtdhGrantedStatusDropdown";

interface UserPageXtdhGrantedListControlsProps {
  readonly isVisible: boolean;
  readonly formattedStatusItems: CommonSelectItem<GrantedFilterStatus>[];
  readonly activeStatuses: GrantedFilterStatuses;
  readonly activeSortField: GrantedSortField;
  readonly activeSortDirection: SortDirection;
  readonly onStatusChange: (statuses: GrantedFilterStatuses) => void;
  readonly onSortFieldChange: (sort: GrantedSortField) => void;
  readonly isDisabled: boolean;
}

export function UserPageXtdhGrantedListControls({
  isVisible,
  formattedStatusItems,
  activeStatuses,
  activeSortField,
  activeSortDirection,
  onStatusChange,
  onSortFieldChange,
  isDisabled,
}: UserPageXtdhGrantedListControlsProps) {
  if (!isVisible) {
    return null;
  }

  return (
    <section
      className="tw-flex tw-flex-col tw-gap-3 lg:tw-flex-row lg:tw-items-center lg:tw-justify-between"
      aria-label="Filter and sort controls">
      <div className="tw-flex tw-flex-col tw-gap-3 lg:tw-flex-row lg:tw-items-center lg:tw-gap-4">
        <div className="tw-w-full lg:tw-w-56">
          <UserPageXtdhGrantedStatusDropdown
            items={formattedStatusItems}
            selectedStatuses={activeStatuses}
            onChange={onStatusChange}
            filterLabel="Filter by status"
            disabled={isDisabled}
          />
        </div>
        <div className="tw-w-full lg:tw-w-auto">
          <CommonSelect
            items={SORT_ITEMS}
            activeItem={activeSortField}
            filterLabel="Sort by"
            setSelected={onSortFieldChange}
            sortDirection={activeSortDirection}
            disabled={isDisabled}
          />
        </div>
      </div>
    </section>
  );
}
