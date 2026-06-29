"use client";

import { keepPreviousData, useInfiniteQuery } from "@tanstack/react-query";
import type { Mutable, NonNullableNotRequired } from "@/helpers/Types";
import { useContext, useEffect, useState } from "react";
import { commonApiFetch } from "@/services/api/common-api";

import GroupItems from "./GroupItems";
import { useSelector } from "react-redux";
import { selectActiveGroupId } from "@/store/groupSlice";
import GroupsSelectActiveGroup from "./GroupsSelectActiveGroup";
import type { ApiGroupFull } from "@/generated/models/ApiGroupFull";
import type { GroupsRequestParams } from "@/entities/IGroup";
import IdentitySearch, {
  IdentitySearchSize,
} from "@/components/utils/input/identity/IdentitySearch";
import { useDebounce } from "react-use";
import { AuthContext } from "@/components/auth/Auth";
import { QueryKey } from "@/components/react-query-wrapper/ReactQueryWrapper";
import type { GroupSelectVariant } from "./groupSelect.types";
import { MagnifyingGlassIcon, XMarkIcon } from "@heroicons/react/24/outline";

const MOBILE_GROUP_NAME_INPUT_ID = "mobile-sheet-group-name";

function MobileMyGroupsButton({
  isActive,
  onClick,
}: {
  readonly isActive: boolean;
  readonly onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      type="button"
      className={`tw-inline-flex tw-min-h-9 tw-items-center tw-rounded-full tw-border tw-border-solid tw-px-4 tw-text-[11px] tw-font-bold tw-transition tw-duration-200 tw-ease-out focus:tw-outline-none focus:tw-ring-2 focus:tw-ring-primary-400/40 ${
        isActive
          ? "tw-border-[#ECECEE] tw-bg-[#ECECEE] tw-text-[#131316]"
          : "tw-border-[#37373E] tw-bg-transparent tw-text-[#93939F] desktop-hover:hover:tw-border-[#848490] desktop-hover:hover:tw-text-[#F5F5F5]"
      }`}
    >
      My groups
    </button>
  );
}

function MobileGroupNameSearch({
  value,
  onChange,
}: {
  readonly value: string | null | undefined;
  readonly onChange: (value: string | null) => void;
}) {
  return (
    <div className="tw-group tw-relative tw-w-full">
      <input
        type="text"
        id={MOBILE_GROUP_NAME_INPUT_ID}
        value={value ?? ""}
        onChange={(e) => onChange(e.target.value)}
        autoComplete="off"
        className="tw-peer tw-form-input tw-block tw-w-full tw-appearance-none tw-rounded-lg tw-border-0 tw-border-iron-700 tw-bg-iron-900 tw-py-3 tw-pl-9 tw-pr-10 tw-text-base tw-font-medium tw-text-white tw-shadow-sm tw-ring-1 tw-ring-inset tw-ring-iron-700 tw-transition tw-duration-300 tw-ease-out placeholder:tw-text-iron-500 hover:tw-ring-iron-650 focus:tw-border-blue-500 focus:tw-bg-iron-900 focus:tw-outline-none focus:tw-ring-1 focus:tw-ring-inset focus:tw-ring-primary-400 sm:tw-text-sm"
        placeholder=" "
      />
      {(value?.length ?? 0) > 0 && (
        <button
          type="button"
          aria-label="Clear group name"
          onClick={() => onChange(null)}
          className="tw-absolute tw-right-3 tw-top-1/2 tw-flex tw-h-5 tw-w-5 -tw-translate-y-1/2 tw-items-center tw-justify-center tw-rounded-full tw-border-0 tw-bg-transparent tw-p-0 tw-text-iron-400 tw-transition tw-duration-300 tw-ease-out hover:tw-text-error focus:tw-outline-none focus:tw-ring-0"
        >
          <XMarkIcon className="tw-size-4" aria-hidden="true" />
        </button>
      )}
      <MagnifyingGlassIcon
        className="tw-pointer-events-none tw-absolute tw-left-3 tw-top-1/2 tw-h-4 tw-w-4 -tw-translate-y-1/2 tw-text-iron-300"
        aria-hidden="true"
      />
      <label
        htmlFor={MOBILE_GROUP_NAME_INPUT_ID}
        className="tw-absolute tw-start-1 tw-top-2 tw-z-10 tw-ml-6 tw-origin-[0] -tw-translate-y-4 tw-scale-75 tw-transform tw-cursor-text tw-rounded-lg tw-bg-iron-900 tw-px-2 tw-text-sm tw-font-medium tw-text-iron-500 tw-duration-300 peer-placeholder-shown:tw-top-1/2 peer-placeholder-shown:-tw-translate-y-1/2 peer-placeholder-shown:tw-scale-100 peer-focus:tw-top-2 peer-focus:-tw-translate-y-4 peer-focus:tw-scale-75 peer-focus:tw-bg-iron-900 peer-focus:tw-px-2 peer-focus:tw-text-primary-400 rtl:peer-focus:tw-left-auto rtl:peer-focus:tw-translate-x-1/4"
      >
        Group name
      </label>
    </div>
  );
}

function MobileGroupSearchControls({
  authorIdentity,
  groupName,
  showMyGroups,
  isMyGroupsActive,
  onShowMyGroups,
  onUserSelect,
  onFilterNameSearch,
}: {
  readonly authorIdentity: string | null | undefined;
  readonly groupName: string | null | undefined;
  readonly showMyGroups: boolean;
  readonly isMyGroupsActive: boolean;
  readonly onShowMyGroups: () => void;
  readonly onUserSelect: (value: string | null) => void;
  readonly onFilterNameSearch: (value: string | null) => void;
}) {
  return (
    <>
      <div className="tw-mb-3 tw-flex tw-items-center tw-justify-between tw-gap-3">
        <p className="tw-mb-0 tw-text-[11px] tw-font-bold tw-uppercase tw-tracking-widest tw-text-[#93939F]">
          Find group
        </p>
        {showMyGroups && (
          <MobileMyGroupsButton
            isActive={isMyGroupsActive}
            onClick={onShowMyGroups}
          />
        )}
      </div>
      <div className="tw-space-y-3">
        <IdentitySearch
          identity={authorIdentity ?? null}
          setIdentity={onUserSelect}
          size={IdentitySearchSize.SM}
          label="Identity"
          iconPositionClassName="tw-top-1/2 -tw-translate-y-1/2"
        />
        <MobileGroupNameSearch
          value={groupName}
          onChange={onFilterNameSearch}
        />
      </div>
    </>
  );
}

export default function GroupSelect({
  variant = "default",
}: {
  readonly variant?: GroupSelectVariant | undefined;
}) {
  const activeGroupId = useSelector(selectActiveGroupId);
  const { connectedProfile, activeProfileProxy } = useContext(AuthContext);
  const isMobileSheet = variant === "mobile-sheet";
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

  const myGroupsHandle =
    activeProfileProxy?.created_by.handle ?? connectedProfile?.handle ?? null;

  const onShowMyGroups = () => {
    if (!myGroupsHandle) return;
    onUserSelect(myGroupsHandle);
  };

  const isMyGroupsActive =
    !!myGroupsHandle &&
    filters.author_identity?.toLowerCase() === myGroupsHandle.toLowerCase();

  if (isMobileSheet) {
    return (
      <div className="tw-mt-0 tw-w-full">
        {activeGroupId && (
          <GroupsSelectActiveGroup
            activeGroupId={activeGroupId}
            variant={variant}
          />
        )}
        <div className="tw-px-4 tw-pt-6">
          <MobileGroupSearchControls
            authorIdentity={filters.author_identity}
            groupName={filters.group_name}
            showMyGroups={!!myGroupsHandle}
            isMyGroupsActive={isMyGroupsActive}
            onShowMyGroups={onShowMyGroups}
            onUserSelect={onUserSelect}
            onFilterNameSearch={onFilterNameSearch}
          />
          <div className="tw-pt-5">
            <GroupItems groups={groups} variant={variant} />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="tw-mt-4 tw-w-full tw-space-y-4 tw-divide-x-0 tw-divide-y tw-divide-solid tw-divide-iron-800 tw-border-x-0 tw-border-b-0 tw-border-t tw-border-solid tw-border-iron-800">
      {activeGroupId && (
        <GroupsSelectActiveGroup activeGroupId={activeGroupId} />
      )}
      <div className="tw-px-4 tw-pt-3">
        <p className="tw-mb-3 tw-text-base tw-font-semibold tw-text-iron-50">
          Search Groups
        </p>
        <div className="tw-space-y-3">
          {!!connectedProfile?.handle && (
            <button
              onClick={onShowMyGroups}
              type="button"
              className="tw-inline-flex tw-items-center tw-rounded-lg tw-border-0 tw-bg-iron-800 tw-px-2 tw-py-1.5 tw-text-sm tw-font-semibold tw-text-iron-300 tw-ring-1 tw-ring-inset tw-ring-iron-700 tw-transition tw-duration-300 tw-ease-out hover:tw-bg-iron-700 focus:tw-z-10 focus:tw-outline-none focus:tw-ring-1 focus:tw-ring-inset"
            >
              My groups
            </button>
          )}
          <IdentitySearch
            identity={filters.author_identity}
            setIdentity={onUserSelect}
            size={IdentitySearchSize.SM}
            label="By Identity"
          />
          <div className="tw-group tw-relative tw-w-full">
            <input
              type="text"
              id="floating-sidebar-group-name"
              value={filters.group_name ?? ""}
              onChange={(e) => onFilterNameSearch(e.target.value)}
              autoComplete="off"
              className="tw-peer tw-form-input tw-block tw-w-full tw-appearance-none tw-rounded-lg tw-border-0 tw-border-iron-650 tw-bg-iron-900 tw-py-3 tw-pl-10 tw-pr-4 tw-text-sm tw-font-medium tw-text-white tw-caret-primary-300 tw-shadow-sm tw-ring-1 tw-ring-inset tw-ring-iron-650 tw-transition tw-duration-300 tw-ease-out placeholder:tw-text-iron-500 hover:tw-bg-iron-800 focus:tw-border-blue-500 focus:tw-bg-iron-900 focus:tw-outline-none focus:tw-ring-1 focus:tw-ring-inset focus:tw-ring-primary-400"
              placeholder=" "
            />
            {!!filters.group_name?.length && (
              <svg
                onClick={() => onFilterNameSearch(null)}
                className="tw-absolute tw-right-3 tw-top-3.5 tw-h-5 tw-w-5 tw-cursor-pointer tw-text-iron-300"
                viewBox="0 0 24 24"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
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
              aria-hidden="true"
            >
              <path
                fillRule="evenodd"
                d="M9 3.5a5.5 5.5 0 100 11 5.5 5.5 0 000-11zM2 9a7 7 0 1112.452 4.391l3.328 3.329a.75.75 0 11-1.06 1.06l-3.329-3.328A7 7 0 012 9z"
                clipRule="evenodd"
              ></path>
            </svg>
            <label
              htmlFor="floating-sidebar-group-name"
              className="tw-absolute tw-start-1 tw-top-2 tw-z-[1] tw-ml-7 tw-origin-[0] -tw-translate-y-4 tw-scale-75 tw-transform tw-cursor-text tw-rounded-lg tw-bg-iron-900 tw-px-2 tw-text-sm tw-font-medium tw-text-iron-500 tw-duration-300 group-hover:tw-bg-iron-800 peer-placeholder-shown:tw-top-1/2 peer-placeholder-shown:-tw-translate-y-1/2 peer-placeholder-shown:tw-scale-100 peer-focus:tw-top-2 peer-focus:-tw-translate-y-4 peer-focus:tw-scale-75 peer-focus:tw-bg-iron-900 peer-focus:tw-px-2 peer-focus:tw-text-primary-400 rtl:peer-focus:tw-left-auto rtl:peer-focus:tw-translate-x-1/4"
            >
              By Group Name
            </label>
          </div>
        </div>
        <div className="tw-space-y-4 tw-divide-x-0 tw-divide-y tw-divide-solid tw-divide-iron-800">
          <div className="tw-pt-4">
            <GroupItems groups={groups} />
          </div>
        </div>
      </div>
    </div>
  );
}
