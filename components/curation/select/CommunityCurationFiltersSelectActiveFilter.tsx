import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { CurationFilterResponse } from "../../../helpers/filters/Filters.types";
import { QueryKey } from "../../react-query-wrapper/ReactQueryWrapper";
import { commonApiFetch } from "../../../services/api/common-api";
import CommunityCurationFiltersSelectItemsItem from "./item/CommunityCurationFiltersSelectItemsItem";
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

  const { data: members } = useQuery<Page<CommunityMemberOverview>>({
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
    return (
      <div className="tw-px-4 tw-text-md tw-text-iron-400 tw-font-normal">
        Loading...
      </div>
    );
  }
  return (
    <div className="tw-px-4 tw-pt-4">
      {typeof membersCount === "number" && (
        <div className="tw-flex tw-items-center tw-gap-x-2 tw-mb-3">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth="1.5"
            stroke="currentColor"
            className="tw-w-5 tw-h-5 tw-flex-shrink-0 tw-text-iron-200"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M18 18.72a9.094 9.094 0 0 0 3.741-.479 3 3 0 0 0-4.682-2.72m.94 3.198.001.031c0 .225-.012.447-.037.666A11.944 11.944 0 0 1 12 21c-2.17 0-4.207-.576-5.963-1.584A6.062 6.062 0 0 1 6 18.719m12 0a5.971 5.971 0 0 0-.941-3.197m0 0A5.995 5.995 0 0 0 12 12.75a5.995 5.995 0 0 0-5.058 2.772m0 0a3 3 0 0 0-4.681 2.72 8.986 8.986 0 0 0 3.74.477m.94-3.197a5.971 5.971 0 0 0-.94 3.197M15 6.75a3 3 0 1 1-6 0 3 3 0 0 1 6 0Zm6 3a2.25 2.25 0 1 1-4.5 0 2.25 2.25 0 0 1 4.5 0Zm-13.5 0a2.25 2.25 0 1 1-4.5 0 2.25 2.25 0 0 1 4.5 0Z"
            />
          </svg>
          <p className="tw-whitespace-nowrap tw-text-xs tw-font-normal tw-text-iron-400 tw-mb-0">
            Members:{" "}
            <span className="tw-pl-1.5 tw-text-iron-50 tw-font-medium">
              {membersCount}
            </span>
          </p>
        </div>
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
