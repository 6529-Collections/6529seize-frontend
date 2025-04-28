import { useEffect, useState } from "react";
import { areEqualAddresses, numberWithCommas } from "../../../helpers/Helpers";
import { ApiWallet } from "../../../generated/models/ApiWallet";


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
      className="tw-group tw-text-white tw-justify-between tw-w-full tw-flex tw-rounded-lg tw-relative tw-cursor-pointer tw-select-none tw-p-2 hover:tw-bg-iron-700 tw-transition tw-duration-300 tw-ease-out"
    >
      <span className="tw-inline-block tw-text-sm tw-font-medium tw-text-white">
        {`${wallet.display ?? wallet.wallet} - ${
          wallet.tdh > 0 ? numberWithCommas(wallet.tdh) : 0
        }TDH`}
      </span>
      {isActive && (
        <svg
          className="tw-h-5 tw-w-5 tw-ml-2 tw-text-primary-300 tw-transition tw-duration-300 tw-ease-out"
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
