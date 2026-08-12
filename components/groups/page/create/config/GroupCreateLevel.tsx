import type { ApiCreateGroupDescription } from "@/generated/models/ApiCreateGroupDescription";
import GroupCreateNumericValue from "./common/GroupCreateNumericValue";

export default function GroupCreateLevel({
  level,
  setLevel,
}: {
  readonly level: ApiCreateGroupDescription["level"];
  readonly setLevel: (level: ApiCreateGroupDescription["level"]) => void;
}) {
  return (
    <div className="tw-rounded-xl tw-border tw-border-solid tw-border-iron-800 tw-bg-iron-950 tw-p-3 tw-shadow sm:tw-p-5">
      <div className="tw-mb-4">
        <p className="tw-mb-0 tw-text-base tw-font-semibold tw-text-iron-100">
          Level
        </p>
        <p className="tw-mb-0 tw-text-sm tw-font-normal tw-text-iron-500">
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
