import { GeneralFilter } from "../../../../helpers/filters/Filters.types";
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

  const setMax = (value: number | null) => {
    setFilters({
      ...filters,
      level: {
        ...filters.level,
        max: value,
      },
    });
  };

  return (
    <CurationBuildFilterMinMaxValues
      min={filters.level.min}
      max={filters.level.max}
      minPlaceholder="Min Level"
      maxPlaceholder="Max Level"
      setMin={setMin}
      setMax={setMax}
    />
  );
}
