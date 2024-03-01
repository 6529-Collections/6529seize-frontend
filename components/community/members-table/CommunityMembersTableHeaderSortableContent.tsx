import { useEffect, useState } from "react";
import { SortDirection } from "../../../entities/ISort";
import { CommunityMembersSortOption } from "../../../pages/community";
import CommonTableSortIcon from "../../user/utils/icons/CommonTableSortIcon";
import CircleLoader, {
  CircleLoaderSize,
} from "../../distribution-plan-tool/common/CircleLoader";

export default function CommunityMembersTableHeaderSortableContent({
  sort,
  activeSort,
  sortDirection,
  isLoading,
}: {
  readonly sort: CommunityMembersSortOption;
  readonly activeSort: CommunityMembersSortOption;
  readonly sortDirection: SortDirection;
  readonly isLoading: boolean;
}) {
  const isActive = sort === activeSort;
  const direction = isActive ? sortDirection : SortDirection.DESC;
  const TITLE: Record<CommunityMembersSortOption, string> = {
    [CommunityMembersSortOption.DISPLAY]: "Profile",
    [CommunityMembersSortOption.LEVEL]: "Level",
    [CommunityMembersSortOption.TDH]: "TDH",
    [CommunityMembersSortOption.REP]: "REP",
    [CommunityMembersSortOption.CIC]: "CIC",
  };

  const [rotate, setRotate] = useState<boolean>(false);
  useEffect(() => setRotate(false), [sortDirection]);
  const showLoader = isLoading && isActive;
  return (
    <div
      onMouseEnter={() => setRotate(isActive)}
      onMouseLeave={() => setRotate(false)}
    >
      <span
        className={`${
          isActive ? "tw-text-primary-400" : "group-hover:tw-text-iron-200"
        } tw-transition tw-duration-300 tw-ease-out`}
      >
        {TITLE[sort]}
      </span>
      {showLoader ? (
        <span className="tw-pl-2">
          <CircleLoader size={CircleLoaderSize.SMALL} />
        </span>
      ) : (
        <CommonTableSortIcon
          direction={direction}
          isActive={isActive}
          shouldRotate={rotate}
        />
      )}
    </div>
  );
}
