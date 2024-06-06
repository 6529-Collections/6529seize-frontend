import { CreateGroupDescription } from "../../../../../generated/models/CreateGroupDescription";
import { GroupDescription } from "../../../../../generated/models/GroupDescription";
import GroupCreateIdentitySearch from "./common/GroupCreateIdentitySearch";
import GroupCreateNumericValue from "./common/GroupCreateNumericValue";

export default function GroupCreateCIC({
  cic,
  setCIC,
}: {
  readonly cic: CreateGroupDescription["cic"];
  readonly setCIC: (cic: CreateGroupDescription["cic"]) => void;
}) {
  return (
    <div className="tw-flex tw-flex-col">
      <p className="tw-mb-4 tw-text-lg tw-font-semibold tw-text-iron-50">CIC</p>
      <div className="tw-flex tw-items-center tw-gap-x-3">
        <GroupCreateIdentitySearch
          identity={cic.user_identity}
          setIdentity={(identity) =>
            setCIC({ ...cic, user_identity: identity })
          }
        />
        <GroupCreateNumericValue
          value={cic.min}
          label="CIC at least"
          labelId="floating_cic"
          setValue={(value) => setCIC({ ...cic, min: value })}
        />
      </div>
    </div>
  );
}
