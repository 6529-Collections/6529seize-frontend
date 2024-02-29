import { SortDirection } from "../../../entities/ISort";
import CommonTableHeaderCell from "./CommonTableHeaderCell";

export interface CommonTableHeaderCellProps<T> {
  readonly title: string;
  readonly value: T;
}

export interface CommonTableHeaderProps<T, U extends boolean> {
  readonly cells: CommonTableHeaderCellProps<T>[];
  readonly sortable: U;
  readonly activeType: U extends true ? T : never;
  readonly sortDirection: U extends true ? SortDirection : never;
  readonly nonSortableTitle: string | null;
  readonly ranks?: true;
  readonly onCellClick: (value: T) => void;
}

export default function CommonTableHeader<T, U extends boolean>({
  cells,
  sortable,
  activeType,
  sortDirection,
  nonSortableTitle,
  ranks,
  onCellClick,
}: CommonTableHeaderProps<T, U>) {
  return (
    <thead className="tw-bg-iron-900 tw-border-b tw-border-x-0 tw-border-t-0 tw-border-white/10">
      <tr>
        {ranks && (
          <th
            scope="col"
            className="tw-whitespace-nowrap tw-px-4 sm:tw-px-6 tw-py-3 tw-text-left tw-text-sm tw-font-medium tw-text-iron-400"
          >
            Rank
          </th>
        )}
        {nonSortableTitle && (
          <th
            scope="col"
            className="tw-whitespace-nowrap tw-px-4 sm:tw-px-6 tw-py-3 tw-text-left tw-text-sm tw-font-medium tw-text-iron-400"
          >
            {nonSortableTitle}
          </th>
        )}
        {cells.map((cell) => (
          <CommonTableHeaderCell
            key={cell.title}
            cell={cell}
            sortable={sortable}
            activeType={activeType}
            sortDirection={sortDirection}
            onCellClick={onCellClick}
          />
        ))}
      </tr>
    </thead>
  );
}
