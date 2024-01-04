import { SortDirection } from "../../../../entities/ISort";
import { assertUnreachable } from "../../../../helpers/AllowlistToolHelpers";
import CommonTableSortIcon from "../icons/CommonTableSortIcon";
import {
  ProfileRatersParamsOrderBy,
  ProfileRatersTableType,
} from "./wrapper/ProfileRatersTableWrapper";

export default function ProfileRatersTableHeader({
  type,
  sortDirection,
  sortOrderBy,
  onSortTypeClick,
}: {
  readonly type: ProfileRatersTableType;
  readonly sortDirection: SortDirection;
  readonly sortOrderBy: ProfileRatersParamsOrderBy;
  readonly onSortTypeClick: (newSortType: ProfileRatersParamsOrderBy) => void;
}) {
  const getTotalTitle = (): string => {
    switch (type) {
      case ProfileRatersTableType.CIC_RECEIVED:
      case ProfileRatersTableType.CIC_GIVEN:
        return "Total CIC";
      case ProfileRatersTableType.REP_RECEIVED:
      case ProfileRatersTableType.REP_GIVEN:
        return "Total Rep";
      default:
        assertUnreachable(type);
        return "";
    }
  };

  return (
    <thead className="tw-border-b tw-border-x-0 tw-border-t-0 tw-border-white/10">
      <tr>
        <th className="tw-whitespace-nowrap tw-px-4 sm:tw-px-6 tw-py-3.5 tw-text-left tw-text-sm tw-font-medium tw-text-iron-400">
          Name
        </th>
        <th
          onClick={() => onSortTypeClick(ProfileRatersParamsOrderBy.RATING)}
          className="tw-group tw-cursor-pointer tw-whitespace-nowrap tw-px-4 sm:tw-px-6 tw-py-3.5 tw-text-right tw-text-sm tw-font-medium tw-text-iron-400"
        >
          <span
            className={`${
              sortOrderBy === ProfileRatersParamsOrderBy.RATING
                ? "tw-text-primary-400"
                : "group-hover:tw-text-iron-200"
            }`}
          >
            {getTotalTitle()}
          </span>
          <CommonTableSortIcon
            direction={
              sortOrderBy === ProfileRatersParamsOrderBy.RATING
                ? sortDirection
                : SortDirection.DESC
            }
            isActive={sortOrderBy === ProfileRatersParamsOrderBy.RATING}
          />
        </th>
        <th
          onClick={() =>
            onSortTypeClick(ProfileRatersParamsOrderBy.LAST_MODIFIED)
          }
          className="tw-group tw-cursor-pointer tw-whitespace-nowrap tw-px-4 sm:tw-px-6 tw-py-3.5 tw-text-right tw-text-sm tw-font-medium tw-text-iron-400"
        >
          <span
            className={`${
              sortOrderBy === ProfileRatersParamsOrderBy.LAST_MODIFIED
                ? "tw-text-primary-400"
                : "group-hover:tw-text-iron-200"
            }`}
          >
            Last Updated
          </span>
          <CommonTableSortIcon
            direction={
              sortOrderBy === ProfileRatersParamsOrderBy.LAST_MODIFIED
                ? sortDirection
                : SortDirection.DESC
            }
            isActive={sortOrderBy === ProfileRatersParamsOrderBy.LAST_MODIFIED}
          />
        </th>
      </tr>
    </thead>
  );
}
