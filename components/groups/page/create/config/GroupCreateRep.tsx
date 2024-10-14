import { ApiCreateGroupDescription } from "../../../../../generated/models/ApiCreateGroupDescription";
import GroupCreateDirection from "./common/GroupCreateDirection";
import IdentitySearch, {
  IdentitySearchSize,
} from "../../../../utils/input/identity/IdentitySearch";
import GroupCreateNumericValue from "./common/GroupCreateNumericValue";
import RepCategorySearch, {
  RepCategorySearchSize,
} from "../../../../utils/input/rep-category/RepCategorySearch";
import { ApiGroupFilterDirection } from "../../../../../generated/models/ApiGroupFilterDirection";

export default function GroupCreateRep({
  rep,
  setRep,
}: {
  readonly rep: ApiCreateGroupDescription["rep"];
  readonly setRep: (rep: ApiCreateGroupDescription["rep"]) => void;
}) {
  const IDENTITY_LABEL: Record<ApiGroupFilterDirection, string> = {
    [ApiGroupFilterDirection.Received]: "From Identity",
    [ApiGroupFilterDirection.Sent]: "To Identity",
  };

  const identityLabel = rep.direction
    ? IDENTITY_LABEL[rep.direction]
    : "Identity";
  return (
    <div className="tw-p-3 sm:tw-p-5 tw-bg-iron-950 tw-rounded-xl tw-shadow tw-border tw-border-solid tw-border-iron-800">
      <div className="tw-flex tw-flex-col tw-space-y-4">
        <div className="tw-flex tw-flex-col">
          <div className="tw-mb-4">
            <p className="tw-mb-0 tw-text-base sm:tw-text-lg tw-font-semibold tw-text-iron-50">
              Rep
            </p>
            <p className="tw-mt-1 tw-mb-0 tw-text-sm tw-font-normal tw-text-iron-300">
              Set the giver, rep category, and minimum rep.
            </p>
          </div>
          {rep.user_identity && rep.direction && (
            <div className="tw-mb-4">
              <GroupCreateDirection
                direction={rep.direction}
                label="Rep"
                setDirection={(direction) => setRep({ ...rep, direction })}
              />
            </div>
          )}
          <div className="tw-flex tw-flex-col xl:tw-flex-row tw-gap-4 lg:tw-gap-5">
            <IdentitySearch
              size={IdentitySearchSize.MD}
              identity={rep.user_identity}
              label={identityLabel}
              setIdentity={(identity) =>
                setRep({ ...rep, user_identity: identity })
              }
            />
            <RepCategorySearch
              size={RepCategorySearchSize.MD}
              category={rep.category}
              setCategory={(category) => setRep({ ...rep, category })}
            />
          </div>
          <div className="tw-mt-4 lg:tw-mt-5">
            <GroupCreateNumericValue
              value={rep.min}
              label="Rep at least"
              labelId="floating_rep"
              setValue={(value) => setRep({ ...rep, min: value })}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
