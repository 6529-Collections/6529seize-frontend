import { SortDirection } from "../../../entities/ISort";
import { CommunityMembersSortOption } from "../../../enums";
import CommonTableSortIcon from "../../user/utils/icons/CommonTableSortIcon";

export default function CommunityMembersMobileFilterBar({
  activeSort,
  sortDirection,
  isLoading,
  onSort,
}: {
  readonly activeSort: CommunityMembersSortOption;
  readonly sortDirection: SortDirection;
  readonly isLoading: boolean;
  readonly onSort: (sort: CommunityMembersSortOption) => void;
}) {
  const OPTIONS: CommunityMembersSortOption[] = [
    CommunityMembersSortOption.LEVEL,
    CommunityMembersSortOption.TDH,
    CommunityMembersSortOption.REP,
    CommunityMembersSortOption.NIC,
  ];

  const TITLE: Record<CommunityMembersSortOption, string> = {
    [CommunityMembersSortOption.DISPLAY]: "Profile",
    [CommunityMembersSortOption.LEVEL]: "Level",
    [CommunityMembersSortOption.TDH]: "TDH",
    [CommunityMembersSortOption.REP]: "REP",
    [CommunityMembersSortOption.NIC]: "NIC",
  } as const;

  return (
    <div className="tw-flex tw-gap-x-2 tw-overflow-x-auto tw-py-1 sm:tw-hidden">
      {OPTIONS.map((option) => {
        const isActive = option === activeSort;
        return (
          <button
            key={option}
            type="button"
            onClick={() => onSort(option)}
            className={`tw-flex tw-items-center tw-gap-x-1 tw-whitespace-nowrap tw-rounded-full tw-px-3 tw-py-1 tw-text-sm tw-font-medium tw-transition-colors tw-duration-200 tw-ease-out ${
              isActive
                ? "tw-bg-primary-400 tw-text-iron-900"
                : "tw-bg-iron-800 tw-text-iron-200 hover:tw-bg-iron-700"
            }`}
          >
            <span>{TITLE[option]}</span>
            {isActive && !isLoading && (
              <CommonTableSortIcon
                direction={sortDirection}
                isActive={true}
              />
            )}
          </button>
        );
      })}
    </div>
  );
} 