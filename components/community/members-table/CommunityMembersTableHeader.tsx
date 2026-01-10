"use client";

import type { SortDirection } from "@/entities/ISort";
import { ApiCommunityMembersSortOption } from "@/generated/models/ApiCommunityMembersSortOption";
import { useState } from "react";
import CommunityMembersTableHeaderSortableContent from "./CommunityMembersTableHeaderSortableContent";

export default function CommunityMembersTableHeader({
  activeSort,
  sortDirection,
  isLoading,
  onSort,
}: {
  readonly activeSort: ApiCommunityMembersSortOption;
  readonly sortDirection: SortDirection;
  readonly isLoading: boolean;
  readonly onSort: (sort: ApiCommunityMembersSortOption) => void;
}) {
  const [hoverOption, setHoverOption] =
    useState<ApiCommunityMembersSortOption | null>(null);
  return (
    <thead className="tw-border-x-0 tw-border-b tw-border-t-0 tw-border-iron-700 tw-bg-iron-900">
      <tr>
        <th
          scope="col"
          className="tw-whitespace-nowrap tw-px-4 tw-py-3 tw-text-left tw-text-sm tw-font-medium tw-text-iron-400 sm:tw-px-6 sm:tw-text-md"
        >
          Rank
        </th>
        <th
          scope="col"
          className="tw-whitespace-nowrap tw-py-3 tw-pr-4 tw-text-left tw-text-sm tw-font-medium tw-text-iron-400 sm:tw-text-md"
        >
          Profile
        </th>
        <th
          scope="col"
          className="tw-group tw-cursor-pointer tw-whitespace-nowrap tw-px-4 tw-py-3 tw-text-center tw-text-sm tw-font-medium tw-text-iron-400 sm:tw-px-6 sm:tw-text-md"
          onClick={() => onSort(ApiCommunityMembersSortOption.Level)}
          onMouseEnter={() =>
            setHoverOption(ApiCommunityMembersSortOption.Level)
          }
          onMouseLeave={() => setHoverOption(null)}
        >
          <CommunityMembersTableHeaderSortableContent
            sort={ApiCommunityMembersSortOption.Level}
            activeSort={activeSort}
            sortDirection={sortDirection}
            isLoading={isLoading}
            hoveringOption={hoverOption}
          />
        </th>
        <th
          scope="col"
          className="tw-group tw-cursor-pointer tw-whitespace-nowrap tw-px-4 tw-py-3 tw-text-right tw-text-sm tw-font-medium tw-text-iron-400 sm:tw-px-6 sm:tw-text-md"
          onClick={() => onSort(ApiCommunityMembersSortOption.Tdh)}
          onMouseEnter={() => setHoverOption(ApiCommunityMembersSortOption.Tdh)}
          onMouseLeave={() => setHoverOption(null)}
        >
          <CommunityMembersTableHeaderSortableContent
            sort={ApiCommunityMembersSortOption.Tdh}
            activeSort={activeSort}
            sortDirection={sortDirection}
            isLoading={isLoading}
            hoveringOption={hoverOption}
          />
        </th>
        <th
          scope="col"
          className="tw-group tw-cursor-pointer tw-whitespace-nowrap tw-px-4 tw-py-3 tw-text-right tw-text-sm tw-font-medium tw-text-iron-400 sm:tw-px-6 sm:tw-text-md"
          onClick={() => onSort(ApiCommunityMembersSortOption.Xtdh)}
          onMouseEnter={() =>
            setHoverOption(ApiCommunityMembersSortOption.Xtdh)
          }
          onMouseLeave={() => setHoverOption(null)}
        >
          <CommunityMembersTableHeaderSortableContent
            sort={ApiCommunityMembersSortOption.Xtdh}
            activeSort={activeSort}
            sortDirection={sortDirection}
            isLoading={isLoading}
            hoveringOption={hoverOption}
          />
        </th>
        <th
          scope="col"
          className="tw-group tw-cursor-pointer tw-whitespace-nowrap tw-px-4 tw-py-3 tw-text-right tw-text-sm tw-font-medium tw-text-iron-400 sm:tw-px-6 sm:tw-text-md"
          onClick={() => onSort(ApiCommunityMembersSortOption.Rep)}
          onMouseEnter={() => setHoverOption(ApiCommunityMembersSortOption.Rep)}
          onMouseLeave={() => setHoverOption(null)}
        >
          <CommunityMembersTableHeaderSortableContent
            sort={ApiCommunityMembersSortOption.Rep}
            activeSort={activeSort}
            sortDirection={sortDirection}
            isLoading={isLoading}
            hoveringOption={hoverOption}
          />
        </th>
        <th
          scope="col"
          className="tw-group tw-cursor-pointer tw-whitespace-nowrap tw-px-4 tw-py-3 tw-text-right tw-text-sm tw-font-medium tw-text-iron-400 sm:tw-px-6 sm:tw-text-md"
          onClick={() => onSort(ApiCommunityMembersSortOption.Cic)}
          onMouseEnter={() => setHoverOption(ApiCommunityMembersSortOption.Cic)}
          onMouseLeave={() => setHoverOption(null)}
        >
          <CommunityMembersTableHeaderSortableContent
            sort={ApiCommunityMembersSortOption.Cic}
            activeSort={activeSort}
            sortDirection={sortDirection}
            isLoading={isLoading}
            hoveringOption={hoverOption}
          />
        </th>
        <th
          scope="col"
          className="tw-group tw-whitespace-nowrap tw-px-4 tw-py-3 tw-text-sm tw-font-medium tw-text-iron-400 sm:tw-pr-6 sm:tw-text-md"
        >
          <span>Last Seen</span>
        </th>
      </tr>
    </thead>
  );
}
