import { CreateGroupDescription } from "../../../../../generated/models/CreateGroupDescription";
import { GroupDescription } from "../../../../../generated/models/GroupDescription";
import GroupCreateIdentitySearch from "./common/GroupCreateIdentitySearch";
import GroupCreateNumericValue from "./common/GroupCreateNumericValue";
import GroupRepCategorySearch from "./common/GroupRepCategorySearch";

export default function GroupCreateRep({
  rep,
  setRep,
}: {
  readonly rep: CreateGroupDescription["rep"];
  readonly setRep: (rep: CreateGroupDescription["rep"]) => void;
}) {
  return (
    <div className="tw-flex tw-flex-col tw-space-y-4">
      <div className="tw-flex tw-flex-col">
        <p className="tw-mb-4 tw-text-lg tw-font-semibold tw-text-iron-50">
          Rep
        </p>
        <div className="tw-flex tw-gap-x-5">
          <GroupCreateIdentitySearch
            identity={rep.user_identity}
            setIdentity={(identity) =>
              setRep({ ...rep, user_identity: identity })
            }
          />
          <GroupRepCategorySearch
            category={rep.category}
            setCategory={(category) => setRep({ ...rep, category })}
          />
        </div>
      </div>
      <GroupCreateNumericValue
        value={rep.min}
        label="Rep at least"
        labelId="floating_rep"
        setValue={(value) => setRep({ ...rep, min: value })}
      />
    </div>
  );
}
