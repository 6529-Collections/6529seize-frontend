import { useState } from "react";
import { GroupsRequestParams } from "../../../../entities/IGroup";
import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { GroupFull } from "../../../../generated/models/GroupFull";
import { QueryKey } from "../../../react-query-wrapper/ReactQueryWrapper";
import { Mutable, NonNullableNotRequired } from "../../../../helpers/Types";
import { commonApiFetch } from "../../../../services/api/common-api";
import GroupCard from "./card/GroupCard";
import GroupsListSearch from "./search/GroupsListSearch";
import { useDebounce } from "react-use";

export default function GroupsList() {
  const [filters, setFilters] = useState<GroupsRequestParams>({
    group_name: null,
    author_identity: null,
  });

  const [debouncedFilters, setDebouncedFilters] =
    useState<GroupsRequestParams>(filters);

  useDebounce(() => setDebouncedFilters(filters), 200, [filters]);

  const { data } = useQuery<GroupFull[]>({
    queryKey: [QueryKey.GROUPS, debouncedFilters],
    queryFn: async () => {
      const params: Mutable<NonNullableNotRequired<GroupsRequestParams>> = {};
      if (debouncedFilters.group_name) {
        params.group_name = debouncedFilters.group_name;
      }
      if (debouncedFilters.author_identity) {
        params.author_identity = debouncedFilters.author_identity;
      }

      return await commonApiFetch<
        GroupFull[],
        NonNullableNotRequired<GroupsRequestParams>
      >({
        endpoint: "groups",
        params,
      });
    },
    placeholderData: keepPreviousData,
  });

  const setGroupName = (value: string | null) => {
    setFilters((prev) => ({
      ...prev,
      group_name: value,
    }));
  };

  const setAuthorIdentity = (value: string | null) => {
    setFilters((prev) => ({
      ...prev,
      author_identity: value,
    }));
  };
  return (
    <>
      <GroupsListSearch
        identity={filters.author_identity}
        groupName={filters.group_name}
        setIdentity={setAuthorIdentity}
        setGroupName={setGroupName}
      />
      <div className="tw-mt-4 lg:tw-mt-6 tw-grid tw-grid-cols-1 lg:tw-grid-cols-2 tw-gap-8">
        {data?.map((group) => (
          <GroupCard key={group.id} group={group} />
        ))}
      </div>
    </>
  );
}
