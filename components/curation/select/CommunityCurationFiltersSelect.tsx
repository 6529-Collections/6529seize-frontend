import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { CurationFilterResponse } from "../../../helpers/filters/Filters.types";
import { Mutable, NonNullableNotRequired, Page } from "../../../helpers/Types";
import { useEffect, useState } from "react";
import { QueryKey } from "../../react-query-wrapper/ReactQueryWrapper";
import { commonApiFetch } from "../../../services/api/common-api";
import CurationBuildFiltersUserSearch from "../filter-builder/common/user-search/CurationBuildFiltersUserSearch";
import CommunityCurationFiltersSearchFilter from "./CommunityCurationFiltersSearchFilter";
import CommunityCurationFiltersSelectItems from "./CommunityCurationFiltersSelectItems";
import { useSelector } from "react-redux";
import { selectActiveCurationFilterId } from "../../../store/curationFilterSlice";
import CommunityCurationFiltersSelectActiveFilter from "./CommunityCurationFiltersSelectActiveFilter";

interface CurationFilterRequestParams {
  readonly curation_criteria_name: string | null;
  readonly curation_criteria_user: string | null;
}

export default function CommunityCurationFiltersSelect({
  onEditClick,
}: {
  readonly onEditClick: (filter: CurationFilterResponse) => void;
}) {
  const activeCurationFilterId = useSelector(selectActiveCurationFilterId);

  const [filters, setFilters] = useState<CurationFilterRequestParams>({
    curation_criteria_name: null,
    curation_criteria_user: null,
  });

  const { data } = useQuery<CurationFilterResponse[]>({
    queryKey: [QueryKey.CURATION_FILTERS, filters],
    queryFn: async () => {
      const params: Mutable<
        NonNullableNotRequired<CurationFilterRequestParams>
      > = {};
      if (filters.curation_criteria_name) {
        params.curation_criteria_name = filters.curation_criteria_name;
      }
      if (filters.curation_criteria_user) {
        params.curation_criteria_user = filters.curation_criteria_user;
      }

      return await commonApiFetch<
        CurationFilterResponse[],
        NonNullableNotRequired<CurationFilterRequestParams>
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

  return (
    <div className="tw-mt-8 tw-w-full tw-space-y-4">
      {activeCurationFilterId && (
        <CommunityCurationFiltersSelectActiveFilter
          activeCurationFilterId={activeCurationFilterId}
          onEditClick={onEditClick}
        />
      )}
      <CurationBuildFiltersUserSearch
        value={filters.curation_criteria_user}
        setValue={onUserSelect}
        placeholder="Search user"
      />
      <CommunityCurationFiltersSearchFilter
        filterName={filters.curation_criteria_name}
        setFilterName={onFilterNameSearch}
      />
      <CommunityCurationFiltersSelectItems
        filters={data ?? []}
        onEditClick={onEditClick}
      />
    </div>
  );
}
