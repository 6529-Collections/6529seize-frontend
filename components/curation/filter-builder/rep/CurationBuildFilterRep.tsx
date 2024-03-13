import { useEffect } from "react";
import { convertStringOrNullToNumberOrNull } from "../../../../helpers/Helpers";
import {
  FilterDirection,
  GeneralFilter,
} from "../../../../helpers/filters/Filters.types";
import CommonInput from "../../../utils/input/CommonInput";
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

  const setUserDirection = (value: FilterDirection) => {
    setFilters({
      ...filters,
      rep: {
        ...filters.rep,
        direction: value,
      },
    });
  };

  const showDirection = !!(filters.rep.user || filters.rep.category);

  useEffect(() => {
    if (!showDirection) {
      setUserDirection(FilterDirection.RECEIVED);
    }
  }, [showDirection]);

  return (
    <div className="tw-space-y-4">
      {showDirection && (
        <CurationBuildFiltersUserDirection
          userDirection={filters.rep.direction}
          type="Rep"
          setUserDirection={setUserDirection}
        />
      )}
      <CurationBuildFiltersUserSearch
        value={filters.rep.user}
        placeholder="User"
        setValue={setUser}
      />
      <CurationBuildFiltersRepSearch
        category={filters.rep.category}
        setCategory={setCategory}
      />
      <CommonInput
        placeholder="Rep from"
        inputType="number"
        value={
          typeof filters.rep.min === "number" ? filters.rep.min.toString() : ""
        }
        onChange={(value) => setMin(convertStringOrNullToNumberOrNull(value))}
      />
    </div>
  );
}
