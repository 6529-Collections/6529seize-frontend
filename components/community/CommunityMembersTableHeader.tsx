import { SortDirection } from "../../entities/ISort";
import { CommunityMembersSortOption } from "../../pages/community";
import CommonTableHeader, {
  CommonTableHeaderCellProps,
} from "../utils/table/CommonTableHeader";

export default function CommunityMembersTableHeader({
  sort,
  sortDirection,
  onSortClick,
}: {
  readonly sort: CommunityMembersSortOption;
  readonly sortDirection: SortDirection;
  readonly onSortClick: (newSort: CommunityMembersSortOption) => void;
}) {
  const SORT_OPTION_TITLES: Record<CommunityMembersSortOption, string> = {
    [CommunityMembersSortOption.DISPLAY]: "Profile",
    [CommunityMembersSortOption.LEVEL]: "Level",
    [CommunityMembersSortOption.TDH]: "TDH",
    [CommunityMembersSortOption.REP]: "REP",
    [CommunityMembersSortOption.CIC]: "CIC",
  };
  const cells: CommonTableHeaderCellProps<CommunityMembersSortOption>[] =
    Object.values(CommunityMembersSortOption)
      .map((sort) => ({
        value: sort,
        title: SORT_OPTION_TITLES[sort],
      }))
      .filter((s) => s.value !== CommunityMembersSortOption.DISPLAY);

  return (
    <CommonTableHeader
      cells={cells}
      sortable={true}
      activeType={sort}
      sortDirection={sortDirection}
      nonSortableTitle={SORT_OPTION_TITLES[CommunityMembersSortOption.DISPLAY]}
      ranks={true}
      onCellClick={onSortClick}
    />
  );
}
