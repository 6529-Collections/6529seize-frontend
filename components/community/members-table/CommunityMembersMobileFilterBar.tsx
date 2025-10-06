import { SortDirection } from "@/entities/ISort";
import { CommunityMembersSortOption } from "@/enums";
import CommonTableSortIcon from "@/components/user/utils/icons/CommonTableSortIcon";
import CircleLoader, {
  CircleLoaderSize,
} from "@/components/distribution-plan-tool/common/CircleLoader";

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
    <div className="tw-flex tw-gap-x-2 sm:tw-hidden tw-overflow-x-auto tw-py-1 tw-scrollbar-thin tw-scrollbar-thumb-iron-500 tw-transition-colors tw-duration-500 tw-scrollbar-track-iron-800 desktop-hover:hover:tw-scrollbar-thumb-iron-300 ">
      {OPTIONS.map((option) => {
        const isActive = option === activeSort;
        const showLoader = isActive && isLoading;
        const arrowDirection = isActive ? sortDirection : SortDirection.DESC;
        return (
          <button
            key={option}
            type="button"
            onClick={() => onSort(option)}
            className={`group tw-flex tw-items-center tw-justify-center tw-gap-x-1 tw-whitespace-nowrap tw-border-none tw-rounded-full tw-px-3.5 tw-py-1.5 tw-text-sm tw-font-medium tw-transition-colors tw-duration-200 tw-ease-out ${
              isActive
                ? "tw-bg-iron-700 tw-text-white"
                : "tw-bg-iron-900 tw-text-iron-400 active:tw-bg-iron-700"
            }`}
          >
            <span>{TITLE[option]}</span>
            <span className="-tw-mt-0.5 tw-ml-1">
              {showLoader ? (
                <CircleLoader size={CircleLoaderSize.SMALL} />
              ) : (
                <CommonTableSortIcon
                  direction={arrowDirection}
                  isActive={isActive}
                  activeClassName="tw-text-white"
                />
              )}
            </span>
          </button>
        );
      })}
    </div>
  );
}
