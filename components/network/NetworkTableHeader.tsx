import { NetworkTableSort, NetworkTableSortState } from "./NetworkTableTypes";
import { SortDirection } from "../../entities/ISort";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import CircleLoader, { CircleLoaderSize } from "../distribution-plan-tool/common/CircleLoader";

interface Props {
  readonly sortState: NetworkTableSortState;
  readonly isLoading: boolean;
  readonly onSort: (sort: NetworkTableSort) => void;
}

export default function NetworkTableHeader({ sortState, isLoading, onSort }: Props) {
  const SORT_TYPE_TO_TEXT: Record<NetworkTableSort, string> = {
    [NetworkTableSort.LEVEL]: "Level",
    [NetworkTableSort.TDH]: "TDH",
    [NetworkTableSort.REP]: "REP",
    [NetworkTableSort.NIC]: "NIC",
    [NetworkTableSort.ACTIVE]: "Active"
  };

  const renderSortableHeader = (type: NetworkTableSort) => {
    const isActive = sortState.sort === type;
    const showLoader = isLoading && isActive;

    return (
      <th
        scope="col"
        className="tw-px-4 sm:tw-px-6 tw-whitespace-nowrap tw-group tw-cursor-pointer tw-py-3 tw-text-right tw-text-sm sm:tw-text-md tw-font-medium tw-text-iron-400"
        onClick={() => onSort(type)}>
        <span className={`${isActive ? "tw-text-primary-400" : "group-hover:tw-text-iron-200"} tw-transition tw-duration-300 tw-ease-out`}>
          {SORT_TYPE_TO_TEXT[type]}
        </span>
        {showLoader ? (
          <span className="tw-pl-2">
            <CircleLoader size={CircleLoaderSize.SMALL} />
          </span>
        ) : (
          <FontAwesomeIcon
            icon={sortState.sort_direction === SortDirection.ASC ? "sort-up" : "sort-down"}
            className={`tw-ml-2 ${isActive ? "tw-opacity-100" : "tw-opacity-0 group-hover:tw-opacity-50"}`}
          />
        )}
      </th>
    );
  };

  return (
    <thead className="tw-bg-iron-900 tw-border-b tw-border-x-0 tw-border-t-0 tw-border-white/10">
      <tr>
        <th scope="col" className="tw-whitespace-nowrap tw-px-4 sm:tw-px-6 tw-py-3 tw-text-left tw-text-sm sm:tw-text-md tw-font-medium tw-text-iron-400">
          Rank
        </th>
        <th scope="col" className="tw-whitespace-nowrap tw-px-4 sm:tw-px-6 tw-py-3 tw-text-left tw-text-sm sm:tw-text-md tw-font-medium tw-text-iron-400">
          Profile
        </th>
        {renderSortableHeader(NetworkTableSort.LEVEL)}
        {renderSortableHeader(NetworkTableSort.TDH)}
        {renderSortableHeader(NetworkTableSort.REP)}
        {renderSortableHeader(NetworkTableSort.NIC)}
        {renderSortableHeader(NetworkTableSort.ACTIVE)}
      </tr>
    </thead>
  );
} 