import { SortDirection } from "../../../../entities/ISort";
import { assertUnreachable } from "../../../../helpers/AllowlistToolHelpers";
import ProfileRatersTableHeaderSortableCell from "./ProfileRatersTableHeaderSortableCell";
import {
  ProfileRatersParamsOrderBy,
  ProfileRatersTableType,
} from "./wrapper/ProfileRatersTableWrapper";

export default function ProfileRatersTableHeader({
  type,
  sortDirection,
  sortOrderBy,
  isLoading,
  onSortTypeClick,
}: {
  readonly type: ProfileRatersTableType;
  readonly sortDirection: SortDirection;
  readonly sortOrderBy: ProfileRatersParamsOrderBy;
  readonly isLoading: boolean;
  readonly onSortTypeClick: (newSortType: ProfileRatersParamsOrderBy) => void;
}) {
  const getTotalTitle = (): string => {
    switch (type) {
      case ProfileRatersTableType.CIC_RECEIVED:
      case ProfileRatersTableType.CIC_GIVEN:
        return "Total NIC";
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
        <th className="tw-whitespace-nowrap tw-px-4 sm:tw-px-6 lg:tw-pr-4 tw-py-3.5 tw-text-left tw-text-sm sm:tw-text-md tw-font-medium tw-text-iron-400">
          Name
        </th>
        <ProfileRatersTableHeaderSortableCell
          title={getTotalTitle()}
          sortType={ProfileRatersParamsOrderBy.RATING}
          sortDirection={sortDirection}
          sortOrderBy={sortOrderBy}
          isLoading={isLoading}
          onSortTypeClick={onSortTypeClick}
        />
        <ProfileRatersTableHeaderSortableCell
          title="Last Updated"
          sortType={ProfileRatersParamsOrderBy.LAST_MODIFIED}
          sortDirection={sortDirection}
          sortOrderBy={sortOrderBy}
          isLoading={isLoading}
          onSortTypeClick={onSortTypeClick}
        />
      </tr>
    </thead>
  );
}
