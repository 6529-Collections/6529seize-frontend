import { formatAddress } from "@/helpers/Helpers";
import { logErrorSecurely } from "@/utils/error-sanitizer";
import { formatUnits } from "viem";
import { useAccount, useBalance, useEnsName } from "wagmi";
import { useSeizeConnectContext } from "../auth/SeizeConnectContext";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faPlugCircleXmark } from "@fortawesome/free-solid-svg-icons";

function addThousandsSeparators(value: string): string {
  let formatted = "";
  let digitsInGroup = 0;

  for (let index = value.length - 1; index >= 0; index -= 1) {
    const character = value[index];
    if (character === undefined) {
      continue;
    }

    if (digitsInGroup === 3) {
      formatted = `,${formatted}`;
      digitsInGroup = 0;
    }

    formatted = `${character}${formatted}`;
    digitsInGroup += 1;
  }

  return formatted;
}

function trimTrailingZeroes(value: string): string {
  let end = value.length;

  while (end > 0 && value[end - 1] === "0") {
    end -= 1;
  }

  return value.slice(0, end);
}

function formatWeiBalance(value: bigint, decimals: number): string {
  const s = formatUnits(value, decimals);
  const [whole = "0", frac = ""] = s.split(".");
  const grouped = addThousandsSeparators(whole);
  const shortFrac = trimTrailingZeroes(frac.slice(0, 4));
  return shortFrac ? `${grouped}.${shortFrac}` : grouped;
}

export default function WalletConnectBalance() {
  const account = useAccount();
  const { data: balance, isPending: balancePending } = useBalance({
    address: account.address,
    chainId: account.chainId,
  });
  const ens = useEnsName({
    address: account.address,
    chainId: 1,
  });
  const accountDisplay = ens.data
    ? `${ens.data}`
    : formatAddress(account.address?.toString() ?? "");

  const { seizeConnect, seizeConnectOpen, seizeDisconnect } =
    useSeizeConnectContext();
  const handleDisconnect = async () => {
    try {
      await seizeDisconnect();
    } catch (error) {
      logErrorSecurely("wallet_connect_balance_disconnect", error);
    }
  };

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
      <div className="tw-flex tw-min-w-0 tw-flex-1 tw-select-none tw-items-center tw-gap-x-2 tw-rounded-l-full tw-pl-3 tw-pr-2 tw-font-medium">
        <span className="tw-truncate tw-text-black">{accountDisplay}</span>
        <span className="tw-shrink-0 tw-whitespace-nowrap tw-text-iron-500">
          {balancePending || balance?.value == null || balance.decimals == null
            ? "…"
            : `${formatWeiBalance(balance.value, balance.decimals)} ${balance.symbol}`}
        </span>
      </div>
      <div
        className="tw-w-[2px] tw-shrink-0 tw-self-stretch tw-bg-black"
        aria-hidden
      />
      <button
        type="button"
        aria-label="Disconnect wallet"
        onClick={handleDisconnect}
        className="tw-flex tw-shrink-0 tw-items-center tw-justify-center tw-rounded-r-full tw-border-0 tw-bg-transparent tw-px-3 tw-text-black tw-ring-0 tw-transition-colors hover:tw-bg-iron-100 focus:tw-outline-none focus-visible:tw-bg-iron-100"
      >
        <FontAwesomeIcon icon={faPlugCircleXmark} className="tw-h-4 tw-w-4" />
      </button>
    </div>
  );
}
