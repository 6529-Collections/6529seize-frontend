import { formatAddress, fromGWEI } from "@/helpers/Helpers";
import { useAccount, useBalance, useEnsName } from "wagmi";
import { useSeizeConnectContext } from "../auth/SeizeConnectContext";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faPlugCircleXmark } from "@fortawesome/free-solid-svg-icons";

export default function UserBalance() {
  const account = useAccount();
  const { data: balance } = useBalance({
    address: account.address,
    chainId: account.chainId,
  });
  const ens = useEnsName({
    address: account.address,
    chainId: account.chainId,
  });
  const accountDisplay = ens.data
    ? `${ens.data}`
    : formatAddress(account.address?.toString() ?? "");

  const { seizeConnect, seizeConnectOpen, seizeDisconnect } =
    useSeizeConnectContext();

  if (!account.isConnected) {
    return (
      <button
        type="button"
        onClick={seizeConnect}
        disabled={seizeConnectOpen}
        className="tw-inline-flex tw-h-8 tw-items-center tw-justify-center tw-whitespace-nowrap tw-rounded-full tw-border-0 tw-bg-primary-500 tw-px-4 !tw-text-sm tw-font-medium tw-leading-none tw-text-white tw-shadow-sm tw-ring-0 tw-transition tw-duration-300 tw-ease-out hover:tw-bg-primary-600 focus:tw-outline-none disabled:tw-cursor-not-allowed disabled:tw-opacity-60"
      >
        Connect Wallet
      </button>
    );
  }

  return (
    <div className="tw-inline-flex tw-h-8 tw-max-w-full tw-items-stretch tw-rounded-full tw-bg-white !tw-text-sm tw-shadow-sm">
      <div className="tw-flex tw-min-w-0 tw-flex-1 tw-items-center tw-gap-x-2 tw-rounded-l-full tw-pl-3 tw-pr-2 tw-font-medium">
        <span className="tw-truncate tw-text-black">{accountDisplay}</span>
        <span className="tw-shrink-0 tw-whitespace-nowrap tw-text-iron-500">
          {fromGWEI(Number(balance?.value)).toLocaleString()} {balance?.symbol}
        </span>
      </div>
      <div
        className="tw-w-[2px] tw-shrink-0 tw-self-stretch tw-bg-black"
        aria-hidden
      />
      <button
        type="button"
        onClick={seizeDisconnect}
        className="tw-flex tw-shrink-0 tw-items-center tw-justify-center tw-rounded-r-full tw-border-0 tw-bg-transparent tw-px-3 tw-text-black tw-ring-0 tw-transition-colors hover:tw-bg-iron-100 focus:tw-outline-none focus-visible:tw-bg-iron-100"
      >
        <FontAwesomeIcon icon={faPlugCircleXmark} className="tw-h-4 tw-w-4" />
      </button>
    </div>
  );
}
