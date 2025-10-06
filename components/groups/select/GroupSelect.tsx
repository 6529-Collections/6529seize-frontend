"use client";

import { keepPreviousData, useInfiniteQuery } from "@tanstack/react-query";
import { Mutable, NonNullableNotRequired } from "@/helpers/Types";
import { useContext, useEffect, useState } from "react";
import { commonApiFetch } from "@/services/api/common-api";

import GroupItems from "./GroupItems";
import { useSelector } from "react-redux";
import { selectActiveGroupId } from "@/store/groupSlice";
import GroupsSelectActiveGroup from "./GroupsSelectActiveGroup";
import { ApiGroupFull } from "@/generated/models/ApiGroupFull";
import { GroupsRequestParams } from "@/entities/IGroup";
import IdentitySearch, {
  IdentitySearchSize,
} from "@/components/utils/input/identity/IdentitySearch";
import { useDebounce } from "react-use";
import { AuthContext } from "@/components/auth/Auth";
import { QueryKey } from "@/components/react-query-wrapper/ReactQueryWrapper";
export default function GroupSelect() {
  const activeGroupId = useSelector(selectActiveGroupId);
  const { connectedProfile, activeProfileProxy } = useContext(AuthContext);
  const [filters, setFilters] = useState<GroupsRequestParams>({
    group_name: null,
    author_identity: null,
  });

  const [debouncedFilters, setDebouncedFilters] =
    useState<GroupsRequestParams>(filters);

  useDebounce(() => setDebouncedFilters(filters), 200, [filters]);

  const { data } = useInfiniteQuery({
    queryKey: [QueryKey.GROUPS_INFINITE, debouncedFilters],
    queryFn: async ({ pageParam }: { pageParam: number | null }) => {
      const params: Mutable<NonNullableNotRequired<GroupsRequestParams>> = {};
      if (debouncedFilters.group_name) {
        params.group_name = debouncedFilters.group_name;
      }
      if (debouncedFilters.author_identity) {
        params.author_identity = debouncedFilters.author_identity;
      }

      if (pageParam) {
        params.created_at_less_than = `${pageParam}`;
      }
      return await commonApiFetch<
        ApiGroupFull[],
        NonNullableNotRequired<GroupsRequestParams>
      >({
        endpoint: "groups",
        params,
      });
    },
    initialPageParam: null,
    getNextPageParam: (lastPage) => lastPage.at(-1)?.created_at ?? null,
    placeholderData: keepPreviousData,
  });

  const onUserSelect = (value: string | null) => {
    setFilters((prev) => ({
      ...prev,
      author_identity: value,
    }));
  };

  const onFilterNameSearch = (value: string | null) => {
    setFilters((prev) => ({
      ...prev,
      group_name: value,
    }));
  };

  const [groups, setGroups] = useState<ApiGroupFull[]>([]);

  useEffect(() => setGroups(data?.pages?.flat() ?? []), [data, activeGroupId]);

  const onShowMyGroups = () => {
    const handle =
      activeProfileProxy?.created_by.handle ?? connectedProfile?.handle ?? null;
    if (!handle) return;
    onUserSelect(handle);
  };

  return (
    <div className="tw-mt-4 tw-w-full tw-border-t tw-border-solid tw-border-iron-800 tw-border-x-0 tw-border-b-0 tw-divide-y tw-space-y-4 tw-divide-solid tw-divide-iron-800 tw-divide-x-0">
      {activeGroupId && (
        <GroupsSelectActiveGroup activeGroupId={activeGroupId} />
      )}
      <div className="tw-px-4 tw-pt-3">
        <p className="tw-text-base tw-text-iron-50 tw-font-semibold tw-mb-3">
          Search Groups
        </p>
        <div className="tw-space-y-3">
          {!!connectedProfile?.handle && (
            <button
              onClick={onShowMyGroups}
              type="button"
              className="tw-text-sm tw-font-semibold tw-inline-flex tw-items-center tw-rounded-lg tw-bg-iron-800 tw-px-2 tw-py-1.5 tw-text-iron-300 focus:tw-outline-none focus:tw-ring-1 focus:tw-ring-inset tw-border-0 tw-ring-1 tw-ring-inset tw-ring-iron-700 hover:tw-bg-iron-700 focus:tw-z-10 tw-transition tw-duration-300 tw-ease-out">
              My groups
            </button>
          )}
          <IdentitySearch
            identity={filters.author_identity}
            setIdentity={onUserSelect}
            size={IdentitySearchSize.SM}
            label="By Identity"
          />
          <div className="tw-group tw-w-full tw-relative">
            <input
              type="text"
              id="floating-sidebar-group-name"
              value={filters.group_name ?? ""}
              onChange={(e) => onFilterNameSearch(e.target.value)}
              autoComplete="off"
              className="tw-py-3 tw-text-sm tw-form-input tw-block tw-pl-10 tw-pr-4 tw-w-full tw-rounded-lg tw-border-0 tw-appearance-none tw-text-white tw-border-iron-650 focus:tw-border-blue-500 tw-peer
      tw-bg-iron-900 hover:tw-bg-iron-800 focus:tw-bg-iron-900 tw-font-medium tw-caret-primary-300 tw-shadow-sm tw-ring-1 tw-ring-inset tw-ring-iron-650 placeholder:tw-text-iron-500 focus:tw-outline-none focus:tw-ring-1 focus:tw-ring-inset focus:tw-ring-primary-400 tw-transition tw-duration-300 tw-ease-out"
              placeholder=" "
            />
            {!!filters.group_name?.length && (
              <svg
                onClick={() => onFilterNameSearch(null)}
                className="tw-top-3.5 tw-cursor-pointer tw-absolute tw-right-3 tw-h-5 tw-w-5 tw-text-iron-300"
                viewBox="0 0 24 24"
                fill="none"
                xmlns="http://www.w3.org/2000/svg">
                <path
                  d="M17 7L7 17M7 7L17 17"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            )}
            <svg
              className="tw-pointer-events-none tw-absolute tw-left-3 tw-top-3 tw-h-5 tw-w-5 tw-text-iron-300"
              viewBox="0 0 20 20"
              fill="currentColor"
              aria-hidden="true">
              <path
                fillRule="evenodd"
                d="M9 3.5a5.5 5.5 0 100 11 5.5 5.5 0 000-11zM2 9a7 7 0 1112.452 4.391l3.328 3.329a.75.75 0 11-1.06 1.06l-3.329-3.328A7 7 0 012 9z"
                clipRule="evenodd"></path>
            </svg>
            <label
              htmlFor="floating-sidebar-group-name"
              className="tw-absolute tw-cursor-text tw-text-sm tw-font-medium tw-text-iron-500 tw-duration-300 tw-transform -tw-translate-y-4 tw-scale-75 tw-top-2 tw-z-[1] tw-origin-[0] tw-bg-iron-900 tw-rounded-lg group-hover:tw-bg-iron-800 peer-focus:tw-bg-iron-900 tw-ml-7 tw-px-2 peer-focus:tw-px-2 peer-focus:tw-text-primary-400 peer-placeholder-shown:tw-scale-100 
                        peer-placeholder-shown:-tw-translate-y-1/2 peer-placeholder-shown:tw-top-1/2 peer-focus:tw-top-2 peer-focus:tw-scale-75 peer-focus:-tw-translate-y-4 rtl:peer-focus:tw-translate-x-1/4 rtl:peer-focus:tw-left-auto tw-start-1">
              By Group Name
            </label>
          </div>
        </div>
        <div className="tw-divide-y tw-space-y-4 tw-divide-solid tw-divide-iron-800 tw-divide-x-0">
          <div className="tw-pt-4">
            <GroupItems groups={groups} />
          </div>
        </div>
      </div>
    </div>
  );
}
