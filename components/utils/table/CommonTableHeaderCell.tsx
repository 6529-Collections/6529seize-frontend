import { useEffect, useState } from "react";
import { SortDirection } from "../../../entities/ISort";
import CommonTableSortIcon from "../../user/utils/icons/CommonTableSortIcon";
import { CommonTableHeaderCellProps } from "./CommonTableHeader";

export default function CommonTableHeaderCell<T>({
  cell: { title, value },
  sortable,
  activeType,
  sortDirection,
  onCellClick,
}: {
  readonly cell: CommonTableHeaderCellProps<T>;
  readonly sortable: boolean;
  readonly activeType: T;
  readonly sortDirection: SortDirection;
  readonly onCellClick: (value: T) => void;
}) {
  const [isActive, setIsActive] = useState<boolean>(value === activeType);
  useEffect(() => {
    setIsActive(value === activeType);
  }, [activeType]);

  const [sor, setSor] = useState<SortDirection>(
    isActive ? sortDirection : SortDirection.DESC
  );
  useEffect(() => {
    setSor(isActive ? sortDirection : SortDirection.DESC);
  }, [sortDirection, isActive]);
  return (
    <th
      scope="col"
      className="tw-px-4 sm:tw-px-6 tw-whitespace-nowrap tw-group tw-cursor-pointer tw-py-3 tw-text-right tw-text-sm tw-font-medium tw-text-iron-400"
      onClick={() => onCellClick(value)}
    >
      <span
        className={`${
          sortable && activeType === value
            ? "tw-text-primary-400"
            : "group-hover:tw-text-iron-200"
        } tw-transition tw-duration-300 tw-ease-out`}
      >
        {title}
      </span>
      {sortable && <CommonTableSortIcon direction={sor} isActive={isActive} />}
    </th>
  );
}
