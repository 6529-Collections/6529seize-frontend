import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { CurationFilterResponse } from "../../../helpers/filters/Filters.types";
import { QueryKey } from "../../react-query-wrapper/ReactQueryWrapper";
import { commonApiFetch } from "../../../services/api/common-api";
import CommunityCurationFiltersSelectItemsItem from "./item/CommunityCurationFiltersSelectItemsItem";
import { AnimatePresence } from "framer-motion";
import { CommunityMemberOverview } from "../../../entities/IProfile";
import { Page } from "../../../helpers/Types";
import {
  CommunityMembersQuery,
  CommunityMembersSortOption,
} from "../../../pages/community";
import { SortDirection } from "../../../entities/ISort";
import { useEffect, useState } from "react";

export default function CommunityCurationFiltersSelectActiveFilter({
  activeCurationFilterId,
  onEditClick,
}: {
  readonly activeCurationFilterId: string;
  readonly onEditClick: (filter: CurationFilterResponse) => void;
}) {
  const { data } = useQuery<CurationFilterResponse>({
    queryKey: [QueryKey.CURATION_FILTER, activeCurationFilterId],
    queryFn: async () =>
      await commonApiFetch<CurationFilterResponse>({
        endpoint: `community-members-curation/${activeCurationFilterId}`,
      }),
    placeholderData: keepPreviousData,
  });

  const {
    isLoading,
    isFetching,
    data: members,
  } = useQuery<Page<CommunityMemberOverview>>({
    queryKey: [
      QueryKey.COMMUNITY_MEMBERS_TOP,
      {
        page: 1,
        page_size: 1,
        sort: CommunityMembersSortOption.LEVEL,
        sort_direction: SortDirection.DESC,
        curation_criteria_id: activeCurationFilterId,
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
          curation_criteria_id: activeCurationFilterId,
        },
      }),
    placeholderData: keepPreviousData,
    enabled: !!activeCurationFilterId,
  });

  const [membersCount, setMembersCount] = useState<number | null>(null);

  useEffect(() => {
    if (members) {
      setMembersCount(members.count);
    }
  }, [members]);

  if (!data) {
    return <div className="tw-px-4 tw-text-md tw-text-iron-400 tw-font-normal">Loading...</div>;
  }
  return (
    <div className="tw-px-4 tw-pt-4">
      {typeof membersCount === "number" && (
        <p className="tw-whitespace-nowrap tw-text-xs tw-font-medium tw-text-iron-400 tw-m.4">
          Members: {membersCount}
        </p>
      )}

      <CommunityCurationFiltersSelectItemsItem
        key={data.id}
        filter={data}
        membersCount={membersCount}
        onEditClick={onEditClick}
      />
    </div>
  );
}
