"use client";

import { useEffect, useState } from "react";
import { SortDirection } from "@/entities/ISort";
import CommonTableSortIcon from "@/components/user/utils/icons/CommonTableSortIcon";
import CircleLoader, {
  CircleLoaderSize,
} from "@/components/distribution-plan-tool/common/CircleLoader";
import { ApiCommunityMembersSortOption } from "@/generated/models/ApiCommunityMembersSortOption";

const TITLE: Record<string, string> = {
  [ApiCommunityMembersSortOption.Display]: "Profile",
  [ApiCommunityMembersSortOption.Level]: "Level",
  [ApiCommunityMembersSortOption.Tdh]: "TDH",
  [ApiCommunityMembersSortOption.Xtdh]: "xTDH",
  [ApiCommunityMembersSortOption.Rep]: "REP",
  [ApiCommunityMembersSortOption.Cic]: "NIC",
};

export default function CommunityMembersTableHeaderSortableContent({
  sort,
  activeSort,
  sortDirection,
  hoveringOption,
  isLoading,
}: {
  readonly sort: ApiCommunityMembersSortOption;
  readonly activeSort: ApiCommunityMembersSortOption;
  readonly sortDirection: SortDirection;
  readonly hoveringOption: ApiCommunityMembersSortOption | null;
  readonly isLoading: boolean;
}) {
  const isActive = sort === activeSort;
  const direction = isActive ? sortDirection : SortDirection.DESC;

  const [rotate, setRotate] = useState<boolean>(false);
  useEffect(() => setRotate(false), [sortDirection]);
  useEffect(
    () => setRotate(isActive && hoveringOption === sort),
    [hoveringOption, isActive, sort]
  );
  const showLoader = isLoading && isActive;
  return (
    <>
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
        <span className="-tw-mt-0.5 tw-ml-2">
          <CommonTableSortIcon
            direction={direction}
            isActive={isActive}
            shouldRotate={rotate}
          />
        </span>
      )}
    </>
  );
}
