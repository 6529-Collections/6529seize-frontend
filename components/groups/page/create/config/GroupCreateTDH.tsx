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
    <div className="tw-p-5 tw-bg-iron-900 tw-rounded-xl tw-shadow tw-border tw-border-solid tw-border-iron-800">
      <div className="tw-mb-4">
        <p className="tw-mb-0 tw-text-lg tw-font-semibold tw-text-iron-50">
         TDH
        </p>
        <p className="tw-mb-0 tw-text-base tw-font-normal tw-text-iron-400">
          Lorem ipsum dolor sit amet consectetur adipisicing elit.
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
