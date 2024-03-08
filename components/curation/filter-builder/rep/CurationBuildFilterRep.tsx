import {
  FilterDirection,
  GeneralFilter,
} from "../../../../helpers/filters/Filters.types";
import CurationBuildFilterMinMaxValues from "../common/CurationBuildFilterMinMaxValues";
import CurationBuildFiltersRepSearch from "../common/rep-search/CurationBuildFiltersRepSearch";
import CurationBuildFiltersUserDirection from "../common/user-direction/CurationBuildFiltersUserDirection";
import CurationBuildFiltersUserSearch from "../common/user-search/CurationBuildFiltersUserSearch";

export default function CurationBuildFilterRep({
  filters,
  setFilters,
}: {
  readonly filters: GeneralFilter;
  readonly setFilters: (filters: GeneralFilter) => void;
}) {
  const setUser = (value: string | null) => {
    setFilters({
      ...filters,
      rep: {
        ...filters.rep,
        user: value,
      },
    });
  };

  const setCategory = (value: string | null) => {
    setFilters({
      ...filters,
      rep: {
        ...filters.rep,
        category: value,
      },
    });
  };

  const setMin = (value: number | null) => {
    setFilters({
      ...filters,
      rep: {
        ...filters.rep,
        min: value,
      },
    });
  };

  const setMax = (value: number | null) => {
    setFilters({
      ...filters,
      rep: { ...filters.rep, max: value },
    });
  };

  const setUserDirection = (value: FilterDirection) => {
    setFilters({
      ...filters,
      rep: {
        ...filters.rep,
        direction: value,
      },
    });
  };

  const userPlaceholder =
    filters.rep.direction === FilterDirection.SENT
      ? "Rep Receiver"
      : "Rep Giver";

  return (
    <div>
      <CurationBuildFiltersUserDirection
        userDirection={filters.rep.direction}
        setUserDirection={setUserDirection}
      />
      <CurationBuildFiltersUserSearch
        value={filters.rep.user}
        placeholder={userPlaceholder}
        setValue={setUser}
      />
      <CurationBuildFiltersRepSearch
        category={filters.rep.category}
        setCategory={setCategory}
      />
      <CurationBuildFilterMinMaxValues
        min={filters.rep.min}
        max={filters.rep.max}
        minPlaceholder="Min Rep"
        maxPlaceholder="Max Rep"
        setMin={setMin}
        setMax={setMax}
      />
    </div>
  );
}
