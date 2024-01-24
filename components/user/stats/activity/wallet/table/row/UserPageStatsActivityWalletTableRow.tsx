import { useEffect, useState } from "react";
import { Transaction } from "../../../../../../../entities/ITransaction";
import CommonTimeAgo from "../../../../../../utils/CommonTimeAgo";
import UserPageStatsActivityWalletTableRowIcon from "./UserPageStatsActivityWalletTableRowIcon";
import { areEqualAddresses } from "../../../../../../../helpers/Helpers";
import {
  GRADIENT_CONTRACT,
  MANIFOLD,
  MEMELAB_CONTRACT,
  MEMES_CONTRACT,
  NULL_ADDRESS,
  NULL_DEAD_ADDRESS,
} from "../../../../../../../constants";
import { IProfileAndConsolidations } from "../../../../../../../entities/IProfile";
import UserPageStatsActivityWalletTableRowMainAddress from "./UserPageStatsActivityWalletTableRowMainAddress";
import { MemeLite } from "../../../../../settings/UserSettingsImgSelectMeme";
import UserPageStatsActivityWalletTableRowSecondAddress from "./UserPageStatsActivityWalletTableRowSecondAddress";
import Link from "next/link";
import EtherscanIcon from "../../../../../utils/icons/EtherscanIcon";
import UserPageStatsActivityWalletTableRowRoyalties from "./UserPageStatsActivityWalletTableRowRoyalties";
import UserPageStatsActivityWalletTableRowGas from "./UserPageStatsActivityWalletTableRowGas";

export enum TransactionType {
  AIRDROP = "AIRDROP",
  MINT = "MINT",
  SALE = "SALE",
  PURCHASE = "PURCHASE",
  TRANSFER_IN = "TRANSFER_IN",
  TRANSFER_OUT = "TRANSFER_OUT",
  BURN = "BURN",
}

const TYPE_TP_ACTION: Record<TransactionType, string> = {
  [TransactionType.AIRDROP]: "received airdrop",
  [TransactionType.MINT]: "minted",
  [TransactionType.SALE]: "sold",
  [TransactionType.PURCHASE]: "purchased",
  [TransactionType.TRANSFER_IN]: "received",
  [TransactionType.TRANSFER_OUT]: "transferred",
  [TransactionType.BURN]: "burned",
};

export default function UserPageStatsActivityWalletTableRow({
  transaction,
  profile,
  memes,
}: {
  readonly transaction: Transaction;
  readonly profile: IProfileAndConsolidations;
  readonly memes: MemeLite[];
}) {
  const getShowRoyalties = (): boolean => {
    if (!transaction.value) {
      return false;
    }

    if (areEqualAddresses(transaction.from_address, NULL_ADDRESS)) {
      return false;
    }

    if (areEqualAddresses(transaction.from_address, NULL_DEAD_ADDRESS)) {
      return false;
    }

    if (areEqualAddresses(transaction.from_address, MANIFOLD)) {
      return false;
    }

    if (!transaction.royalties) {
      return false;
    }

    return true;
  };

  const showRoyalties = getShowRoyalties();

  const [consolidatedAddresses, setConsolidatedAddresses] = useState<string[]>(
    profile.consolidation.wallets.map((w) => w.wallet.address.toLowerCase())
  );

  useEffect(
    () =>
      setConsolidatedAddresses(
        profile.consolidation.wallets.map((w) => w.wallet.address.toLowerCase())
      ),
    [profile]
  );

  const getType = (): TransactionType => {
    if (
      areEqualAddresses(NULL_ADDRESS, transaction.from_address) &&
      !transaction.value
    ) {
      return TransactionType.AIRDROP;
    }

    if (
      areEqualAddresses(NULL_ADDRESS, transaction.from_address) ||
      areEqualAddresses(MANIFOLD, transaction.from_address)
    ) {
      return TransactionType.MINT;
    }

    if (
      areEqualAddresses(NULL_ADDRESS, transaction.to_address) ||
      areEqualAddresses(NULL_DEAD_ADDRESS, transaction.to_address)
    ) {
      return TransactionType.BURN;
    }

    if (
      transaction.value &&
      consolidatedAddresses.includes(transaction.to_address.toLowerCase())
    ) {
      return TransactionType.PURCHASE;
    }

    if (
      transaction.value &&
      consolidatedAddresses.includes(transaction.from_address.toLowerCase())
    ) {
      return TransactionType.SALE;
    }

    if (consolidatedAddresses.includes(transaction.to_address.toLowerCase())) {
      return TransactionType.TRANSFER_IN;
    }
    return TransactionType.TRANSFER_OUT;
  };

  const type = getType();

  const meme = memes.find((m) => m.id === transaction.token_id);
  const showAnotherSide = [
    TransactionType.PURCHASE,
    TransactionType.SALE,
    TransactionType.TRANSFER_IN,
    TransactionType.TRANSFER_OUT,
  ].includes(type);

  const value = transaction.value;

  const getPath = (): string => {
    if (areEqualAddresses(MEMES_CONTRACT, transaction.contract)) {
      return `/the-memes/${transaction.token_id}`;
    }
    if (areEqualAddresses(GRADIENT_CONTRACT, transaction.contract)) {
      return `/6529-gradient/${transaction.token_id}`;
    }
    if (areEqualAddresses(MEMELAB_CONTRACT, transaction.contract)) {
      return `/meme-lab/${transaction.token_id}`;
    }
    return "";
  };

  return (
    <tr className="tw-flex tw-items-center tw-justify-between">
      <td className="tw-flex-1 tw-py-2.5 tw-gap-x-1 tw-inline-flex tw-items-center">
        <UserPageStatsActivityWalletTableRowIcon type={type} />
        <UserPageStatsActivityWalletTableRowMainAddress
          transaction={transaction}
          type={type}
          profile={profile}
        />
        <div className="tw-whitespace-nowrap tw-text-sm tw-text-iron-400 tw-font-medium">
          {TYPE_TP_ACTION[type]}
        </div>
        {transaction.token_count > 1 && (
          <div className="tw-whitespace-nowrap tw-text-sm tw-text-iron-300 tw-font-medium">
            x{transaction.token_count}
          </div>
        )}
        <div className="tw-whitespace-nowrap tw-text-sm tw-font-medium">
          <Link
            className="tw-no-underline hover:tw-underline tw-text-iron-100 hover:tw-text-iron-400 tw-transition tw-duration-300 tw-ease-out"
            href={getPath()}
          >
            {meme?.name} (#{transaction.token_id})
          </Link>
        </div>
        <img
          className="tw-mx-0.5 tw-flex-shrink-0 tw-object-contain tw-max-h-10 tw-min-w-10 tw-w-auto tw-h-auto tw-rounded-sm tw-ring-1 tw-ring-white/30 tw-bg-iron-800"
          src={meme?.icon ?? ""}
          alt={meme?.name ?? ""}
        />
        <div className="tw-whitespace-nowrap tw-text-sm tw-text-iron-100 tw-font-medium">
          {showAnotherSide && (
            <UserPageStatsActivityWalletTableRowSecondAddress
              type={type}
              transaction={transaction}
            />
          )}
        </div>
        {!!value && (
          <div className="tw-inline-flex tw-items-center tw-whitespace-nowrap tw-text-sm tw-text-iron-400 tw-font-medium">
            for{" "}
            <span className="tw-ml-0.5 tw-inline-flex tw-items-center">
              <svg
                className="tw-h-5 tw-w-5"
                enableBackground="new 0 0 1920 1920"
                viewBox="0 0 1920 1920"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path d="m959.8 80.7-539.7 895.6 539.7-245.3z" fill="#8a92b2" />
                <path d="m959.8 731-539.7 245.3 539.7 319.1z" fill="#62688f" />
                <path d="m1499.6 976.3-539.8-895.6v650.3z" fill="#62688f" />
                <path
                  d="m959.8 1295.4 539.8-319.1-539.8-245.3z"
                  fill="#454a75"
                />
                <path d="m420.1 1078.7 539.7 760.6v-441.7z" fill="#8a92b2" />
                <path d="m959.8 1397.6v441.7l540.1-760.6z" fill="#62688f" />
              </svg>
              <span className="tw-whitespace-nowrap tw-text-iron-100">
                {value}
              </span>
            </span>
          </div>
        )}
      </td>
      <td className="tw-py-2.5 tw-w-36 tw-flex tw-items-center tw-justify-end tw-text-right tw-gap-x-4 tw-px-4">
        {showRoyalties && (
          <div>
            <UserPageStatsActivityWalletTableRowRoyalties
              transactionValue={transaction.value}
              royalties={transaction.royalties}
            />
          </div>
        )}
        <UserPageStatsActivityWalletTableRowGas
          gas={transaction.gas}
          gasGwei={transaction.gas_gwei}
          gasPriceGwei={transaction.gas_price_gwei}
        />

        <a
          href={`https://etherscan.io/tx/${transaction.transaction}`}
          target="_blank"
          rel="noopener noreferrer"
          className="tw-bg-transparent tw-border-none tw-p-0"
        >
          <div className="-tw-mt-1 tw-flex-shrink-0 tw-w-6 tw-h-6 sm:tw-w-5 sm:tw-h-5 hover:tw-scale-110 tw-transition tw-duration-300 tw-ease-out">
            <EtherscanIcon />
          </div>
        </a>
      </td>
      <td className="tw-py-2.5 tw-w-24 tw-pl-4 tw-text-right">
        <CommonTimeAgo
          timestamp={new Date(transaction.transaction_date).getTime()}
        />
      </td>
    </tr>
  );
}
