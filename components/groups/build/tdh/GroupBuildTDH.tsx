import CommonInput from "../../../utils/input/CommonInput";
import { convertStringOrNullToNumberOrNull } from "../../../../helpers/Helpers";
import { GroupDescription } from "../../../../generated/models/GroupDescription";
import { CreateGroupDescription } from "../../../../generated/models/CreateGroupDescription";

export default function GroupBuildTDH({
  filters,
  setFilters,
}: {
  readonly filters: CreateGroupDescription;
  readonly setFilters: (filters: CreateGroupDescription) => void;
}) {
  const setMin = (value: number | null) => {
    setFilters({
      ...filters,
      tdh: {
        ...filters.tdh,
        min: value,
      },
    });
  };

  return (
    <CommonInput
      placeholder="TDH at least"
      inputType="number"
      minValue={0}
      maxValue={100000000000}
      value={
        typeof filters.tdh.min === "number" ? filters.tdh.min.toString() : ""
      }
      onChange={(value) => setMin(convertStringOrNullToNumberOrNull(value))}
    />
  );
}
