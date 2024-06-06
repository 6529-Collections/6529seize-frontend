import { CreateGroupDescription } from "../../../../../generated/models/CreateGroupDescription";
import { GroupDescription } from "../../../../../generated/models/GroupDescription";
import GroupCreateNumericValue from "./common/GroupCreateNumericValue";

export default function GroupCreateLevel({
  level,
  setLevel,
}: {
  readonly level: CreateGroupDescription["level"];
  readonly setLevel: (level: CreateGroupDescription["level"]) => void;
}) {
  return (
    <div>
      <p className="tw-mb-4 tw-text-lg tw-font-semibold tw-text-iron-50">
        Level
      </p>
      <GroupCreateNumericValue
        value={level.min}
        label="Level at least"
        labelId="floating_level"
        setValue={(value) => setLevel({ ...level, min: value })}
      />
    </div>
  );
}
