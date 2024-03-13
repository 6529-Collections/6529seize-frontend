import { useEffect } from "react";
import { convertStringOrNullToNumberOrNull } from "../../../../helpers/Helpers";
import {
  FilterDirection,
  GeneralFilter,
} from "../../../../helpers/filters/Filters.types";
import CommonInput from "../../../utils/input/CommonInput";
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
        ...filters.cic,
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

  const setUserDirection = (value: FilterDirection) => {
    setFilters({
      ...filters,
      cic: {
        ...filters.cic,
        direction: value,
      },
    });
  };

  useEffect(() => {
    if (!filters.cic.user) {
      setUserDirection(FilterDirection.RECEIVED);
    }
  }, [filters.cic.user]);

  return (
    <div className="tw-space-y-4">
      {filters.cic.user && (
        <CurationBuildFiltersUserDirection
          userDirection={filters.cic.direction}
          type="CIC"
          setUserDirection={setUserDirection}
        />
      )}
      <CurationBuildFiltersUserSearch
        value={filters.cic.user}
        placeholder="User"
        setValue={setUser}
      />
      <CommonInput
        placeholder="CIC from"
        inputType="number"
        value={
          typeof filters.cic.min === "number" ? filters.cic.min.toString() : ""
        }
        onChange={(value) => setMin(convertStringOrNullToNumberOrNull(value))}
      />
    </div>
  );
}
