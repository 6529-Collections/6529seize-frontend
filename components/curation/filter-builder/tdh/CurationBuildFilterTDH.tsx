import { useState } from "react";
import { GeneralFilter } from "../../../../helpers/filters/Filters.types";
import CommonInput from "../../../utils/input/CommonInput";
import { convertStringOrNullToNumberOrNull } from "../../../../helpers/Helpers";
import CurationBuildFilterMinMaxValues from "../common/CurationBuildFilterMinMaxValues";

export default function CurationBuildFilterTDH({
  filters,
  setFilters,
}: {
  readonly filters: GeneralFilter;
  readonly setFilters: (filters: GeneralFilter) => void;
}) {
  const setMin = (value: number | null) => {
    setFilters({
      ...filters,
      tdh: {
        ...filters.tdh,
        min: value,
      },
    });
  };

  const setMax = (value: number | null) => {
    setFilters({
      ...filters,
      tdh: { ...filters.tdh, max: value },
    });
  };

  return (
    <CurationBuildFilterMinMaxValues
      min={filters.tdh.min}
      max={filters.tdh.max}
      minPlaceholder="Min TDH"
      maxPlaceholder="Max TDH"
      setMin={setMin}
      setMax={setMax}
    />
  );
}
