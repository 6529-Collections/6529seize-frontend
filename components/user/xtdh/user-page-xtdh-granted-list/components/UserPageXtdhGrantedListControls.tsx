import CommonDropdown from "@/components/utils/select/dropdown/CommonDropdown";
import CommonSelect from "@/components/utils/select/CommonSelect";
import type { CommonSelectItem } from "@/components/utils/select/CommonSelect";
import { SortDirection } from "@/entities/ISort";

import { SORT_ITEMS } from "../constants";
import type {
  GrantedFilterStatus,
  GrantedSortField,
} from "../types";

interface UserPageXtdhGrantedListControlsProps {
  readonly isVisible: boolean;
  readonly formattedStatusItems: CommonSelectItem<GrantedFilterStatus>[];
  readonly activeStatus: GrantedFilterStatus;
  readonly activeSortField: GrantedSortField;
  readonly activeSortDirection: SortDirection;
  readonly onStatusChange: (status: GrantedFilterStatus) => void;
  readonly onSortFieldChange: (sort: GrantedSortField) => void;
  readonly resultSummary: string | null;
  readonly isDisabled: boolean;
}

export function UserPageXtdhGrantedListControls({
  isVisible,
  formattedStatusItems,
  activeStatus,
  activeSortField,
  activeSortDirection,
  onStatusChange,
  onSortFieldChange,
  resultSummary,
  isDisabled,
}: UserPageXtdhGrantedListControlsProps) {
  if (!isVisible) {
    return null;
  }

  return (
    <div
      className="tw-flex tw-flex-col tw-gap-3 lg:tw-flex-row lg:tw-items-center lg:tw-justify-between"
      role="region"
      aria-label="Filter and sort controls">
      <div className="tw-flex tw-flex-col tw-gap-3 lg:tw-flex-row lg:tw-items-center lg:tw-gap-4">
        <div className="tw-w-full lg:tw-w-56">
          <CommonDropdown
            items={formattedStatusItems}
            activeItem={activeStatus}
            filterLabel="Filter by status"
            setSelected={onStatusChange}
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
      {resultSummary && (
        <div
          role="status"
          aria-live="polite"
          aria-atomic="true"
          className="tw-text-sm tw-text-iron-300">
          {resultSummary}
        </div>
      )}
    </div>
  );
}

