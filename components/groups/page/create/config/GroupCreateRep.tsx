"use client";

import { GROUP_CREATE_PANEL_STYLES } from "../GroupCreate.styles";
import type { ApiCreateGroupDescription } from "@/generated/models/ApiCreateGroupDescription";
import GroupCreateDirection from "./common/GroupCreateDirection";
import IdentitySearch, {
  IdentitySearchSize,
} from "@/components/utils/input/identity/IdentitySearch";
import GroupCreateNumericValue from "./common/GroupCreateNumericValue";
import RepCategorySearch, {
  RepCategorySearchSize,
} from "@/components/utils/input/rep-category/RepCategorySearch";
import { ApiGroupFilterDirection } from "@/generated/models/ApiGroupFilterDirection";
import { useState } from "react";
import PositiveOnlyToggle from "./rep/PositiveOnlyToggle";

export default function GroupCreateRep({
  rep,
  setRep,
}: {
  readonly rep: ApiCreateGroupDescription["rep"];
  readonly setRep: (rep: ApiCreateGroupDescription["rep"]) => void;
}) {
  const [positiveOnly, setPositiveOnly] = useState(false);

  const IDENTITY_LABEL: Record<ApiGroupFilterDirection, string> = {
    [ApiGroupFilterDirection.Received]: "From Identity",
    [ApiGroupFilterDirection.Sent]: "To Identity",
  };

  const identityLabel = rep.direction
    ? IDENTITY_LABEL[rep.direction]
    : "Identity";
  return (
    <div className={GROUP_CREATE_PANEL_STYLES}>
      <div className="tw-flex tw-flex-col tw-space-y-4">
        <div className="tw-flex tw-flex-col">
          <div className="tw-mb-4 tw-flex tw-items-center tw-justify-between">
            <div>
              <p className="tw-m-0 tw-text-base tw-font-semibold tw-text-iron-50">
                Rep
              </p>
              <p className="tw-m-0 tw-mt-0.5 tw-text-sm tw-text-iron-400">
                Set the giver, rep category, and minimum rep.
              </p>
            </div>
            <PositiveOnlyToggle
              positiveOnly={positiveOnly}
              setPositiveOnly={setPositiveOnly}
            />
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
          <div className="tw-flex tw-flex-col tw-gap-4 lg:tw-gap-5 xl:tw-flex-row">
            <IdentitySearch
              size={IdentitySearchSize.SM}
              identity={rep.user_identity}
              label={identityLabel}
              setIdentity={(identity) =>
                setRep({ ...rep, user_identity: identity })
              }
            />
            <RepCategorySearch
              size={RepCategorySearchSize.SM}
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
