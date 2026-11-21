import { SortDirection } from "@/entities/ISort";
import { ApiCommunityMembersSortOption } from "@/generated/models/ApiCommunityMembersSortOption";
import CommonTableSortIcon from "@/components/user/utils/icons/CommonTableSortIcon";
import {
  DROPDOWN_CHECKMARK_CLASSES,
  getDropdownOptionStateClasses,
} from "@/components/utils/select/dropdown/dropdownTriggerStyles";

const SORT_OPTIONS: { value: ApiCommunityMembersSortOption; label: string }[] =
  [
    { value: ApiCommunityMembersSortOption.Level, label: "Level" },
    { value: ApiCommunityMembersSortOption.Tdh, label: "TDH" },
    { value: ApiCommunityMembersSortOption.Xtdh, label: "xTDH" },
    { value: ApiCommunityMembersSortOption.Rep, label: "REP" },
    { value: ApiCommunityMembersSortOption.Cic, label: "NIC" },
  ];

export default function CommunityMembersMobileSortContent({
  activeSort,
  sortDirection,
  onSort,
}: {
  readonly activeSort: ApiCommunityMembersSortOption;
  readonly sortDirection: SortDirection;
  readonly onSort: (sort: ApiCommunityMembersSortOption) => void;
}) {
  return (
    <div className="tw-px-4 tw-py-4">
      <div className="tw-flex tw-flex-col tw-gap-2">
        {SORT_OPTIONS.map((option) => {
          const isActive = activeSort === option.value;
          const arrowDirection = isActive ? sortDirection : SortDirection.DESC;
          return (
            <button
              key={option.value}
              type="button"
              onClick={() => onSort(option.value)}
              className={`tw-group tw-flex tw-w-full tw-items-center tw-justify-between tw-gap-x-1.5 tw-rounded-lg tw-border tw-border-solid tw-border-transparent tw-px-4 tw-py-3 tw-text-sm tw-font-medium tw-transition tw-duration-150 tw-ease-out focus-visible:tw-outline focus-visible:tw-outline-2 focus-visible:tw-outline-offset-2 focus-visible:tw-outline-primary-500 active:tw-scale-[0.99] ${getDropdownOptionStateClasses(isActive)}`}
            >
              <span>{option.label}</span>
              <CommonTableSortIcon
                direction={arrowDirection}
                isActive={isActive}
                activeClassName={DROPDOWN_CHECKMARK_CLASSES}
              />
            </button>
          );
        })}
      </div>
    </div>
  );
}
