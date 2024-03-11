import { useQuery } from "@tanstack/react-query";
import { CurationFilterResponse } from "../../../helpers/filters/Filters.types";
import { Mutable, NonNullableNotRequired, Page } from "../../../helpers/Types";
import { useState } from "react";
import { QueryKey } from "../../react-query-wrapper/ReactQueryWrapper";
import { commonApiFetch } from "../../../services/api/common-api";

interface CurationFilterRequestParams {
  readonly curation_criteria_name: string | null;
  readonly curation_criteria_user: string | null;
}

export default function CommunityCurationFiltersSelect() {
  const [filters, setFilters] = useState<CurationFilterRequestParams>({
    curation_criteria_name: null,
    curation_criteria_user: null,
  });

  const { data } = useQuery<Page<CurationFilterResponse>>({
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
        Page<CurationFilterResponse>,
        NonNullableNotRequired<CurationFilterRequestParams>
      >({
        endpoint: "community-members-curation",
        params,
      });
    },
  });

  return (
    <div className="tw-mt-8 tw-w-full tw-space-y-4">{JSON.stringify(data)}</div>
  );
}
