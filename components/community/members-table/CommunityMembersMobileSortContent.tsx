import { SortDirection } from "@/entities/ISort";
import { ApiCommunityMembersSortOption } from "@/generated/models/ApiCommunityMembersSortOption";
import CommonTableSortIcon from "@/components/user/utils/icons/CommonTableSortIcon";

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
    <div className="tw-px-4 tw-py-2">
      <div className="tw-flex tw-flex-col tw-gap-2">
        {SORT_OPTIONS.map((option) => {
          const isActive = activeSort === option.value;
          const arrowDirection = isActive ? sortDirection : SortDirection.DESC;
          return (
            <button
              key={option.value}
              type="button"
              onClick={() => onSort(option.value)}
              className={`tw-flex tw-w-full tw-items-center tw-justify-between tw-gap-x-1.5 tw-rounded-lg tw-border tw-border-solid tw-px-4 tw-py-3 tw-text-sm tw-font-medium tw-transition ${
                isActive
                  ? "tw-border-primary-500 tw-bg-primary-500/20 tw-text-primary-300"
                  : "tw-border-iron-600 tw-bg-iron-800 tw-text-iron-300 active:tw-bg-iron-700"
              }`}
            >
              <span>{option.label}</span>
              <CommonTableSortIcon
                direction={arrowDirection}
                isActive={isActive}
                activeClassName="tw-text-primary-300"
              />
            </button>
          );
        })}
      </div>
    </div>
  );
}
