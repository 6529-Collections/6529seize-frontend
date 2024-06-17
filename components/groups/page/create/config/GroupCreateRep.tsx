import { CreateGroupDescription } from "../../../../../generated/models/CreateGroupDescription";
import GroupCreateDirection from "./common/GroupCreateDirection";
import IdentitySearch from "../../../../utils/input/identity/IdentitySearch";
import GroupCreateNumericValue from "./common/GroupCreateNumericValue";
import RepCategorySearch from "../../../../utils/input/rep-category/RepCategorySearch";
import { GroupFilterDirection } from "../../../../../generated/models/GroupFilterDirection";

export default function GroupCreateRep({
  rep,
  setRep,
}: {
  readonly rep: CreateGroupDescription["rep"];
  readonly setRep: (rep: CreateGroupDescription["rep"]) => void;
}) {
  const IDENTITY_LABEL: Record<GroupFilterDirection, string> = {
    [GroupFilterDirection.Received]: "From Identity",
    [GroupFilterDirection.Sent]: "To Identity",
  };

  const identityLabel = rep.direction
    ? IDENTITY_LABEL[rep.direction]
    : "Identity";
  return (
    <div className="tw-p-5 tw-bg-iron-900 tw-rounded-xl tw-shadow tw-border tw-border-solid tw-border-iron-800">
      <div className="tw-flex tw-flex-col tw-space-y-4">
        <div className="tw-flex tw-flex-col">
          <div className="tw-mb-4">
            <p className="tw-mb-0 tw-text-lg tw-font-semibold tw-text-iron-50">
              Rep
            </p>
            <p className="tw-mb-0 tw-text-base tw-font-normal tw-text-iron-400">
              Lorem ipsum dolor sit amet consectetur adipisicing elit.
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
              identity={rep.user_identity}
              label={identityLabel}
              setIdentity={(identity) =>
                setRep({ ...rep, user_identity: identity })
              }
            />
            <RepCategorySearch
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
