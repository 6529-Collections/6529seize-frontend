"use client";

import { useEffect, useState } from "react";
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
  "tw-h-64 tw-overflow-y-auto tw-mt-4 tw-px-4";

type SelectGroupSearchPanelProps = {
  readonly onClose: () => void;
  readonly onGroupSelect: (group: ApiGroupFull) => void;
  readonly containerClassName?: string | undefined;
  readonly bodyClassName?: string | undefined;
};

export default function SelectGroupSearchPanel({
  onClose,
  onGroupSelect,
  containerClassName,
  bodyClassName,
}: SelectGroupSearchPanelProps) {
  const containerClasses = [DEFAULT_CONTAINER_CLASSES, containerClassName]
    .filter(Boolean)
    .join(" ");

  const bodyClasses = [DEFAULT_BODY_CLASSES, bodyClassName]
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

  const { data, isFetching } = useQuery<ApiGroupFull[]>({
    queryKey: [QueryKey.GROUPS, filters],
    queryFn: async () => {
      const params: Mutable<NonNullableNotRequired<GroupsRequestParams>> = {};
      if (filters.group_name) {
        params.group_name = filters.group_name;
      }
      if (filters.author_identity) {
        params.author_identity = filters.author_identity;
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
  });

  const [groups, setGroups] = useState<ApiGroupFull[]>([]);

  useEffect(() => {
    if (data?.length) {
      setGroups(data);
    } else {
      setGroups([]);
    }
  }, [data]);

  return (
    <div className={containerClasses}>
      <SelectGroupModalHeader onClose={onClose} />
      <SelectGroupModalSearch
        groupName={filters.group_name}
        groupUser={filters.author_identity}
        onUserSelect={onUserSelect}
        onFilterNameSearch={onFilterNameSearch}
      />
      <div className={bodyClasses}>
        <SelectGroupModalItems
          groups={groups}
          loading={isFetching}
          onGroupSelect={onGroupSelect}
        />
      </div>
    </div>
  );
}
