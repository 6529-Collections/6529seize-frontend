import { IProfileConsolidation } from "../../../../../entities/IProfile";
import CircleLoader from "../../../../distribution-plan-tool/common/CircleLoader";
import { useAccount } from "wagmi";
import { areEqualAddresses } from "../../../../../helpers/Helpers";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import Tippy from "@tippyjs/react";
import { useEffect, useState } from "react";

export default function UserPageIdentityStatementsConsolidatedAddressesItemPrimary({
  isPrimary,
  canEdit,
  address,
  assignPrimary,
  isAssigningPrimary,
}: {
  readonly isPrimary: boolean;
  readonly address: IProfileConsolidation;
  readonly canEdit: boolean;
  readonly assignPrimary: () => void;
  readonly isAssigningPrimary: boolean;
}) {
  if (isPrimary) {
    return (
      <span className="tw-ml-1 tw-text-xs tw-font-bold tw-text-iron-500">
        Primary
      </span>
    );
  }

  if (canEdit) {
    return (
      <button
        disabled={isAssigningPrimary}
        onClick={assignPrimary}
        className="tw-bg-transparent tw-whitespace-nowrap tw-border-none tw-ml-1 tw-text-xs tw-font-bold tw-text-iron-500 hover:tw-text-primary-400 tw-transition tw-duration-300 tw-ease-out">
        {isAssigningPrimary ? <CircleLoader /> : <>Set Primary</>}
      </button>
    );
  }

  return null;
}
