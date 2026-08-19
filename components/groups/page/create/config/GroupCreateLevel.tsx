import { GROUP_CREATE_PANEL_STYLES } from "../GroupCreate.styles";
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
    <div className={GROUP_CREATE_PANEL_STYLES}>
      <div className="tw-mb-4">
        <p className="tw-m-0 tw-text-base tw-font-semibold tw-text-iron-100">
          Level
        </p>
        <p className="tw-m-0 tw-text-sm tw-font-normal tw-text-iron-500">
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
