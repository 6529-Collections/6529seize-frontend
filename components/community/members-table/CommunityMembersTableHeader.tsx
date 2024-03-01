import { SortDirection } from "../../../entities/ISort";
import { CommunityMembersSortOption } from "../../../pages/community";
import CommunityMembersTableHeaderSortableContent from "./CommunityMembersTableHeaderSortableContent";

export default function CommunityMembersTableHeader({
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
  return (
    <thead className="tw-bg-iron-900 tw-border-b tw-border-x-0 tw-border-t-0 tw-border-iron-700">
      <tr>
        <th
          scope="col"
          className="tw-whitespace-nowrap tw-px-4 sm:tw-px-6 tw-py-3 tw-text-left tw-text-sm sm:tw-text-md tw-font-medium tw-text-iron-400"
        >
          Rank
        </th>

        <th
          scope="col"
          className="tw-whitespace-nowrap tw-pr-4 sm:tw-pr-6 tw-py-3 tw-text-left tw-text-sm sm:tw-text-md tw-font-medium tw-text-iron-400"
        >
          Profile
        </th>

        <th
          scope="col"
          tabindex="0"
          className="tw-px-4 sm:tw-px-6 tw-whitespace-nowrap tw-group tw-cursor-pointer tw-py-3 tw-text-sm sm:tw-text-md tw-font-medium tw-text-iron-400"
          onClick={() => onSort(CommunityMembersSortOption.LEVEL)}
        >
          <CommunityMembersTableHeaderSortableContent
            sort={CommunityMembersSortOption.LEVEL}
            activeSort={activeSort}
            sortDirection={sortDirection}
            isLoading={isLoading}
          />
        </th>
        <th
          scope="col"
          className="tw-px-4 sm:tw-px-6 tw-whitespace-nowrap tw-group tw-cursor-pointer tw-py-3 tw-text-right tw-text-sm sm:tw-text-md tw-font-medium tw-text-iron-400"
          onClick={() => onSort(CommunityMembersSortOption.TDH)}
        >
          <CommunityMembersTableHeaderSortableContent
            sort={CommunityMembersSortOption.TDH}
            activeSort={activeSort}
            sortDirection={sortDirection}
            isLoading={isLoading}
          />
        </th>
        <th
          scope="col"
          className="tw-px-4 sm:tw-px-6 tw-whitespace-nowrap tw-group tw-cursor-pointer tw-py-3 tw-text-right tw-text-sm sm:tw-text-md tw-font-medium tw-text-iron-400"
          onClick={() => onSort(CommunityMembersSortOption.REP)}
        >
          <CommunityMembersTableHeaderSortableContent
            sort={CommunityMembersSortOption.REP}
            activeSort={activeSort}
            sortDirection={sortDirection}
            isLoading={isLoading}
          />
        </th>
        <th
          scope="col"
          className="tw-px-4 sm:tw-px-6 tw-whitespace-nowrap tw-group tw-cursor-pointer tw-py-3 tw-text-right tw-text-sm sm:tw-text-md tw-font-medium tw-text-iron-400"
          onClick={() => onSort(CommunityMembersSortOption.CIC)}
        >
          <CommunityMembersTableHeaderSortableContent
            sort={CommunityMembersSortOption.CIC}
            activeSort={activeSort}
            sortDirection={sortDirection}
            isLoading={isLoading}
          />
        </th>
        <th
          scope="col"
          className="tw-px-4 sm:tw-px-6 tw-whitespace-nowrap tw-group tw-cursor-pointer tw-py-3 tw-text-sm sm:tw-text-md tw-font-medium tw-text-iron-400"
        >
          <span>Active</span>
        </th>
      </tr>
    </thead>
  );
}
