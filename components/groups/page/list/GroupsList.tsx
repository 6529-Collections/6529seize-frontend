import { useState } from "react";
import { GroupsRequestParams } from "../../../../entities/IGroup";
import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { GroupFull } from "../../../../generated/models/GroupFull";
import { QueryKey } from "../../../react-query-wrapper/ReactQueryWrapper";
import { Mutable, NonNullableNotRequired } from "../../../../helpers/Types";
import { commonApiFetch } from "../../../../services/api/common-api";
import GroupCard from "./card/GroupCard";

export default function GroupsList() {
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
  return (
    <div className="tw-mt-8 tw-grid tw-grid-cols-2 tw-gap-8">
      {data?.map((group) => (
        <GroupCard key={group.id} group={group} />
      ))}
    </div>
  );
}
