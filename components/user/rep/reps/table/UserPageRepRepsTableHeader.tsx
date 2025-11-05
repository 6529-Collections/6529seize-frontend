"use client";

import { useEffect, useState } from "react";
import { SortDirection } from "@/entities/ISort";
import { RepsTableSort } from "./UserPageRepRepsTable";
import UserPageRepRepsTableHeaderSortableCell from "./UserPageRepRepsTableHeaderSortableCell";

export default function UserPageRepRepsTableHeader({
  activeType,
  sortDirection,
  showMyRates,
  onSortTypeClick,
}: {
  readonly activeType: RepsTableSort;
  readonly sortDirection: SortDirection;
  readonly showMyRates: boolean;
  readonly onSortTypeClick: (newSortType: RepsTableSort) => void;
}) {
  const getTypes = (myRates: boolean) => {
    if (myRates) {
      return [RepsTableSort.REP, RepsTableSort.RATERS, RepsTableSort.MY_RATES];
    }
    return [RepsTableSort.REP, RepsTableSort.RATERS];
  };

  const [types, setTypes] = useState<RepsTableSort[]>(getTypes(showMyRates));
  useEffect(() => setTypes(getTypes(showMyRates)), [showMyRates]);

  return (
    <thead className="tw-bg-iron-950 tw-border-b tw-border-x-0 tw-border-t-0 tw-border-white/10">
      <tr>
        <th
          scope="col"
          className="tw-whitespace-nowrap tw-px-4 sm:tw-px-6 tw-py-3 tw-text-left tw-text-sm sm:tw-text-md tw-font-medium tw-text-iron-400">
          Category
        </th>
        {types.map((sortType) => (
          <UserPageRepRepsTableHeaderSortableCell
            key={sortType}
            type={sortType}
            activeType={activeType}
            activeDirection={sortDirection}
            onSortTypeClick={onSortTypeClick}
          />
        ))}
      </tr>
    </thead>
  );
}
