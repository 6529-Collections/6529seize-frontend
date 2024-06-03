import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { Mutable, NonNullableNotRequired } from "../../../helpers/Types";
import { useEffect, useState } from "react";
import { QueryKey } from "../../react-query-wrapper/ReactQueryWrapper";
import { commonApiFetch } from "../../../services/api/common-api";
import GroupBuildUserSearch from "../build/common/user-search/GroupBuildUserSearch";

import GroupItems from "./GroupItems";
import { useSelector } from "react-redux";
import { selectActiveGroupId } from "../../../store/groupSlice";
import GroupsSelectActiveGroup from "./GroupsSelectActiveGroup";
import { GroupFull } from "../../../generated/models/GroupFull";
import { GroupsRequestParams } from "../../../entities/IGroup";
import CommonInput from "../../utils/input/CommonInput";

export default function GroupSelect({
  onEditClick,
}: {
  readonly onEditClick: (filter: GroupFull) => void;
}) {
  const activeGroupId = useSelector(selectActiveGroupId);

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
  }, [data, activeGroupId]);

  return (
    <div className="tw-mt-4 tw-w-full tw-border-t tw-border-solid tw-border-iron-800 tw-border-x-0 tw-border-b-0  tw-divide-y tw-space-y-4 tw-divide-solid tw-divide-iron-800 tw-divide-x-0">
      {activeGroupId && (
        <GroupsSelectActiveGroup
          activeGroupId={activeGroupId}
          onEditClick={onEditClick}
        />
      )}
      <div className="tw-px-4 tw-pt-3">
        <p className="tw-text-base tw-text-iron-50 tw-font-semibold tw-mb-3">
          Apply A Group
        </p>
        <div className="tw-space-y-3">
          <GroupBuildUserSearch
            value={filters.author_identity}
            setValue={onUserSelect}
            placeholder="Search by user"
          />
          <CommonInput
            inputType="text"
            placeholder="Search by group name"
            value={filters.group_name ?? ""}
            showSearchIcon={true}
            onChange={onFilterNameSearch}
          />
        </div>
        <div className="tw-divide-y tw-space-y-4 tw-divide-solid tw-divide-iron-800 tw-divide-x-0">
          <div className="tw-pt-4">
            <GroupItems groups={groups} onEditClick={onEditClick} />
          </div>
        </div>
      </div>
    </div>
  );
}
