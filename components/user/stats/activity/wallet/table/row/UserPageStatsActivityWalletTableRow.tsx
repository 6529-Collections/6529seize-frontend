"use client";

import { getNextGenIconUrl } from "@/components/nextGen/collections/nextgenToken/NextGenTokenImage";
import { normalizeNextgenTokenID } from "@/components/nextGen/nextgen_helpers";
import { MemeLite } from "@/components/user/settings/UserSettingsImgSelectMeme";
import EtherscanIcon from "@/components/user/utils/icons/EtherscanIcon";
import CommonTimeAgo from "@/components/utils/CommonTimeAgo";
import {
  GRADIENT_CONTRACT,
  MANIFOLD,
  MEMELAB_CONTRACT,
  MEMES_CONTRACT,
  NULL_ADDRESS,
  NULL_DEAD_ADDRESS,
} from "@/constants";
import { NextGenCollection } from "@/entities/INextgen";
import { Transaction } from "@/entities/ITransaction";
import { ApiIdentity } from "@/generated/models/ApiIdentity";
import {
  areEqualAddresses,
  isGradientsContract,
  isMemesContract,
  isNextgenContract,
} from "@/helpers/Helpers";
import Link from "next/link";
import { useEffect, useState } from "react";
import UserPageStatsActivityWalletTableRowGas from "./UserPageStatsActivityWalletTableRowGas";
import UserPageStatsActivityWalletTableRowIcon from "./UserPageStatsActivityWalletTableRowIcon";
import UserPageStatsActivityWalletTableRowMainAddress from "./UserPageStatsActivityWalletTableRowMainAddress";
import UserPageStatsActivityWalletTableRowRoyalties from "./UserPageStatsActivityWalletTableRowRoyalties";
import UserPageStatsActivityWalletTableRowSecondAddress from "./UserPageStatsActivityWalletTableRowSecondAddress";

export enum TransactionType {
  AIRDROPPED = "AIRDROPPED",
  RECEIVED_AIRDROP = "RECEIVED_AIRDROP",
  SEIZED = "SEIZED",
  SEIZED_TO = "SEIZED_TO",
  SALE = "SALE",
  PURCHASE = "PURCHASE",
  TRANSFER_IN = "TRANSFER_IN",
  TRANSFER_OUT = "TRANSFER_OUT",
  BURNED = "BURNED",
  RECEIVED_BURN = "RECEIVED_BURN",
}

const TYPE_TP_ACTION: Record<TransactionType, string> = {
  [TransactionType.RECEIVED_AIRDROP]: "received airdrop",
  [TransactionType.SEIZED]: "seized",
  [TransactionType.SEIZED_TO]: "seized",
  [TransactionType.SALE]: "sold",
  [TransactionType.PURCHASE]: "purchased",
  [TransactionType.TRANSFER_IN]: "received",
  [TransactionType.TRANSFER_OUT]: "transferred",
  [TransactionType.BURNED]: "burned",
  [TransactionType.RECEIVED_BURN]: "received burn",
  [TransactionType.AIRDROPPED]: "airdropped",
};

const NULL_AND_DEAD_ADDRESSES = [NULL_ADDRESS, NULL_DEAD_ADDRESS].map((w) =>
  w.toLowerCase()
);
const MINTING_ADDRESSES = [NULL_ADDRESS, MANIFOLD].map((w) => w.toLowerCase());

export default function UserPageStatsActivityWalletTableRow({
  transaction,
  profile,
  memes,
  nextgenCollections,
}: {
  readonly transaction: Transaction;
  readonly profile: ApiIdentity;
  readonly memes: MemeLite[];
  readonly nextgenCollections: NextGenCollection[];
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
    profile.wallets?.map((w) => w.wallet.toLowerCase()) ?? []
  );

  useEffect(
    () =>
      setConsolidatedAddresses(
        profile.wallets?.map((w) => w.wallet.toLowerCase()) ?? []
      ),
    [profile]
  );

  const includingAddresses = ({
    address,
    addresses,
  }: {
    readonly address: string;
    readonly addresses: string[];
  }): boolean =>
    addresses.some((a) =>
      areEqualAddresses(a.toLowerCase(), address.toLowerCase())
    );

  const getAirDropType = (): TransactionType =>
    profile.wallets?.some((w) =>
      includingAddresses({
        address: w.wallet,
        addresses: NULL_AND_DEAD_ADDRESSES,
      })
    )
      ? TransactionType.AIRDROPPED
      : TransactionType.RECEIVED_AIRDROP;

  const getMintingType = (): TransactionType =>
    profile.wallets?.some((w) =>
      includingAddresses({
        address: w.wallet,
        addresses: MINTING_ADDRESSES,
      })
    )
      ? TransactionType.SEIZED_TO
      : TransactionType.SEIZED;

  const getBurnType = (): TransactionType =>
    profile.wallets?.some((w) =>
      includingAddresses({
        address: w.wallet,
        addresses: NULL_AND_DEAD_ADDRESSES,
      })
    )
      ? TransactionType.RECEIVED_BURN
      : TransactionType.BURNED;

  const getType = (): TransactionType => {
    if (
      areEqualAddresses(NULL_ADDRESS, transaction.from_address) &&
      !transaction.value
    ) {
      return getAirDropType();
    }

    if (
      includingAddresses({
        address: transaction.from_address,
        addresses: MINTING_ADDRESSES,
      })
    ) {
      return getMintingType();
    }

    if (
      includingAddresses({
        address: transaction.to_address,
        addresses: NULL_AND_DEAD_ADDRESSES,
      })
    ) {
      return getBurnType();
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

  const meme = isMemesContract(transaction.contract)
    ? memes.find((m) => m.id === transaction.token_id)
    : null;
  const showAnotherSide = [
    TransactionType.PURCHASE,
    TransactionType.SALE,
    TransactionType.TRANSFER_IN,
    TransactionType.TRANSFER_OUT,
    TransactionType.RECEIVED_BURN,
    TransactionType.AIRDROPPED,
    TransactionType.SEIZED_TO,
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
    if (isNextgenContract(transaction.contract)) {
      return `/nextgen/token/${transaction.token_id}`;
    }
    return "";
  };

  const getLinkContent = () => {
    let name = meme?.name ?? "";
    if (isNextgenContract(transaction.contract)) {
      const normalizedToken = normalizeNextgenTokenID(transaction.token_id);
      const collectionName =
        nextgenCollections.find((c) => c.id === normalizedToken.collection_id)
          ?.name ?? `NextGen #${normalizedToken.collection_id}`;
      name = `${collectionName} #${normalizedToken.token_id}`;
    }
    if (isGradientsContract(transaction.contract)) {
      name = `6529 Gradient #${transaction.token_id}`;
    }

    return name;
  };

  const getImageSrc = () => {
    let src = meme?.icon ?? "";
    if (isNextgenContract(transaction.contract)) {
      src = getNextGenIconUrl(transaction.token_id);
    }
    return src;
  };

  const showValue = (): boolean => {
    if (!value) {
      return false;
    }
    if (type === TransactionType.RECEIVED_BURN) {
      return false;
    }

    if (type === TransactionType.BURNED) {
      return false;
    }

    if (type === TransactionType.RECEIVED_AIRDROP) {
      return false;
    }

    if (type === TransactionType.AIRDROPPED) {
      return false;
    }

    return true;
  };

  return (
    <tr className="tw-flex tw-items-center tw-justify-between">
      <td className="tw-py-2.5 tw-flex-1">
        <span className="tw-inline-flex tw-items-center tw-gap-x-1">
          <UserPageStatsActivityWalletTableRowIcon type={type} />
          <UserPageStatsActivityWalletTableRowMainAddress
            transaction={transaction}
            type={type}
            profile={profile}
          />
          <span className="tw-whitespace-nowrap tw-text-sm sm:tw-text-base tw-text-iron-400 tw-font-medium">
            {TYPE_TP_ACTION[type]}
          </span>
          {transaction.token_count > 1 && (
            <span className="tw-whitespace-nowrap tw-text-base tw-text-iron-300 tw-font-medium">
              x{transaction.token_count}
            </span>
          )}
          <span className="tw-whitespace-nowrap tw-text-sm sm:tw-text-base tw-font-medium">
            <Link
              className="tw-text-iron-100 hover:tw-text-iron-400 tw-transition tw-duration-300 tw-ease-out"
              href={getPath()}>
              {getLinkContent()}
            </Link>
          </span>
          <img
            className="tw-mx-0.5 tw-flex-shrink-0 tw-object-contain tw-max-h-10 tw-min-w-10 tw-w-auto tw-h-auto tw-rounded-sm tw-ring-1 tw-ring-white/30 tw-bg-iron-800"
            src={getImageSrc()}
            alt={meme?.name ?? ""}
          />
          <span className="tw-whitespace-nowrap tw-text-sm sm:tw-text-base tw-text-iron-100 tw-font-medium">
            {showAnotherSide && (
              <UserPageStatsActivityWalletTableRowSecondAddress
                type={type}
                transaction={transaction}
              />
            )}
          </span>
          {showValue() && (
            <span className="tw-inline-flex tw-items-center tw-whitespace-nowrap tw-text-sm sm:tw-text-base tw-text-iron-400 tw-font-medium">
              for{" "}
              <span className="tw-ml-0.5 tw-inline-flex tw-items-center">
                <svg
                  className="tw-h-5 tw-w-5"
                  aria-hidden="true"
                  aria-label="ethereum"
                  enableBackground="new 0 0 1920 1920"
                  viewBox="0 0 1920 1920"
                  xmlns="http://www.w3.org/2000/svg">
                  <path
                    d="m959.8 80.7-539.7 895.6 539.7-245.3z"
                    fill="#8a92b2"
                  />
                  <path
                    d="m959.8 731-539.7 245.3 539.7 319.1z"
                    fill="#62688f"
                  />
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
            </span>
          )}
        </span>
      </td>
      <td className="tw-py-2.5 tw-h-full tw-text-right tw-px-6 sm:tw-px-4">
        <span className="tw-flex tw-items-center tw-justify-end">
          {showRoyalties && (
            <UserPageStatsActivityWalletTableRowRoyalties
              transactionValue={transaction.value}
              royalties={transaction.royalties}
            />
          )}
          <UserPageStatsActivityWalletTableRowGas
            gas={transaction.gas}
            gasGwei={transaction.gas_gwei}
            gasPriceGwei={transaction.gas_price_gwei}
          />
          <a
            href={`https://etherscan.io/tx/${transaction.transaction}`}
            target="_blank"
            title="Go to etherscan"
            aria-label="Go to etherscan"
            rel="noopener noreferrer"
            className="tw-bg-transparent tw-border-none tw-h-10 tw-w-10 tw-flex tw-justify-center tw-items-center hover:tw-scale-110 tw-rounded-full focus:tw-outline-none focus:tw-ring-1 focus:tw-ring-inset focus:tw-ring-primary-400 tw-transition tw-duration-300 tw-ease-out">
            <span className="tw-flex-shrink-0 tw-w-6 tw-h-6 sm:tw-w-5 sm:tw-h-5">
              <EtherscanIcon />
            </span>
          </a>
        </span>
      </td>
      <td className="tw-py-2.5 tw-w-24 sm:tw-w-32 tw-text-right">
        <CommonTimeAgo
          timestamp={new Date(transaction.transaction_date).getTime()}
        />
      </td>
    </tr>
  );
}
