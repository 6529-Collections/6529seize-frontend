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

  return (
    <CommonInput
      placeholder="Min TDH"
      inputType="number"
      value={
        typeof filters.tdh.min === "number" ? filters.tdh.min.toString() : ""
      }
      onChange={(value) => setMin(convertStringOrNullToNumberOrNull(value))}
    />
  );
}
