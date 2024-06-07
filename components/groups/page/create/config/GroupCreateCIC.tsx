import { CreateGroupDescription } from "../../../../../generated/models/CreateGroupDescription";
import { GroupDescription } from "../../../../../generated/models/GroupDescription";
import GroupCreateDirection from "./common/GroupCreateDirection";
import IdentitySearch from "../../../../utils/input/identity/IdentitySearch";
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
      <div className="tw-mb-3">
        <p className="tw-mb-0 tw-text-lg tw-font-semibold tw-text-iron-50">
          CIC
        </p>
        <p className="tw-mb-0 tw-text-sm tw-font-normal tw-text-iron-500">
          Lorem ipsum dolor sit amet consectetur adipisicing elit.
        </p>
      </div>
      {cic.user_identity && cic.direction && (
        <div className="tw-mb-3">
          <GroupCreateDirection
            direction={cic.direction}
            label="CIC"
            setDirection={(direction) => setCIC({ ...cic, direction })}
          />
        </div>
      )}
      <div className="tw-flex tw-items-center tw-gap-x-3">
        <IdentitySearch
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
