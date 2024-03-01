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
import CommonTableSortIcon from "../user/utils/icons/CommonTableSortIcon";
import { formatNumberWithCommasOrDash } from "../../helpers/Helpers";

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
      <div className="tailwind-scope tw-mt-2 lg:tw-mt-4 tw-flow-root">
        <div className="tw-bg-iron-900/50 tw-overflow-x-auto tw-shadow tw-ring-1 tw-ring-iron-800 tw-rounded-lg tw-divide-y tw-divide-solid tw-divide-iron-800">
          <table className="tw-min-w-full">
            <thead className="tw-bg-iron-900 tw-border-b tw-border-x-0 tw-border-t-0 tw-border-white/10">
              <tr>
                <th
                  scope="col"
                  className="tw-whitespace-nowrap tw-px-4 sm:tw-px-6 tw-py-3 tw-text-left tw-text-sm tw-font-medium tw-text-iron-400"
                >
                  Rank
                </th>

                <th
                  scope="col"
                  className="tw-whitespace-nowrap tw-px-4 sm:tw-px-6 tw-py-3 tw-text-left tw-text-sm tw-font-medium tw-text-iron-400"
                >
                  Profile
                </th>

                <th
                  scope="col"
                  className="tw-px-4 sm:tw-px-6 tw-whitespace-nowrap tw-group tw-cursor-pointer tw-py-3 tw-text-right tw-text-sm tw-font-medium tw-text-iron-400"
                  onClick={() => onSort(CommunityMembersSortOption.LEVEL)}
                >
                  <span
                    className={`${
                      params.sort === CommunityMembersSortOption.LEVEL
                        ? "tw-text-primary-400"
                        : "group-hover:tw-text-iron-200"
                    } tw-transition tw-duration-300 tw-ease-out`}
                  >
                    Level
                  </span>

                  <CommonTableSortIcon
                    direction={params.sort_direction}
                    isActive={params.sort === CommunityMembersSortOption.LEVEL}
                  />
                </th>
                <th
                  scope="col"
                  className="tw-px-4 sm:tw-px-6 tw-whitespace-nowrap tw-group tw-cursor-pointer tw-py-3 tw-text-right tw-text-sm tw-font-medium tw-text-iron-400"
                  onClick={() => onSort(CommunityMembersSortOption.TDH)}
                >
                  <span
                    className={`${
                      params.sort === CommunityMembersSortOption.TDH
                        ? "tw-text-primary-400"
                        : "group-hover:tw-text-iron-200"
                    } tw-transition tw-duration-300 tw-ease-out`}
                  >
                    TDH
                  </span>

                  <CommonTableSortIcon
                    direction={params.sort_direction}
                    isActive={params.sort === CommunityMembersSortOption.TDH}
                  />
                </th>
                <th
                  scope="col"
                  className="tw-px-4 sm:tw-px-6 tw-whitespace-nowrap tw-group tw-cursor-pointer tw-py-3 tw-text-right tw-text-sm tw-font-medium tw-text-iron-400"
                >
                  <span
                    className={`${
                      params.sort === CommunityMembersSortOption.REP
                        ? "tw-text-primary-400"
                        : "group-hover:tw-text-iron-200"
                    } tw-transition tw-duration-300 tw-ease-out`}
                  >
                    REP
                  </span>

                  <CommonTableSortIcon
                    direction={params.sort_direction}
                    isActive={params.sort === CommunityMembersSortOption.REP}
                  />
                </th>
                <th
                  scope="col"
                  className="tw-px-4 sm:tw-px-6 tw-whitespace-nowrap tw-group tw-cursor-pointer tw-py-3 tw-text-right tw-text-sm tw-font-medium tw-text-iron-400"
                >
                  <span
                    className={`${
                      params.sort === CommunityMembersSortOption.CIC
                        ? "tw-text-primary-400"
                        : "group-hover:tw-text-iron-200"
                    } tw-transition tw-duration-300 tw-ease-out`}
                  >
                    CIC
                  </span>

                  <CommonTableSortIcon
                    direction={params.sort_direction}
                    isActive={params.sort === CommunityMembersSortOption.CIC}
                  />
                </th>
              </tr>
            </thead>
            <tbody className="tw-divide-y tw-divide-solid tw-divide-iron-800">
              {members?.data.map((member, index) => (
                <tr
                  key={member.detail_view_key}
                  className="even:tw-bg-iron-900"
                >
                  <td className="tw-px-4 sm:tw-px-6 lg:tw-pr-4 tw-whitespace-nowrap tw-group tw-py-3 tw-text-sm tw-font-medium tw-text-iron-400">
                    {index + 1 + members.page * params.page_size}
                  </td>
                  <td className="tw-px-4 sm:tw-px-6 lg:tw-pr-4 tw-whitespace-nowrap tw-group tw-py-3 tw-text-sm tw-font-medium tw-text-iron-400">
                    {member.display}
                  </td>
                  <td className="tw-px-4 sm:tw-px-6 lg:tw-pr-4 tw-whitespace-nowrap tw-group tw-py-3 tw-text-sm tw-font-medium tw-text-iron-400">
                    {formatNumberWithCommasOrDash(member.level)}
                  </td>
                  <td className="tw-px-4 sm:tw-px-6 lg:tw-pr-4 tw-whitespace-nowrap tw-group tw-py-3 tw-text-sm tw-font-medium tw-text-iron-400">
                    {formatNumberWithCommasOrDash(member.tdh)}
                  </td>
                  <td className="tw-px-4 sm:tw-px-6 lg:tw-pr-4 tw-whitespace-nowrap tw-group tw-py-3 tw-text-sm tw-font-medium tw-text-iron-400">
                    {formatNumberWithCommasOrDash(member.rep)}
                  </td>
                  <td className="tw-px-4 sm:tw-px-6 lg:tw-pr-4 tw-whitespace-nowrap tw-group tw-py-3 tw-text-sm tw-font-medium tw-text-iron-400">
                    {formatNumberWithCommasOrDash(member.cic)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
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
