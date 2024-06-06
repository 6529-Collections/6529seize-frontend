import { GroupDescription } from "../../../../../generated/models/GroupDescription";
import GroupCreateNumericValue from "./common/GroupCreateNumericValue";

export default function GroupCreateLevel({
  level,
  setLevel,
}: {
  readonly level: GroupDescription["level"];
  readonly setLevel: (level: GroupDescription["level"]) => void;
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
