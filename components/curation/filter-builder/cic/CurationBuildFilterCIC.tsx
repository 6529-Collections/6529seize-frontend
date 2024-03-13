import { convertStringOrNullToNumberOrNull } from "../../../../helpers/Helpers";
import {
  FilterDirection,
  GeneralFilter,
} from "../../../../helpers/filters/Filters.types";
import CommonInput from "../../../utils/input/CommonInput";
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
      <CommonInput
        placeholder="Min CIC"
        inputType="number"
        value={
          typeof filters.cic.min === "number" ? filters.cic.min.toString() : ""
        }
        onChange={(value) => setMin(convertStringOrNullToNumberOrNull(value))}
      />
    </div>
  );
}
