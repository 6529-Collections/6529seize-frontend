"use client";

import { useState } from "react";
import { QueryKey } from "@/components/react-query-wrapper/ReactQueryWrapper";
import type { GroupsRequestParams } from "@/entities/IGroup";
import type { ApiGroupFull } from "@/generated/models/ApiGroupFull";
import type { Mutable, NonNullableNotRequired } from "@/helpers/Types";
import { commonApiFetch } from "@/services/api/common-api";
import { keepPreviousData, useQuery } from "@tanstack/react-query";
import SelectGroupModalHeader from "./SelectGroupModalHeader";
import SelectGroupModalSearch from "./SelectGroupModalSearch";
import SelectGroupModalItems from "./SelectGroupModalItems";

const DEFAULT_CONTAINER_CLASSES =
  "sm:tw-max-w-md tw-relative tw-w-full tw-transform tw-rounded-xl tw-bg-iron-950 tw-text-left tw-shadow-xl tw-transition-all tw-duration-500";

const DEFAULT_BODY_CLASSES =
  "tw-h-64 tw-overflow-y-auto tw-mt-4 tw-px-4 tw-scrollbar-thin tw-scrollbar-track-iron-800 tw-scrollbar-thumb-iron-500 desktop-hover:hover:tw-scrollbar-thumb-iron-300";

type SelectGroupSearchPanelProps = {
  readonly onClose?: (() => void) | undefined;
  readonly onGroupSelect: (group: ApiGroupFull) => void;
  readonly onGroupClear?: (() => void) | undefined;
  readonly selectedGroupId?: string | null | undefined;
  readonly containerClassName?: string | undefined;
  readonly bodyClassName?: string | undefined;
  readonly showHeader?: boolean | undefined;
  readonly useDefaultContainerStyles?: boolean | undefined;
  readonly useDefaultBodyStyles?: boolean | undefined;
  readonly showIdentitySearch?: boolean | undefined;
  readonly requireSearchQuery?: boolean | undefined;
  readonly idleStateMessage?: string | undefined;
  readonly emptyStateMessage?: string | undefined;
};

export default function SelectGroupSearchPanel({
  onClose,
  onGroupSelect,
  onGroupClear,
  selectedGroupId,
  containerClassName,
  bodyClassName,
  showHeader = true,
  useDefaultContainerStyles = true,
  useDefaultBodyStyles = true,
  showIdentitySearch = true,
  requireSearchQuery = false,
  idleStateMessage,
  emptyStateMessage,
}: SelectGroupSearchPanelProps) {
  const handleClose = onClose ?? (() => {});
  const containerClasses = [
    useDefaultContainerStyles ? DEFAULT_CONTAINER_CLASSES : null,
    containerClassName,
  ]
    .filter(Boolean)
    .join(" ");

  const bodyClasses = [
    useDefaultBodyStyles ? DEFAULT_BODY_CLASSES : null,
    bodyClassName,
  ]
    .filter(Boolean)
    .join(" ");

  const [filters, setFilters] = useState<GroupsRequestParams>({
    group_name: null,
    author_identity: null,
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

  const trimmedGroupName = filters.group_name?.trim() ?? "";
  const trimmedAuthorIdentity = filters.author_identity?.trim() ?? "";
  const hasGroupNameFilter = trimmedGroupName.length > 0;
  const hasUserFilter = showIdentitySearch && trimmedAuthorIdentity.length > 0;
  const isQueryEnabled = requireSearchQuery
    ? hasGroupNameFilter || hasUserFilter
    : true;

  const { data, isFetching } = useQuery<ApiGroupFull[]>({
    queryKey: [QueryKey.GROUPS, filters],
    queryFn: async () => {
      const params: Mutable<NonNullableNotRequired<GroupsRequestParams>> = {};
      if (hasGroupNameFilter) {
        params.group_name = trimmedGroupName;
      }
      if (showIdentitySearch && trimmedAuthorIdentity.length > 0) {
        params.author_identity = trimmedAuthorIdentity;
      }

      return await commonApiFetch<
        ApiGroupFull[],
        NonNullableNotRequired<GroupsRequestParams>
      >({
        endpoint: "groups",
        params,
      });
    },
    placeholderData: keepPreviousData,
    enabled: isQueryEnabled,
  });

  const groups = isQueryEnabled ? (data ?? []) : [];
  const resolvedEmptyStateMessage = isQueryEnabled
    ? emptyStateMessage
    : (idleStateMessage ?? emptyStateMessage);

  return (
    <div className={containerClasses}>
      {showHeader && <SelectGroupModalHeader onClose={handleClose} />}
      <SelectGroupModalSearch
        groupName={filters.group_name}
        groupUser={filters.author_identity}
        onUserSelect={onUserSelect}
        onFilterNameSearch={onFilterNameSearch}
        showIdentitySearch={showIdentitySearch}
      />
      <div className={bodyClasses}>
        <SelectGroupModalItems
          groups={groups}
          selectedGroupId={selectedGroupId ?? null}
          loading={isFetching}
          onGroupSelect={onGroupSelect}
          onGroupClear={onGroupClear}
          emptyStateMessage={resolvedEmptyStateMessage}
        />
      </div>
    </div>
  );
}
