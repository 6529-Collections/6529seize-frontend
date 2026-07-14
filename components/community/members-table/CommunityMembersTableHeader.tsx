"use client";

import type { SortDirection } from "@/entities/ISort";
import { ApiCommunityMembersSortOption } from "@/generated/models/ApiCommunityMembersSortOption";
import { useState } from "react";
import CommunityMembersTableHeaderSortableContent from "./CommunityMembersTableHeaderSortableContent";

const HEADER_CELL_CLASS_NAME =
  "tw-whitespace-nowrap tw-border-0 tw-border-b tw-border-solid tw-border-iron-800 tw-px-2 tw-py-2 tw-text-xs tw-font-semibold tw-leading-4 tw-text-iron-400 md:tw-px-4 md:tw-py-3";

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
    <thead>
      <tr>
        <th scope="col" className={`${HEADER_CELL_CLASS_NAME} tw-text-center`}>
          Rank
        </th>
        <th scope="col" className={`${HEADER_CELL_CLASS_NAME} tw-text-left`}>
          Profile
        </th>
        <th
          scope="col"
          className={`${HEADER_CELL_CLASS_NAME} tw-group tw-cursor-pointer tw-text-center`}
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
          className={`${HEADER_CELL_CLASS_NAME} tw-group tw-cursor-pointer tw-text-right`}
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
          className={`${HEADER_CELL_CLASS_NAME} tw-group tw-cursor-pointer tw-text-right`}
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
          className={`${HEADER_CELL_CLASS_NAME} tw-group tw-cursor-pointer tw-text-right`}
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
          className={`${HEADER_CELL_CLASS_NAME} tw-group tw-cursor-pointer tw-text-right`}
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
        <th scope="col" className={`${HEADER_CELL_CLASS_NAME} tw-text-left`}>
          <span>Last Seen</span>
        </th>
      </tr>
    </thead>
  );
}
