import { useEffect } from "react";
import { convertStringOrNullToNumberOrNull } from "../../../../helpers/Helpers";

import CommonInput from "../../../utils/input/CommonInput";
import GroupBuildUserDirection from "../common/user-direction/GroupBuildUserDirection";
import GroupBuildUserSearch from "../common/user-search/GroupBuildUserSearch";
import { GroupDescription } from "../../../../generated/models/GroupDescription";
import { GroupFilterDirection } from "../../../../generated/models/GroupFilterDirection";
import { CreateGroupDescription } from "../../../../generated/models/CreateGroupDescription";

export default function GroupBuildCIC({
  filters,
  setFilters,
}: {
  readonly filters: CreateGroupDescription;
  readonly setFilters: (filters: CreateGroupDescription) => void;
}) {
  const setUser = (value: string | null) => {
    setFilters({
      ...filters,
      cic: {
        ...filters.cic,
        user_identity: value,
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

  const setUserDirection = (value: GroupFilterDirection) => {
    setFilters({
      ...filters,
      cic: {
        ...filters.cic,
        direction: value,
      },
    });
  };

  useEffect(() => {
    if (!filters.cic.user_identity) {
      setUserDirection(GroupFilterDirection.Received);
    }
  }, [filters.cic.user_identity]);

  return (
    <div className="tw-space-y-4">
      {filters.cic.user_identity && filters.cic.direction && (
        <GroupBuildUserDirection
          userDirection={filters.cic.direction}
          type="CIC"
          setUserDirection={setUserDirection}
        />
      )}
      <GroupBuildUserSearch
        value={filters.cic.user_identity}
        placeholder="User"
        setValue={setUser}
      />
      <CommonInput
        placeholder="CIC at least"
        inputType="number"
        minValue={-100000000000}
        maxValue={100000000000}
        value={
          typeof filters.cic.min === "number" ? filters.cic.min.toString() : ""
        }
        onChange={(value) => setMin(convertStringOrNullToNumberOrNull(value))}
      />
    </div>
  );
}
