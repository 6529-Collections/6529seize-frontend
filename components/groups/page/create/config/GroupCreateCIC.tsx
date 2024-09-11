import { CreateGroupDescription } from "../../../../../generated/models/CreateGroupDescription";
import GroupCreateDirection from "./common/GroupCreateDirection";
import IdentitySearch, { IdentitySearchSize } from "../../../../utils/input/identity/IdentitySearch";
import GroupCreateNumericValue from "./common/GroupCreateNumericValue";
import { GroupFilterDirection } from "../../../../../generated/models/GroupFilterDirection";

export default function GroupCreateCIC({
  cic,
  setCIC,
}: {
  readonly cic: CreateGroupDescription["cic"];
  readonly setCIC: (cic: CreateGroupDescription["cic"]) => void;
}) {
  const IDENTITY_LABEL: Record<GroupFilterDirection, string> = {
    [GroupFilterDirection.Received]: "From Identity",
    [GroupFilterDirection.Sent]: "To Identity",
  };

  const identityLabel = cic.direction
    ? IDENTITY_LABEL[cic.direction]
    : "Identity";
  return (
    <div className="tw-p-3 sm:tw-p-5 tw-bg-iron-950 tw-rounded-xl tw-shadow tw-border tw-border-solid tw-border-iron-800">
      <div className="tw-flex tw-flex-col">
        <div className="tw-mb-4">
          <p className="tw-mb-0 tw-text-base sm:tw-text-lg tw-font-semibold tw-text-iron-50">
            CIC
          </p>
          <p className="tw-mt-1 tw-mb-0 tw-text-sm tw-font-normal tw-text-iron-300">
            Specify the CIC and optionally set the identity who gave it.
          </p>
        </div>
        {cic.user_identity && cic.direction && (
          <div className="tw-mb-4">
            <GroupCreateDirection
              direction={cic.direction}
              label="CIC"
              setDirection={(direction) => setCIC({ ...cic, direction })}
            />
          </div>
        )}
        <div className="tw-flex tw-flex-col tw-gap-y-4 lg:tw-gap-y-5 tw-gap-x-3">
          <IdentitySearch
            size={IdentitySearchSize.MD}
            identity={cic.user_identity}
            label={identityLabel}
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
    </div>
  );
}
