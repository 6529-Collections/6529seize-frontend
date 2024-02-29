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
import CommonTableWrapper from "../utils/table/CommonTableWrapper";
import CommonTableHeader from "../utils/table/CommonTableHeader";

import CommonTableRow from "../utils/table/CommonTableRow";
import { getRandomObjectId } from "../../helpers/AllowlistToolHelpers";
import { formatNumberWithCommasOrDash } from "../../helpers/Helpers";
import CommonTablePagination from "../utils/table/CommonTablePagination";
import CommunityMembersTableHeader from "./CommunityMembersTableHeader";
import { SortDirection } from "../../entities/ISort";

export default function CommunityMembers({
  initialParams,
}: {
  readonly initialParams: CommunityMembersQuery;
}) {
  const [params, setParams] = useState<CommunityMembersQuery>(initialParams);

  const [totalPages, setTotalPages] = useState<number>(1);
  const { isLoading, data: members } = useQuery<Page<CommunityMemberOverview>>({
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
  }, [members?.count, members?.page, isLoading]);

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
      <CommonTableWrapper>
        <CommunityMembersTableHeader
          sort={params.sort}
          sortDirection={params.sort_direction}
          onSortClick={onSort}
        />
        <tbody className="tw-divide-y tw-divide-solid tw-divide-iron-800">
          {members?.data.map((member, i) => (
            <CommonTableRow
              key={member.detail_view_key}
              values={[
                {
                  value: formatNumberWithCommasOrDash(
                    i + 1 + (members.page - 1) * params.page_size
                  ),
                  key: getRandomObjectId(),
                  alignRight: true,
                },
                { value: member.display, key: getRandomObjectId() },
                {
                  value: formatNumberWithCommasOrDash(member.level),
                  key: getRandomObjectId(),
                  alignRight: true,
                },
                {
                  value: formatNumberWithCommasOrDash(member.tdh),
                  key: getRandomObjectId(),
                  alignRight: true,
                },
                {
                  value: formatNumberWithCommasOrDash(member.rep),
                  key: getRandomObjectId(),
                  alignRight: true,
                },
                {
                  value: formatNumberWithCommasOrDash(member.cic),
                  key: getRandomObjectId(),
                  alignRight: true,
                },
              ]}
            />
          ))}
        </tbody>
      </CommonTableWrapper>
      {totalPages > 1 && (
        <CommonTablePagination
          currentPage={params.page}
          setCurrentPage={onPage}
          totalPages={totalPages}
          small={true}
          loading={isLoading}
        />
      )}
    </div>
  );
}
