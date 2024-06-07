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
      <div className="tw-mb-3">
        <p className="tw-mb-0 tw-text-lg tw-font-semibold tw-text-iron-50">
          Level
        </p>
        <p className="tw-mb-0 tw-text-sm tw-font-normal tw-text-iron-500">
          Lorem ipsum dolor sit amet consectetur adipisicing elit.
        </p>
      </div>
      <GroupCreateNumericValue
        value={level.min}
        label="Level at least"
        labelId="floating_level"
        setValue={(value) => setLevel({ ...level, min: value })}
      />
    </div>
  );
}
