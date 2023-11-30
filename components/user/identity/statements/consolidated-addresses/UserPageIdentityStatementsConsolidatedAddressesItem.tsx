import { IProfileConsolidation } from "../../../../../entities/IProfile";
import EtherscanIcon from "../../../utils/icons/EtherscanIcon";
import OpenseaIcon from "../../../utils/icons/OpenseaIcon";

export default function UserPageIdentityStatementsConsolidatedAddressesItem({
  address,
  primaryAddress,
}: {
  address: IProfileConsolidation;
  primaryAddress: string;
}) {
  return (
    <li className="tw-group tw-flex tw-items-center tw-group tw-cursor-pointer  tw-text-sm tw-font-medium tw-text-neutral-50 hover:tw-text-neutral-300 tw-transition tw-duration-300 tw-ease-out tw-space-x-3">
      <div className="tw-cursor-pointer tw-flex-shrink-0 tw-h-6 tw-w-6 hover:tw-scale-110 tw-transition tw-duration-300 tw-ease-out">
        <OpenseaIcon />
      </div>
      <div className="tw-cursor-pointer tw-flex-shrink-0 tw-h-6 tw-w-6  hover:tw-scale-110 tw-transition tw-duration-300 tw-ease-out">
        <EtherscanIcon />
      </div>
      <div className="tw-space-x-3 tw-inline-flex tw-items-center">
        <span>{address.wallet.address.slice(0, 6)}</span>
        {address.wallet.ens && <span>{address.wallet.ens}</span>}
        <div className="tw-inline-flex tw-items-center">
          <svg
            className="tw-flex-shrink-0 tw-w-5 tw-h-5"
            viewBox="0 0 24 24"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              d="M20 6L9 17L4 12"
              stroke="#3CCB7F"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
          {address.wallet.address.toLowerCase() ===
            primaryAddress.toLowerCase() && (
            <span className="tw-ml-1 tw-text-xs tw-font-bold tw-text-neutral-500">
              Primary
            </span>
          )}
        </div>
      </div>
    </li>
  );
}
