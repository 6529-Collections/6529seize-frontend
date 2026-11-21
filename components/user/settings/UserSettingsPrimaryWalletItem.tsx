"use client";

import {
  DROPDOWN_CHECKMARK_CLASSES,
  DROPDOWN_SELECTED_OPTION_CLASSES,
  DROPDOWN_OPTION_ACTIVE_CLASSES,
} from "@/components/utils/select/dropdown/dropdownTriggerStyles";
import { useEffect, useState } from "react";
import { areEqualAddresses, formatStatFloor } from "@/helpers/Helpers";
import type { ApiWallet } from "@/generated/models/ApiWallet";

export default function UserSettingsPrimaryWalletItem({
  wallet,
  selected,
  onSelect,
}: {
  readonly wallet: ApiWallet;
  readonly selected: string;
  readonly onSelect: (wallet: string) => void;
}) {
  const [isActive, setIsActive] = useState(
    areEqualAddresses(wallet.wallet, selected)
  );

  useEffect(() => {
    setIsActive(areEqualAddresses(wallet.wallet, selected));
  }, [selected, wallet.wallet]);
  return (
    <li
      onClick={() => onSelect(wallet.wallet)}
      className={`tw-group tw-relative tw-flex tw-w-full tw-cursor-pointer tw-select-none tw-justify-between tw-rounded-lg tw-p-2 tw-transition-colors tw-duration-150 tw-ease-out ${DROPDOWN_OPTION_ACTIVE_CLASSES} ${isActive ? DROPDOWN_SELECTED_OPTION_CLASSES : "tw-bg-transparent tw-text-iron-200"}`}
    >
      <span className="tw-inline-block tw-text-sm tw-font-medium">
        {`${wallet.display ?? wallet.wallet} - ${
          wallet.tdh > 0 ? formatStatFloor(wallet.tdh) : 0
        }TDH`}
      </span>
      {isActive && (
        <svg
          className={`tw-ml-2 tw-h-5 tw-w-5 ${DROPDOWN_CHECKMARK_CLASSES} tw-transition tw-duration-300 tw-ease-out`}
          viewBox="0 0 24 24"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            d="M20 6L9 17L4 12"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      )}
    </li>
  );
}
