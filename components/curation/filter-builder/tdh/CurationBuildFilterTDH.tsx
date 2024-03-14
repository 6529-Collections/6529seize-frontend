import { GeneralFilter } from "../../../../helpers/filters/Filters.types";
import CommonInput from "../../../utils/input/CommonInput";
import { convertStringOrNullToNumberOrNull } from "../../../../helpers/Helpers";

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
      placeholder="TDH at least"
      inputType="number"
      minValue={0}
      maxValue={100000000000}
      value={
        typeof filters.tdh.min === "number" ? filters.tdh.min.toString() : ""
      }
      onChange={(value) => setMin(convertStringOrNullToNumberOrNull(value))}
    />
  );
}
