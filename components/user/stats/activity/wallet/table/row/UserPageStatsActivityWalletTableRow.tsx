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
        <div>
          <svg
            className="tw-flex-shrink-0 tw-h-5 tw-w-5 tw-text-iron-300"
            x="0px"
            y="0px"
            viewBox="0 0 494.06 494.06"
            width="512"
            height="512"
          >
            <g>
              <path
                fill="currentColor"
                d="M259.18,58.7H106.39c-8.29,0-15,6.71-15,15v105.86c0,8.28,6.71,15,15,15h152.79c8.28,0,15-6.72,15-15V73.7   C274.18,65.41,267.46,58.7,259.18,58.7z M244.18,164.56H121.39V88.7h122.79V164.56z"
              ></path>
              <path
                fill="currentColor"
                d="M471.96,85.81l-0.005-0.002l-64.033-60.604c-6.017-5.694-15.51-5.433-21.205,0.584c-5.694,6.017-5.434,15.51,0.584,21.205   l33.228,31.449c-20.81,7.71-35.689,27.77-35.689,51.229c0,24.41,16.11,45.14,38.25,52.1v185.58c0,4.97-4.05,9.01-9.01,9.01   c-4.97,0-9.01-4.04-9.01-9.01v-94.3c0-24.8-20.19-44.99-44.99-44.99h-34.79V50.05c0-24.82-20.18-45-45-45H85.27   c-24.81,0-45,20.18-45,45v333.78h-5.19C15.73,383.83,0,399.57,0,418.92v55.09c0,8.29,6.71,15,15,15h335.57c8.28,0,15-6.71,15-15   v-55.09c0-19.35-15.74-35.09-35.09-35.09h-5.19V258.06h34.79c8.26,0,14.99,6.73,14.99,14.99v94.3c0,21.51,17.5,39.01,39.01,39.01   s39.01-17.5,39.01-39.01V182.56c23.53-6.08,40.97-27.49,40.97-52.89C494.06,111.73,485.36,95.78,471.96,85.81z M295.29,383.83   H70.27V50.05c0-8.27,6.73-15,15-15h195.02c8.28,0,15,6.73,15,15C295.29,55.79,295.29,378.771,295.29,383.83z M335.57,418.92v40.09   H30v-40.09c0-2.81,2.28-5.09,5.08-5.09c11.613,0,281.437,0,295.4,0C333.29,413.83,335.57,416.11,335.57,418.92z M439.45,154.28   c-13.54,0-24.61-11.023-24.61-24.61c0-13.57,11.04-24.61,24.61-24.61s24.61,11.04,24.61,24.61   C464.06,143.247,453.011,154.28,439.45,154.28z"
              ></path>
            </g>
          </svg>
        </div>
        <div>
          <img
            src="/pepe-smile.png"
            className="tw-h-5 tw-w-5 tw-object-contain tw-flex-shrink-0"
            alt="pepe-smile"
          />
          <img
            src="/pepe-xglasses.png"
            className="tw-hidden tw-h-5 tw-w-5 tw-object-contain tw-flex-shrink-0"
            alt="pepe-xglasses"
          />
        </div>
        <button
          type="button"
          className="tw-bg-transparent tw-border-none tw-p-0"
        >
          <div className="-tw-mt-1 tw-flex-shrink-0 tw-w-6 tw-h-6 sm:tw-w-5 sm:tw-h-5 hover:tw-scale-110 tw-transition tw-duration-300 tw-ease-out">
            <EtherscanIcon />
          </div>
        </button>
      </td>
      <td className="tw-py-2.5 tw-w-24 tw-pl-4 tw-text-right">
        <CommonTimeAgo
          timestamp={new Date(transaction.transaction_date).getTime()}
        />
      </td>
    </tr>
  );
}
