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

  const [curationFilters, setCurationFilters] = useState<
    CurationFilterResponse[]
  >([]);
  useEffect(() => {
    if (data) {
      setCurationFilters(
        data.filter((filter) => filter.id !== activeCurationFilterId)
      );
    } else {
      setCurationFilters([]);
    }
  }, [data, activeCurationFilterId]);

  return (
    <div className="tw-mt-4 tw-w-full tw-divide-y tw-space-y-4 tw-divide-solid tw-divide-iron-800 tw-divide-x-0">
      <div className="tw-space-y-4 tw-px-4">
        <CurationBuildFiltersUserSearch
          value={filters.curation_criteria_user}
          setValue={onUserSelect}
          placeholder="Search user"
        />
        <CommunityCurationFiltersSearchFilter
          filterName={filters.curation_criteria_name}
          setFilterName={onFilterNameSearch}
        />
      </div>
      <div className="tw-pt-4 tw-divide-y tw-space-y-4 tw-divide-solid tw-divide-iron-800 tw-divide-x-0">
        {activeCurationFilterId && (
          <CommunityCurationFiltersSelectActiveFilter
            activeCurationFilterId={activeCurationFilterId}
            onEditClick={onEditClick}
          />
        )}
        <div className="tw-pt-4 tw-px-4">
          <p className="tw-text-lg tw-text-iron-50 tw-font-semibold tw-mb-4">
            Created curations
          </p>
          <CommunityCurationFiltersSelectItems
            filters={curationFilters}
            onEditClick={onEditClick}
          />
        </div>
      </div>
    </div>
  );
}
