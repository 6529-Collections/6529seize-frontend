import { useEffect, useState } from "react";
import { GroupsSearchRequestParams } from "../../../entities/IGroup";
import { CurationFilterResponse } from "../../../helpers/filters/Filters.types";
import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { QueryKey } from "../../react-query-wrapper/ReactQueryWrapper";
import { Mutable, NonNullableNotRequired } from "../../../helpers/Types";
import { commonApiFetch } from "../../../services/api/common-api";
import CommonProfileSearch from "../input/profile-search/CommonProfileSearch";
import CommonInput from "../input/CommonInput";

export default function CommonGroupSearch({
  onGroupSelect,
}: {
  readonly onGroupSelect: (group: CurationFilterResponse) => void;
}) {
  const [filters, setFilters] = useState<GroupsSearchRequestParams>({
    curation_criteria_name: null,
    curation_criteria_user: null,
  });
  const { data } = useQuery<CurationFilterResponse[]>({
    queryKey: [QueryKey.CURATION_FILTERS, filters],
    queryFn: async () => {
      const params: Mutable<NonNullableNotRequired<GroupsSearchRequestParams>> =
        {};
      if (filters.curation_criteria_name) {
        params.curation_criteria_name = filters.curation_criteria_name;
      }
      if (filters.curation_criteria_user) {
        params.curation_criteria_user = filters.curation_criteria_user;
      }

      return await commonApiFetch<
        CurationFilterResponse[],
        NonNullableNotRequired<GroupsSearchRequestParams>
      >({
        endpoint: "community-members-curation",
        params,
      });
    },
    placeholderData: keepPreviousData,
  });

  const onUserSelect = (value: string | null) => {
    setFilters((prev) => ({
      ...prev,
      curation_criteria_user: value,
    }));
  };

  const onFilterNameSearch = (value: string | null) => {
    setFilters((prev) => ({
      ...prev,
      curation_criteria_name: value,
    }));
  };

  const [groups, setGroups] = useState<CurationFilterResponse[]>([]);
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
        value={filters.curation_criteria_user}
        placeholder="Search Profile"
        onProfileSelect={(profile) => onUserSelect(profile?.handle ?? null)}
      />
      <CommonInput
        inputType="text"
        placeholder="Search group"
        value={filters.curation_criteria_name ?? ""}
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
