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
              className={`tw-group tw-flex tw-w-full tw-items-center tw-justify-between tw-gap-x-1.5 tw-rounded-xl tw-border tw-border-solid tw-px-4 tw-py-3 tw-text-sm tw-font-medium tw-transition tw-duration-200 tw-ease-out focus-visible:tw-outline focus-visible:tw-outline-2 focus-visible:tw-outline-offset-2 focus-visible:tw-outline-primary-500 active:tw-scale-[0.99] ${
                isActive
                  ? "tw-border-primary-400/30 tw-bg-primary-500/10 tw-text-iron-50"
                  : "tw-border-iron-700 tw-bg-iron-900 tw-text-iron-100 desktop-hover:hover:tw-border-iron-600 desktop-hover:hover:tw-bg-iron-800 desktop-hover:hover:tw-text-iron-50"
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
