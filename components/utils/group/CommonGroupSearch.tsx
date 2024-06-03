import { useEffect, useState } from "react";
import { GroupsRequestParams } from "../../../entities/IGroup";
import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { QueryKey } from "../../react-query-wrapper/ReactQueryWrapper";
import { Mutable, NonNullableNotRequired } from "../../../helpers/Types";
import { commonApiFetch } from "../../../services/api/common-api";
import CommonProfileSearch from "../input/profile-search/CommonProfileSearch";
import CommonInput from "../input/CommonInput";
import { GroupFull } from "../../../generated/models/GroupFull";

export default function CommonGroupSearch({
  onGroupSelect,
}: {
  readonly onGroupSelect: (group: GroupFull) => void;
}) {
  const [filters, setFilters] = useState<GroupsRequestParams>({
    group_name: null,
    author_identity: null,
  });
  const { data } = useQuery<GroupFull[]>({
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
        GroupFull[],
        NonNullableNotRequired<GroupsRequestParams>
      >({
        endpoint: "groups",
        params,
      });
    },
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

  const [groups, setGroups] = useState<GroupFull[]>([]);
  useEffect(() => {
    if (data) {
      setGroups(data);
    } else {
      setGroups([]);
    }
  }, [data]);

  return (
    <div className="tw-m-4 tw-border tw-border-solid">
      <CommonProfileSearch
        value={filters.author_identity}
        placeholder="Search Profile"
        onProfileSelect={(profile) => onUserSelect(profile?.handle ?? null)}
      />
      <CommonInput
        inputType="text"
        placeholder="Search group"
        value={filters.group_name ?? ""}
        showSearchIcon={true}
        onChange={onFilterNameSearch}
      />
      <ul>
        {groups.map((group) => (
          <li key={group.id}>
            <button onClick={() => onGroupSelect(group)}>{group.name}</button>
          </li>
        ))}
      </ul>
    </div>
  );
}
