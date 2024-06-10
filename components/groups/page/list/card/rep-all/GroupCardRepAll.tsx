import { useEffect, useState } from "react";
import { GroupFull } from "../../../../../../generated/models/GroupFull";
import RepCategorySearch, {
  RepCategorySearchSize,
} from "../../../../../utils/input/rep-category/RepCategorySearch";
import GroupCardActionFooter from "../utils/GroupCardActionFooter";
import GroupCardActionStats from "../utils/GroupCardActionStats";
import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { Page } from "../../../../../../helpers/Types";
import { CommunityMemberOverview } from "../../../../../../entities/IProfile";
import { QueryKey } from "../../../../../react-query-wrapper/ReactQueryWrapper";
import {
  CommunityMembersQuery,
  CommunityMembersSortOption,
} from "../../../../../../pages/community";
import { SortDirection } from "../../../../../../entities/ISort";
import { commonApiFetch } from "../../../../../../services/api/common-api";

export default function GroupCardRepAll({
  group,
  onCancel,
}: {
  readonly group: GroupFull;
  readonly onCancel: () => void;
}) {
  const [category, setCategory] = useState<string | null>(null);
  const { data: members } = useQuery<Page<CommunityMemberOverview>>({
    queryKey: [
      QueryKey.COMMUNITY_MEMBERS_TOP,
      {
        page: 1,
        pageSize: 1,
        sort: CommunityMembersSortOption.LEVEL,
        sortDirection: SortDirection.DESC,
        groupId: group.id,
      },
    ],
    queryFn: async () =>
      await commonApiFetch<
        Page<CommunityMemberOverview>,
        CommunityMembersQuery
      >({
        endpoint: `community-members/top`,
        params: {
          page: 1,
          page_size: 1,
          sort: CommunityMembersSortOption.LEVEL,
          sort_direction: SortDirection.DESC,
          group_id: group.id,
        },
      }),
    placeholderData: keepPreviousData,
  });

  const [membersCount, setMembersCount] = useState<number | null>(null);
  useEffect(() => {
    if (members) {
      setMembersCount(members.count);
    } else {
      setMembersCount(null);
    }
  }, [members]);
  return (
    <div className="tw-py-4 tw-flex tw-flex-col tw-h-full tw-gap-y-4 tw-divide-y tw-divide-solid tw-divide-x-0 tw-divide-iron-700">
      <div className="tw-px-4 sm:tw-px-6">
        <div className="tw-flex tw-space-x-4">
          <div className="tw-group tw-w-full tw-relative">
            <input
              type="text"
              id="floating_rep_number"
              autoComplete="off"
              className="tw-form-input tw-block tw-py-3 tw-text-sm tw-px-4 tw-w-full tw-rounded-lg tw-border-0 tw-appearance-none tw-text-white tw-border-iron-650 focus:tw-border-blue-500 tw-peer
      tw-bg-iron-900 hover:tw-bg-iron-800 focus:tw-bg-iron-900 tw-font-medium tw-caret-primary-300 tw-shadow-sm tw-ring-1 tw-ring-inset tw-ring-iron-650 placeholder:tw-text-iron-500 focus:tw-outline-none focus:tw-ring-1 focus:tw-ring-inset focus:tw-ring-primary-400 tw-transition tw-duration-300 tw-ease-out"
              placeholder=" "
            />
            <label
              htmlFor="floating_rep_number"
              className="tw-absolute tw-cursor-text tw-text-sm tw-font-medium tw-text-iron-500 tw-duration-300 tw-transform -tw-translate-y-4 tw-scale-75 tw-top-2 tw-z-[1] tw-origin-[0] tw-bg-iron-900 tw-rounded-lg group-hover:tw-bg-iron-800 peer-focus:tw-bg-iron-900 tw-px-2 peer-focus:tw-px-2 peer-focus:tw-text-primary-400 peer-placeholder-shown:tw-scale-100 
  peer-placeholder-shown:-tw-translate-y-1/2 peer-placeholder-shown:tw-top-1/2 peer-focus:tw-top-2 peer-focus:tw-scale-75 peer-focus:-tw-translate-y-4 rtl:peer-focus:tw-translate-x-1/4 rtl:peer-focus:tw-left-auto tw-start-1"
            >
              Rep
            </label>
          </div>
          <RepCategorySearch
            category={category}
            setCategory={setCategory}
            size={RepCategorySearchSize.SM}
          />
        </div>
        <GroupCardActionStats membersCount={membersCount} />
      </div>
      <GroupCardActionFooter onCancel={onCancel} />
    </div>
  );
}
