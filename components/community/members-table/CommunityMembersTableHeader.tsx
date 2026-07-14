"use client";

import { SortDirection } from "@/entities/ISort";
import { ApiCommunityMembersSortOption } from "@/generated/models/ApiCommunityMembersSortOption";
import { useState } from "react";
import CommunityMembersTableHeaderSortableContent from "./CommunityMembersTableHeaderSortableContent";

const HEADER_CELL_CLASS_NAME =
  "tw-whitespace-nowrap tw-border-0 tw-border-b tw-border-solid tw-border-iron-800 tw-px-2 tw-py-2 tw-text-xs tw-font-semibold tw-leading-4 tw-text-iron-400 md:tw-px-4 md:tw-py-3";
const SORT_BUTTON_CLASS_NAME =
  "tw-group tw-flex tw-min-h-6 tw-w-full tw-cursor-pointer tw-appearance-none tw-items-center tw-border-0 tw-bg-transparent tw-p-0 tw-text-xs tw-font-semibold tw-leading-4 tw-text-inherit focus-visible:tw-rounded-sm focus-visible:tw-outline focus-visible:tw-outline-2 focus-visible:tw-outline-offset-2 focus-visible:tw-outline-primary-400";
const SORTABLE_COLUMNS = [
  { sort: ApiCommunityMembersSortOption.Level, centered: true },
  { sort: ApiCommunityMembersSortOption.Tdh, centered: false },
  { sort: ApiCommunityMembersSortOption.Xtdh, centered: false },
  { sort: ApiCommunityMembersSortOption.Rep, centered: false },
  { sort: ApiCommunityMembersSortOption.Cic, centered: false },
] as const;

function getAriaSort(
  sort: ApiCommunityMembersSortOption,
  activeSort: ApiCommunityMembersSortOption,
  sortDirection: SortDirection
): "ascending" | "descending" | undefined {
  if (sort !== activeSort) {
    return undefined;
  }

  return sortDirection === SortDirection.ASC ? "ascending" : "descending";
}

function SortableHeaderCell({
  sort,
  centered,
  activeSort,
  sortDirection,
  isLoading,
  onSort,
}: {
  readonly sort: ApiCommunityMembersSortOption;
  readonly centered: boolean;
  readonly activeSort: ApiCommunityMembersSortOption;
  readonly sortDirection: SortDirection;
  readonly isLoading: boolean;
  readonly onSort: (sort: ApiCommunityMembersSortOption) => void;
}) {
  const [isHovered, setIsHovered] = useState(false);

  return (
    <th
      scope="col"
      aria-sort={getAriaSort(sort, activeSort, sortDirection)}
      className={`${HEADER_CELL_CLASS_NAME} ${
        centered ? "tw-text-center" : "tw-text-right"
      }`}
    >
      <button
        type="button"
        className={`${SORT_BUTTON_CLASS_NAME} ${
          centered ? "tw-justify-center" : "tw-justify-end"
        }`}
        onClick={() => onSort(sort)}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        <CommunityMembersTableHeaderSortableContent
          sort={sort}
          activeSort={activeSort}
          sortDirection={sortDirection}
          isLoading={isLoading}
          hoveringOption={isHovered ? sort : null}
        />
      </button>
    </th>
  );
}

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
  return (
    <thead>
      <tr>
        <th scope="col" className={`${HEADER_CELL_CLASS_NAME} tw-text-center`}>
          Rank
        </th>
        <th scope="col" className={`${HEADER_CELL_CLASS_NAME} tw-text-left`}>
          Profile
        </th>
        {SORTABLE_COLUMNS.map(({ sort, centered }) => (
          <SortableHeaderCell
            key={sort}
            sort={sort}
            centered={centered}
            activeSort={activeSort}
            sortDirection={sortDirection}
            isLoading={isLoading}
            onSort={onSort}
          />
        ))}
        <th scope="col" className={`${HEADER_CELL_CLASS_NAME} tw-text-left`}>
          <span>Last Seen</span>
        </th>
      </tr>
    </thead>
  );
}
