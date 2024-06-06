import { CreateGroupDescription } from "../../../../../generated/models/CreateGroupDescription";
import { GroupDescription } from "../../../../../generated/models/GroupDescription";
import GroupCreateNumericValue from "./common/GroupCreateNumericValue";

export default function GroupCreateTDH({
  tdh,
  setTDH,
}: {
  readonly tdh: CreateGroupDescription["tdh"];
  readonly setTDH: (tdh: CreateGroupDescription["tdh"]) => void;
}) {
  const onChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    if (value === "") {
      setTDH({
        ...tdh,
        min: null,
      });
      return;
    }
    const numericValue = parseFloat(value);
    if (isNaN(numericValue)) {
      setTDH({
        ...tdh,
        min: null,
      });
      return;
    }
    setTDH({
      ...tdh,
      min: numericValue,
    });
  };
  return (
    <div>
      <p className="tw-mb-4 tw-text-lg tw-font-semibold tw-text-iron-50">TDH</p>
      <GroupCreateNumericValue
        value={tdh.min}
        label="TDH at least"
        labelId="floating_tdh"
        setValue={(value) => setTDH({ ...tdh, min: value })}
      />
    </div>
  );
}
