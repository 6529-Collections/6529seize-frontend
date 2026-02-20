"use client";

import { useEffect, useState } from "react";
import { SortDirection } from "@/entities/ISort";
import { RepsTableSort } from "./UserPageRepRepsTable";
import CommonTableSortIcon from "@/components/user/utils/icons/CommonTableSortIcon";

export default function UserPageRepRepsTableHeaderSortableCell({
  type,
  activeType,
  activeDirection,
  onSortTypeClick,
}: {
  readonly type: RepsTableSort;
  readonly activeType: RepsTableSort;
  readonly activeDirection: SortDirection;
  readonly onSortTypeClick: (newSortType: RepsTableSort) => void;
}) {
  const SORT_TYPE_TO_TEXT: Record<RepsTableSort, string> = {
    [RepsTableSort.REP]: "Rep",
    [RepsTableSort.RATERS]: "Raters",
    [RepsTableSort.MY_RATES]: "My Rates",
  };

  const [isActive, setIsActive] = useState<boolean>(type === activeType);
  useEffect(() => {
    setIsActive(type === activeType);
  }, [activeType]);

  const [sor, setSor] = useState<SortDirection>(
    isActive ? activeDirection : SortDirection.DESC
  );
  useEffect(() => {
    setSor(isActive ? activeDirection : SortDirection.DESC);
  }, [activeDirection, isActive]);

  return (
    <th
      scope="col"
      className="tw-px-4 sm:tw-px-6 tw-whitespace-nowrap tw-group tw-cursor-pointer tw-py-1.5 tw-text-right tw-text-xs tw-font-semibold tw-uppercase tw-tracking-[0.05em] tw-text-iron-500 tw-border-0"
      onClick={() => onSortTypeClick(type)}>
      <span
        className={`${
          isActive ? "tw-text-iron-500" : "group-hover:tw-text-iron-400"
        } tw-transition tw-duration-300 tw-ease-out`}>
        {SORT_TYPE_TO_TEXT[type]}
      </span>
      <span className="-tw-mt-0.5 tw-ml-2">
        <CommonTableSortIcon direction={sor} isActive={isActive} />
      </span>
    </th>
  );
}
