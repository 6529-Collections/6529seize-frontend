import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { CIC_TO_TEXT, CommunityMemberOverview } from "../../entities/IProfile";
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
import { cicToType, formatNumberWithCommasOrDash } from "../../helpers/Helpers";
import UserLevel from "../user/utils/level/UserLevel";
import UserCICTypeIcon from "../user/utils/user-cic-type/UserCICTypeIcon";
import Tippy from "@tippyjs/react";

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
        <div className="tw-bg-iron-950 tw-overflow-x-auto tw-shadow tw-border tw-border-solid tw-border-iron-700 tw-rounded-lg tw-divide-y tw-divide-solid tw-divide-iron-800">
          <table className="tw-min-w-full">
            <thead className="tw-bg-iron-900 tw-border-b tw-border-x-0 tw-border-t-0 tw-border-iron-700">
              <tr>
                <th
                  scope="col"
                  className="tw-whitespace-nowrap tw-px-4 sm:tw-px-6 tw-py-3 tw-text-left tw-text-md tw-font-medium tw-text-iron-400"
                >
                  Rank
                </th>

                <th
                  scope="col"
                  className="tw-whitespace-nowrap tw-pr-4 sm:tw-pr-6 tw-py-3 tw-text-left tw-text-md tw-font-medium tw-text-iron-400"
                >
                  Profile
                </th>

                <th
                  scope="col"
                  className="tw-px-4 sm:tw-px-6 tw-whitespace-nowrap tw-group tw-cursor-pointer tw-py-3 tw-text-md tw-font-medium tw-text-iron-400"
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
                  className="tw-px-4 sm:tw-px-6 tw-whitespace-nowrap tw-group tw-cursor-pointer tw-py-3 tw-text-right tw-text-md tw-font-medium tw-text-iron-400"
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
                  className="tw-px-4 sm:tw-px-6 tw-whitespace-nowrap tw-group tw-cursor-pointer tw-py-3 tw-text-right tw-text-md tw-font-medium tw-text-iron-400"
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
                  className="tw-px-4 sm:tw-px-6 tw-whitespace-nowrap tw-group tw-cursor-pointer tw-py-3 tw-text-right tw-text-md tw-font-medium tw-text-iron-400"
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
            <tbody className="tw-divide-y tw-divide-solid tw-divide-iron-700">
              {members?.data.map((member, index) => (
                <tr
                  key={member.detail_view_key}
                  className="even:tw-bg-iron-900 tw-cursor-pointer hover:tw-bg-iron-700 tw-transition tw-duration-300 tw-ease-out"
                >
                  <td className="tw-px-4 sm:tw-pl-6 tw-whitespace-nowrap tw-group tw-py-3 tw-text-base tw-font-medium tw-text-iron-500">
                    {index + 1 + members.page * params.page_size}
                  </td>
                  <td className="tw-pr-4 sm:tw-pr-6 tw-whitespace-nowrap tw-group tw-py-3 tw-text-base tw-font-medium tw-text-iron-50">
                    <div className="tw-flex tw-items-center tw-gap-x-4">
                      <img
                        src="https://images.unsplash.com/photo-1519244703995-f4e0f30006d5?ixlib=rb-1.2.1&ixid=eyJhcHBfaWQiOjEyMDd9&auto=format&fit=facearea&facepad=2&w=256&h=256&q=80"
                        alt="Community Table Profile Picture"
                        className="tw-h-8 tw-w-8 tw-rounded-lg tw-ring-1 tw-ring-white/10 tw-bg-iron-800"
                      />
                      <div>{member.display}</div>
                    </div>
                  </td>
                  <td className="tw-px-4 sm:tw-px-6 tw-whitespace-nowrap tw-group tw-py-3 tw-text-base tw-font-medium tw-text-iron-400">
                    <UserLevel level={member.level} size="sm" />
                  </td>
                  <td className="tw-px-4 sm:tw-px-6 tw-text-right tw-whitespace-nowrap tw-group tw-py-3 tw-text-base tw-font-medium tw-text-iron-50">
                    {formatNumberWithCommasOrDash(member.tdh)}
                  </td>
                  <td className="tw-px-4 sm:tw-px-6 tw-text-right tw-whitespace-nowrap tw-group tw-py-3 tw-text-base tw-font-medium tw-text-iron-50">
                    {formatNumberWithCommasOrDash(member.rep)}
                  </td>
                  <td className="tw-px-4 sm:tw-px-6 tw-text-right tw-whitespace-nowrap tw-group tw-py-3 tw-text-base tw-font-medium tw-text-iron-50">
                    <div className="tw-flex tw-items-center tw-justify-end tw-gap-x-2">
                      {formatNumberWithCommasOrDash(member.cic)}
                      <Tippy
                        placement={"auto"}
                        interactive={true}
                        content={CIC_TO_TEXT[cicToType(member.cic)]}
                      >
                        <div className="tw-h-5 tw-w-5">
                          <UserCICTypeIcon cic={member.cic} />
                        </div>
                      </Tippy>
                    </div>
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
          small={false}
          loading={isLoading}
        />
      )}
    </div>
  );
}
