import { useState } from "react";
import { GeneralFilter } from "../../../../helpers/filters/Filters.types";
import CurationBuildFilterStatementsList from "../../filter-builder/statements/CurationBuildFilterStatementsList";

export default function CommunityCurationFiltersSelectItemsItemFilters({
  showFilters,
  filters,
}: {
  readonly showFilters: boolean;
  readonly filters: GeneralFilter;
}) {
  return (
    <div className="tw-w-full">
      <div
        className={`${
          showFilters
            ? "tw-h-[200px] tw-overflow-scroll"
            : "tw-h-0 tw-overflow-hidden"
        }   tw-bg-slate-300  tw-transition-[height] tw-duration-1000 tw-ease-in-out`}
      >
        <CurationBuildFilterStatementsList filters={filters} />;
      </div>
    </div>
  );
}
