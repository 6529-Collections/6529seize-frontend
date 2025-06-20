"use client";

import { useState } from "react";
import { SortDirection } from "../../../entities/ISort";
import CommunityMembersTableHeaderSortableContent from "./CommunityMembersTableHeaderSortableContent";
import { CommunityMembersSortOption } from "../../../enums";

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
  const [hoverOption, setHoverOption] =
    useState<CommunityMembersSortOption | null>(null);
  return (
    <thead className="tw-bg-iron-900 tw-border-b tw-border-x-0 tw-border-t-0 tw-border-iron-700">
      <tr>
        <th
          scope="col"
          className="tw-whitespace-nowrap tw-px-4 sm:tw-px-6 tw-py-3 tw-text-left tw-text-sm sm:tw-text-md tw-font-medium tw-text-iron-400">
          Rank
        </th>
        <th
          scope="col"
          className="tw-whitespace-nowrap tw-pr-4 tw-py-3 tw-text-left tw-text-sm sm:tw-text-md tw-font-medium tw-text-iron-400">
          Profile
        </th>
        <th
          scope="col"
          className="tw-px-4 sm:tw-px-6 tw-whitespace-nowrap tw-group tw-cursor-pointer tw-py-3 tw-text-sm sm:tw-text-md tw-font-medium tw-text-iron-400"
          onClick={() => onSort(CommunityMembersSortOption.LEVEL)}
          onMouseEnter={() => setHoverOption(CommunityMembersSortOption.LEVEL)}
          onMouseLeave={() => setHoverOption(null)}>
          <CommunityMembersTableHeaderSortableContent
            sort={CommunityMembersSortOption.LEVEL}
            activeSort={activeSort}
            sortDirection={sortDirection}
            isLoading={isLoading}
            hoveringOption={hoverOption}
          />
        </th>
        <th
          scope="col"
          className="tw-px-4 sm:tw-px-6 tw-whitespace-nowrap tw-group tw-cursor-pointer tw-py-3 tw-text-right tw-text-sm sm:tw-text-md tw-font-medium tw-text-iron-400"
          onClick={() => onSort(CommunityMembersSortOption.TDH)}
          onMouseEnter={() => setHoverOption(CommunityMembersSortOption.TDH)}
          onMouseLeave={() => setHoverOption(null)}>
          <CommunityMembersTableHeaderSortableContent
            sort={CommunityMembersSortOption.TDH}
            activeSort={activeSort}
            sortDirection={sortDirection}
            isLoading={isLoading}
            hoveringOption={hoverOption}
          />
        </th>
        <th
          scope="col"
          className="tw-px-4 sm:tw-px-6 tw-whitespace-nowrap tw-group tw-cursor-pointer tw-py-3 tw-text-right tw-text-sm sm:tw-text-md tw-font-medium tw-text-iron-400"
          onClick={() => onSort(CommunityMembersSortOption.REP)}
          onMouseEnter={() => setHoverOption(CommunityMembersSortOption.REP)}
          onMouseLeave={() => setHoverOption(null)}>
          <CommunityMembersTableHeaderSortableContent
            sort={CommunityMembersSortOption.REP}
            activeSort={activeSort}
            sortDirection={sortDirection}
            isLoading={isLoading}
            hoveringOption={hoverOption}
          />
        </th>
        <th
          scope="col"
          className="tw-px-4 sm:tw-px-6 tw-whitespace-nowrap tw-group tw-cursor-pointer tw-py-3 tw-text-right tw-text-sm sm:tw-text-md tw-font-medium tw-text-iron-400"
          onClick={() => onSort(CommunityMembersSortOption.NIC)}
          onMouseEnter={() => setHoverOption(CommunityMembersSortOption.NIC)}
          onMouseLeave={() => setHoverOption(null)}>
          <CommunityMembersTableHeaderSortableContent
            sort={CommunityMembersSortOption.NIC}
            activeSort={activeSort}
            sortDirection={sortDirection}
            isLoading={isLoading}
            hoveringOption={hoverOption}
          />
        </th>
        <th
          scope="col"
          className="tw-px-4 sm:tw-pr-6 tw-whitespace-nowrap tw-group tw-py-3 tw-text-sm sm:tw-text-md tw-font-medium tw-text-iron-400">
          <span>Active</span>
        </th>
      </tr>
    </thead>
  );
}
