import { CreateGroupDescription } from "../../../../../generated/models/CreateGroupDescription";
import GroupCreateNumericValue from "./common/GroupCreateNumericValue";

export default function GroupCreateTDH({
  tdh,
  setTDH,
}: {
  readonly tdh: CreateGroupDescription["tdh"];
  readonly setTDH: (tdh: CreateGroupDescription["tdh"]) => void;
}) {
  return (
    <div className="tw-p-3 sm:tw-p-5 tw-bg-iron-950 tw-rounded-xl tw-shadow tw-border tw-border-solid tw-border-iron-800">
      <div className="tw-mb-4">
        <p className="tw-mb-0 tw-text-base sm:tw-text-lg tw-font-semibold tw-text-iron-50">
          TDH
        </p>
        <p className="tw-mt-1 tw-mb-0 tw-text-sm tw-font-normal tw-text-iron-300">
          Set the group&apos;s minimum TDH requirement.
        </p>
      </div>
      <GroupCreateNumericValue
        value={tdh.min}
        label="TDH at least"
        labelId="floating_tdh"
        setValue={(value) => setTDH({ ...tdh, min: value })}
      />
    </div>
  );
}
