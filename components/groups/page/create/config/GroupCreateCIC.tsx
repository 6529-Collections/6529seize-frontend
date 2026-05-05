import type { ApiCreateGroupDescription } from "@/generated/models/ApiCreateGroupDescription";
import GroupCreateDirection from "./common/GroupCreateDirection";
import IdentitySearch, {
  IdentitySearchSize,
} from "@/components/utils/input/identity/IdentitySearch";
import GroupCreateNumericValue from "./common/GroupCreateNumericValue";
import { ApiGroupFilterDirection } from "@/generated/models/ApiGroupFilterDirection";

export default function GroupCreateCIC({
  cic,
  setCIC,
}: {
  readonly cic: ApiCreateGroupDescription["cic"];
  readonly setCIC: (cic: ApiCreateGroupDescription["cic"]) => void;
}) {
  const IDENTITY_LABEL: Record<ApiGroupFilterDirection, string> = {
    [ApiGroupFilterDirection.Received]: "From Identity",
    [ApiGroupFilterDirection.Sent]: "To Identity",
  };

  const identityLabel = cic.direction
    ? IDENTITY_LABEL[cic.direction]
    : "Identity";
  return (
    <div className="tw-rounded-xl tw-border tw-border-solid tw-border-iron-800 tw-bg-iron-950 tw-p-3 tw-shadow sm:tw-p-5">
      <div className="tw-flex tw-flex-col">
        <div className="tw-mb-4">
          <p className="tw-mb-0 tw-text-base tw-font-semibold tw-text-iron-50">
            NIC
          </p>
          <p className="tw-mb-0 tw-mt-0.5 tw-text-sm tw-text-iron-400">
            Specify the NIC and optionally set the identity who gave it.
          </p>
        </div>
        {cic.user_identity && cic.direction && (
          <div className="tw-mb-4">
            <GroupCreateDirection
              direction={cic.direction}
              label="NIC"
              setDirection={(direction) => setCIC({ ...cic, direction })}
            />
          </div>
        )}
        <div className="tw-flex tw-flex-col tw-gap-x-3 tw-gap-y-4 lg:tw-gap-y-5">
          <IdentitySearch
            size={IdentitySearchSize.SM}
            identity={cic.user_identity}
            label={identityLabel}
            setIdentity={(identity) =>
              setCIC({ ...cic, user_identity: identity })
            }
          />
          <GroupCreateNumericValue
            value={cic.min}
            label="NIC at least"
            labelId="floating_cic"
            setValue={(value) => setCIC({ ...cic, min: value })}
          />
        </div>
      </div>
    </div>
  );
}
