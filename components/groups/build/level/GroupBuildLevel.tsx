import { GroupDescription } from "../../../../generated/models/GroupDescription";
import { convertStringOrNullToNumberOrNull } from "../../../../helpers/Helpers";
import CommonInput from "../../../utils/input/CommonInput";

export default function GroupBuildLevel({
  filters,
  setFilters,
}: {
  readonly filters: GroupDescription;
  readonly setFilters: (filters: GroupDescription) => void;
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
