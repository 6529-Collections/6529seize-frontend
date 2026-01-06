"use client";

import CircleLoader, {
  CircleLoaderSize,
} from "@/components/distribution-plan-tool/common/CircleLoader";
import { SortDirection } from "@/entities/ISort";
import type { ProfileRatersParamsOrderBy } from "@/enums";
import { useEffect, useState } from "react";
import CommonTableSortIcon from "../icons/CommonTableSortIcon";

export default function ProfileRatersTableHeaderSortableCell({
  title,
  sortType,
  sortDirection,
  sortOrderBy,
  isLoading,
  onSortTypeClick,
}: {
  readonly title: string;
  readonly sortType: ProfileRatersParamsOrderBy;
  readonly sortDirection: SortDirection;
  readonly sortOrderBy: ProfileRatersParamsOrderBy;
  readonly isLoading: boolean;
  readonly onSortTypeClick: (newSortType: ProfileRatersParamsOrderBy) => void;
}) {
  const [isActive, setIsActive] = useState<boolean>(sortType === sortOrderBy);
  useEffect(() => {
    setIsActive(sortType === sortOrderBy);
  }, [sortType, sortOrderBy]);

  return (
    <th
      onClick={() => onSortTypeClick(sortType)}
      className="tw-group tw-cursor-pointer tw-whitespace-nowrap tw-px-4 sm:tw-px-6 lg:tw-pl-4 tw-py-3.5 tw-text-right tw-text-sm sm:tw-text-md tw-font-medium tw-text-iron-400">
      <span
        className={`${
          isActive
            ? "tw-text-primary-400"
            : "group-hover:tw-text-iron-200 tw-transition tw-duration-300 tw-ease-out"
        }`}>
        {title}
      </span>
      {isLoading && isActive ? (
        <span className="tw-pl-2">
          <CircleLoader size={CircleLoaderSize.SMALL} />
        </span>
      ) : (
        <span className="-tw-mt-0.5 tw-ml-2">
          <CommonTableSortIcon
            direction={isActive ? sortDirection : SortDirection.DESC}
            isActive={isActive}
          />
        </span>
      )}
    </th>
  );
}
