import { useEffect } from "react";
import { convertStringOrNullToNumberOrNull } from "../../../../helpers/Helpers";

import CommonInput from "../../../utils/input/CommonInput";
import GroupBuildUserDirection from "../common/user-direction/GroupBuildUserDirection";
import GroupBuildUserSearch from "../common/user-search/GroupBuildUserSearch";
import CommonRepCategorySearch from "../../../utils/rep/CommonRepCategorySearch";
import { GroupFilterDirection } from "../../../../generated/models/GroupFilterDirection";
import { GroupDescription } from "../../../../generated/models/GroupDescription";

export default function GroupBuildRep({
  filters,
  setFilters,
}: {
  readonly filters: GroupDescription;
  readonly setFilters: (filters: GroupDescription) => void;
}) {
  const setUser = (value: string | null) => {
    setFilters({
      ...filters,
      rep: {
        ...filters.rep,
        user_identity: value,
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

  const setUserDirection = (value: GroupFilterDirection) => {
    setFilters({
      ...filters,
      rep: {
        ...filters.rep,
        direction: value,
      },
    });
  };

  const showDirection: boolean =
    !!filters.rep.user_identity?.length ?? !!filters.rep.category;

  useEffect(() => {
    if (!showDirection) {
      setUserDirection(GroupFilterDirection.Received);
    }
  }, [showDirection]);

  return (
    <div className="tw-space-y-4">
      {showDirection && filters.rep.direction && (
        <GroupBuildUserDirection
          userDirection={filters.rep.direction}
          type="Rep"
          setUserDirection={setUserDirection}
        />
      )}
      <GroupBuildUserSearch
        value={filters.rep.user_identity}
        placeholder="User"
        setValue={setUser}
      />
      <CommonRepCategorySearch
        category={filters.rep.category}
        setCategory={setCategory}
      />
      <CommonInput
        placeholder="Rep at least"
        inputType="number"
        minValue={-100000000000}
        maxValue={100000000000}
        value={
          typeof filters.rep.min === "number" ? filters.rep.min.toString() : ""
        }
        onChange={(value) => setMin(convertStringOrNullToNumberOrNull(value))}
      />
    </div>
  );
}
