import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { CommunityMemberOverview } from "../../entities/IProfile";
import { Page } from "../../helpers/Types";
import {
  CommunityMembersQuery,
  CommunityMembersSortOption,
} from "../../pages/community";
import { QueryKey } from "../react-query-wrapper/ReactQueryWrapper";
import { useEffect, useState } from "react";
import { commonApiFetch } from "../../services/api/common-api";
import CommonTablePagination from "../utils/table/CommonTablePagination";
import { SortDirection } from "../../entities/ISort";
import CommunityMembersTable from "./members-table/CommunityMembersTable";

export default function CommunityMembers({
  initialParams,
}: {
  readonly initialParams: CommunityMembersQuery;
}) {
  const [params, setParams] = useState<CommunityMembersQuery>(initialParams);

  const [totalPages, setTotalPages] = useState<number>(1);
  const {
    isLoading,
    isFetching,
    data: members,
  } = useQuery<Page<CommunityMemberOverview>>({
    queryKey: [QueryKey.COMMUNITY_MEMBERS_TOP, params],
    queryFn: async () =>
      await commonApiFetch<
        Page<CommunityMemberOverview>,
        CommunityMembersQuery
      >({
        endpoint: `community-members/top`,
        params: params,
      }),
    placeholderData: keepPreviousData,
  });

  useEffect(() => {
    if (isLoading) return;
    if (!members?.count) {
      setParams((prev) => ({ ...prev, page: 1 }));
      setTotalPages(1);
      return;
    }
    setTotalPages(Math.ceil(members.count / initialParams.page_size));
  }, [members?.count, isLoading]);

  const onPage = (page: number) =>
    setParams((prev) => ({ ...prev, page: page }));

  const onSort = (sort: CommunityMembersSortOption) =>
    setParams((prev) => ({
      ...prev,
      sort: sort,
      sort_direction:
        sort === params.sort
          ? params.sort_direction === SortDirection.ASC
            ? SortDirection.DESC
            : SortDirection.ASC
          : SortDirection.DESC,
    }));

  return (
    <div className="tw-scroll-py-3 tw-overflow-auto">
      <div className="tailwind-scope tw-mt-2 lg:tw-mt-4 tw-flow-root">
        <div className="tw-bg-iron-950 tw-overflow-x-auto tw-shadow tw-border tw-border-solid tw-border-iron-700 tw-rounded-lg tw-divide-y tw-divide-solid tw-divide-iron-800">
          <CommunityMembersTable
            members={members?.data || []}
            activeSort={params.sort}
            sortDirection={params.sort_direction}
            page={params.page}
            pageSize={params.page_size}
            isLoading={isFetching}
            onSort={onSort}
          />
        </div>
      </div>
      {totalPages > 1 && (
        <CommonTablePagination
          currentPage={params.page}
          setCurrentPage={onPage}
          totalPages={totalPages}
          small={false}
          loading={isLoading}
        />
      )}
    </div>
  );
}
