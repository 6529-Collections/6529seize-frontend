import { convertStringOrNullToNumberOrNull } from "../../../../helpers/Helpers";
import { GeneralFilter } from "../../../../helpers/filters/Filters.types";
import CommonInput from "../../../utils/input/CommonInput";
import CurationBuildFilterMinMaxValues from "../common/CurationBuildFilterMinMaxValues";

export default function CurationBuildFilterLevel({
  filters,
  setFilters,
}: {
  readonly filters: GeneralFilter;
  readonly setFilters: (filters: GeneralFilter) => void;
}) {
  const setMin = (value: number | null) => {
    setFilters({
      ...filters,
      level: {
        ...filters.level,
        min: value,
      },
    });
  };

  return (
    <CommonInput
      placeholder="Level at least"
      inputType="number"
      minValue={-100}
      maxValue={100}
      value={
        typeof filters.level.min === "number"
          ? filters.level.min.toString()
          : ""
      }
      onChange={(value) => setMin(convertStringOrNullToNumberOrNull(value))}
    />
  );
}
