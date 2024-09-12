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
    <div className="tw-p-3 sm:tw-p-5 tw-bg-iron-950 tw-rounded-xl tw-shadow tw-border tw-border-solid tw-border-iron-800">
      <div className="tw-mb-4">
        <p className="tw-mb-0 tw-text-lg tw-font-semibold tw-text-iron-50">
          Level
        </p>
        <p className="tw-mt-1 tw-mb-0 tw-text-sm tw-font-normal tw-text-iron-300">
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
