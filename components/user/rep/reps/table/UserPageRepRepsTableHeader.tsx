"use client";

import { useEffect, useState } from "react";
import type { SortDirection } from "@/entities/ISort";
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
    <thead>
      <tr className="tw-border-y tw-border-solid tw-border-white/[0.06] tw-border-x-0">
        <th
          scope="col"
          className="tw-whitespace-nowrap tw-px-4 sm:tw-px-6 tw-py-1.5 tw-text-left tw-text-xs tw-font-semibold tw-uppercase tw-tracking-[0.05em] tw-text-iron-500 tw-border-0">
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
