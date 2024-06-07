import { CreateGroupDescription } from "../../../../../generated/models/CreateGroupDescription";
import { GroupDescription } from "../../../../../generated/models/GroupDescription";
import GroupCreateDirection from "./common/GroupCreateDirection";
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
        <div className="tw-mb-3">
          <p className="tw-mb-0 tw-text-lg tw-font-semibold tw-text-iron-50">
            Rep
          </p>
          <p className="tw-mb-0 tw-text-sm tw-font-normal tw-text-iron-500">
            Lorem ipsum dolor sit amet consectetur adipisicing elit.
          </p>
        </div>
        {rep.user_identity && rep.direction && (
          <div className="tw-mb-3">
            <GroupCreateDirection
              direction={rep.direction}
              label="Rep"
              setDirection={(direction) => setRep({ ...rep, direction })}
            />
          </div>
        )}
        <GroupCreateNumericValue
          value={rep.min}
          label="Rep at least"
          labelId="floating_rep"
          setValue={(value) => setRep({ ...rep, min: value })}
        />
        <div className="tw-mt-5 tw-flex tw-gap-x-5">
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
    </div>
  );
}
