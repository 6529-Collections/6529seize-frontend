import {
  FilterDirection,
  GeneralFilter,
} from "../../../../helpers/filters/Filters.types";
import CurationBuildFilterMinMaxValues from "../common/CurationBuildFilterMinMaxValues";
import CurationBuildFiltersUserDirection from "../common/user-direction/CurationBuildFiltersUserDirection";
import CurationBuildFiltersUserSearch from "../common/user-search/CurationBuildFiltersUserSearch";

export default function CurationBuildFilterCIC({
  filters,
  setFilters,
}: {
  readonly filters: GeneralFilter;
  readonly setFilters: (filters: GeneralFilter) => void;
}) {
  const setUser = (value: string | null) => {
    setFilters({
      ...filters,
      cic: {
        ...filters.rep,
        user: value,
      },
    });
  };

  const setMin = (value: number | null) => {
    setFilters({
      ...filters,
      cic: {
        ...filters.cic,
        min: value,
      },
    });
  };

  const setMax = (value: number | null) => {
    setFilters({
      ...filters,
      cic: { ...filters.cic, max: value },
    });
  };

  const setUserDirection = (value: FilterDirection) => {
    setFilters({
      ...filters,
      cic: {
        ...filters.cic,
        direction: value,
      },
    });
  };

  const userPlaceholder =
    filters.cic.direction === FilterDirection.SENT
      ? "CIC Receiver"
      : "CIC Giver";

  return (
    <div>
      <CurationBuildFiltersUserDirection
        userDirection={filters.cic.direction}
        setUserDirection={setUserDirection}
      />
      <CurationBuildFiltersUserSearch
        value={filters.cic.user}
        placeholder={userPlaceholder}
        setValue={setUser}
      />
      <CurationBuildFilterMinMaxValues
        min={filters.cic.min}
        max={filters.cic.max}
        minPlaceholder="Min CIC"
        maxPlaceholder="Max CIC"
        setMin={setMin}
        setMax={setMax}
      />
    </div>
  );
}
