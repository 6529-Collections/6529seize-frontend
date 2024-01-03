import { SortDirection } from "../../../../../entities/ISort";
import { RepsTableSort } from "./UserPageRepRepsTable";
import UserPageRepRepsTableHeaderSortableCell from "./UserPageRepRepsTableHeaderSortableCell";

export default function UserPageRepRepsTableHeader({
  activeType,
  sortDirection,
  onSortTypeClick,
}: {
  readonly activeType: RepsTableSort;
  readonly sortDirection: SortDirection;
  readonly onSortTypeClick: (newSortType: RepsTableSort) => void;
}) {
  return (
    <thead className="tw-bg-iron-900 tw-border-b tw-border-x-0 tw-border-t-0 tw-border-white/10">
      <tr>
        <th
          scope="col"
          className="tw-whitespace-nowrap tw-px-4 sm:tw-px-6 tw-py-3 tw-text-left tw-text-sm tw-font-medium tw-text-iron-400"
        >
          Category
        </th>
        {Object.values(RepsTableSort).map((sortType) => (
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
