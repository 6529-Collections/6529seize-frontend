import { CreateGroupDescription } from "../../../../../generated/models/CreateGroupDescription";
import GroupCreateNumericValue from "./common/GroupCreateNumericValue";

export default function GroupCreateLevel({
  level,
  setLevel,
}: {
  readonly level: CreateGroupDescription["level"];
  readonly setLevel: (level: CreateGroupDescription["level"]) => void;
}) {
  return (
    <div className="tw-p-5 tw-bg-iron-900 tw-rounded-xl tw-shadow tw-border tw-border-solid tw-border-iron-800">
      <div className="tw-mb-4">
        <p className="tw-mb-0 tw-text-lg tw-font-semibold tw-text-iron-50">
          Level
        </p>
        <p className="tw-mb-0 tw-text-base tw-font-normal tw-text-iron-400">
          Set the group&apos;s minimum level requirement.
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
