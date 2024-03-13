import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { CurationFilterResponse } from "../../../helpers/filters/Filters.types";
import { QueryKey } from "../../react-query-wrapper/ReactQueryWrapper";
import { commonApiFetch } from "../../../services/api/common-api";
import CommunityCurationFiltersSelectItemsItem from "./item/CommunityCurationFiltersSelectItemsItem";

export default function CommunityCurationFiltersSelectActiveFilter({
  activeCurationFilterId,
  onEditClick,
}: {
  readonly activeCurationFilterId: string;
  readonly onEditClick: (filter: CurationFilterResponse) => void;
}) {
  const { data } = useQuery<CurationFilterResponse>({
    queryKey: [QueryKey.CURATION_FILTER, activeCurationFilterId],
    queryFn: async () =>
      await commonApiFetch<CurationFilterResponse>({
        endpoint: `community-members-curation/${activeCurationFilterId}`,
      }),
    placeholderData: keepPreviousData,
  });
  if (!data) {
    return <div className="tw-px-4 tw-text-sm tw-text-iron-400 tw-text-normal">Loading...</div>;
  }
  return (
    <CommunityCurationFiltersSelectItemsItem
      key={data.id}
      filter={data}
      onEditClick={onEditClick}
    />
  );
}
