"use client";

import LatestActivityRow from "@/components/latest-activity/LatestActivityRow";
import NFTImage from "@/components/nft-image/NFTImage";
import TransferSingle from "@/components/nft-transfer/TransferSingle";
import { MEMELAB_CONTRACT, NULL_ADDRESS } from "@/constants/constants";
import type { LabNFT } from "@/entities/INFT";
import { CollectedCollectionType } from "@/entities/IProfile";
import type { Transaction } from "@/entities/ITransaction";
import { areEqualAddresses, printMintDate } from "@/helpers/Helpers";
import { ContractType } from "@/types/enums";
import clsx from "clsx";
import type { ReactNode } from "react";

type MemeLabWallet = {
  readonly wallet: string;
};

type MemeLabWalletSummary = {
  readonly firstAcquired?: Transaction | undefined;
  readonly airdropped: readonly Transaction[];
  readonly transferredIn: readonly Transaction[];
  readonly transferredOut: readonly Transaction[];
  readonly bought: readonly Transaction[];
  readonly boughtSum: number;
  readonly sold: readonly Transaction[];
  readonly soldSum: number;
};

function getTokenCount(transactions: readonly Transaction[]) {
  return transactions.reduce((count, transaction) => {
    return count + transaction.token_count;
  }, 0);
}

function findFirstAcquired(
  transactions: readonly Transaction[]
): Transaction | undefined {
  if (transactions.length === 0) {
    return undefined;
  }

  return transactions.reduce((earliest, transaction) => {
    return new Date(transaction.transaction_date) <
      new Date(earliest.transaction_date)
      ? transaction
      : earliest;
  });
}

function summarizeWalletTransactions(
  transactions: readonly Transaction[],
  wallets: readonly string[]
): MemeLabWalletSummary {
  const airdropped = transactions.filter(
    (transaction) =>
      transaction.value === 0 &&
      areEqualAddresses(transaction.from_address, NULL_ADDRESS)
  );

  const transferredIn =
    wallets.length === 0
      ? []
      : transactions.filter(
          (transaction) =>
            !areEqualAddresses(transaction.from_address, NULL_ADDRESS) &&
            wallets.some((wallet) =>
              areEqualAddresses(transaction.to_address, wallet)
            ) &&
            transaction.value === 0
        );

  const transferredOut =
    wallets.length === 0
      ? []
      : transactions.filter(
          (transaction) =>
            wallets.some((wallet) =>
              areEqualAddresses(transaction.from_address, wallet)
            ) && transaction.value === 0
        );

  const bought =
    wallets.length === 0
      ? []
      : transactions.filter(
          (transaction) =>
            wallets.some((wallet) =>
              areEqualAddresses(transaction.to_address, wallet)
            ) && transaction.value > 0
        );

  const sold =
    wallets.length === 0
      ? []
      : transactions.filter(
          (transaction) =>
            wallets.some((wallet) =>
              areEqualAddresses(transaction.from_address, wallet)
            ) && transaction.value > 0
        );

  return {
    firstAcquired: findFirstAcquired(transactions),
    airdropped,
    transferredIn,
    transferredOut,
    bought,
    boughtSum: bought.reduce((sum, transaction) => {
      return sum + transaction.value;
    }, 0),
    sold,
    soldSum: sold.reduce((sum, transaction) => {
      return sum + transaction.value;
    }, 0),
  };
}

function MemeLabOverviewLine({
  children,
  className,
}: {
  readonly children: ReactNode;
  readonly className?: string | undefined;
}) {
  return (
    <div
      className={clsx(
        "tw-text-lg tw-font-bold tw-leading-7 tw-text-iron-50",
        className
      )}
    >
      {children}
    </div>
  );
}

function MemeLabTokenCountLine({
  count,
  label,
  suffix,
}: {
  readonly count: number;
  readonly label: string;
  readonly suffix?: string | undefined;
}) {
  return (
    <>
      {count} {label}
      {count > 1 && "s"}
      {suffix}
    </>
  );
}

function MemeLabYourCardsSummary({
  nft,
  nftBalance,
  transactions,
  wallets,
  userLoaded,
}: {
  readonly nft: LabNFT;
  readonly nftBalance: number;
  readonly transactions: readonly Transaction[];
  readonly wallets: readonly string[];
  readonly userLoaded: boolean;
}) {
  const summary = summarizeWalletTransactions(transactions, wallets);
  const hasConnectedWallets = wallets.length > 0;
  const hasOwnedCardTransactions =
    transactions.length > 0 && hasConnectedWallets && nftBalance > 0;

  return (
    <section className="tw-min-w-0">
      <div className="tw-space-y-2">
        {!hasConnectedWallets && (
          <div className="tw-pt-2">
            <h4 className="tw-mb-0 tw-text-xl tw-font-semibold tw-leading-7 tw-text-iron-50">
              Connect your wallet to view your cards.
            </h4>
          </div>
        )}
        {nftBalance === 0 && hasConnectedWallets && userLoaded && (
          <div className="tw-pt-2">
            <h3 className="tw-mb-0 tw-text-2xl tw-font-semibold tw-leading-8 tw-text-iron-50">
              You don&apos;t own any editions of Card {nft.id}
            </h3>
          </div>
        )}
        {hasOwnedCardTransactions && (
          <>
            <div className="tw-pt-2 md:tw-max-w-[66.666667%]">
              <div className="tw-flex tw-items-center tw-justify-between tw-text-lg tw-font-bold tw-leading-7 tw-text-iron-50">
                <span>Cards</span>
                <span>{`x${nftBalance}`}</span>
              </div>
            </div>
            <div className="tw-mb-2">
              <TransferSingle
                collectionType={CollectedCollectionType.MEMELAB}
                contractType={ContractType.ERC1155}
                contract={MEMELAB_CONTRACT}
                tokenId={nft.id}
                max={nftBalance}
                title={nft.name}
                thumbUrl={nft.thumbnail}
              />
            </div>
          </>
        )}
        {transactions.length > 0 && (
          <div className="tw-space-y-1 tw-pt-2">
            <h3 className="tw-mb-0 tw-pb-2 tw-text-2xl tw-font-semibold tw-leading-8 tw-text-iron-50">
              Overview
            </h3>
            {summary.firstAcquired && (
              <MemeLabOverviewLine className="tw-pb-2">
                First acquired{" "}
                {printMintDate(
                  new Date(summary.firstAcquired.transaction_date)
                )}
              </MemeLabOverviewLine>
            )}
            {summary.airdropped.length > 0 && (
              <MemeLabOverviewLine>
                <MemeLabTokenCountLine
                  count={getTokenCount(summary.airdropped)}
                  label="card"
                  suffix=" airdropped"
                />
              </MemeLabOverviewLine>
            )}
            {summary.bought.length > 0 && (
              <MemeLabOverviewLine>
                <MemeLabTokenCountLine
                  count={getTokenCount(summary.bought)}
                  label="card"
                  suffix={` bought for ${summary.boughtSum} ETH`}
                />
              </MemeLabOverviewLine>
            )}
            {summary.transferredIn.length > 0 && (
              <MemeLabOverviewLine>
                <MemeLabTokenCountLine
                  count={getTokenCount(summary.transferredIn)}
                  label="card"
                  suffix=" transferred in"
                />
              </MemeLabOverviewLine>
            )}
            {summary.sold.length > 0 && (
              <MemeLabOverviewLine>
                <MemeLabTokenCountLine
                  count={getTokenCount(summary.sold)}
                  label="card"
                  suffix={` sold for ${summary.soldSum} ETH`}
                />
              </MemeLabOverviewLine>
            )}
            {summary.transferredOut.length > 0 && (
              <MemeLabOverviewLine>
                <MemeLabTokenCountLine
                  count={getTokenCount(summary.transferredOut)}
                  label="card"
                  suffix=" transferred out"
                />
              </MemeLabOverviewLine>
            )}
          </div>
        )}
      </div>
    </section>
  );
}

export function MemeLabYourTransactionsTable({
  transactions,
}: {
  readonly transactions: readonly Transaction[];
}) {
  if (transactions.length === 0) {
    return null;
  }

  return (
    <section>
      <div className="tw-w-full tw-overflow-x-auto [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:tw-hidden">
        <table className="tw-min-w-full tw-border-separate tw-border-spacing-0">
          <tbody>
            {transactions.map((transaction) => (
              <LatestActivityRow
                tr={transaction}
                variant="tailwind"
                rowStyle="striped"
                key={`${transaction.from_address}-${transaction.to_address}-${transaction.transaction}-${transaction.token_id}`}
              />
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}

export function MemeLabYourCardsPanel({
  nft,
  nftBalance,
  transactions,
  wallets,
  userLoaded,
  hasImagePadding,
}: {
  readonly nft: LabNFT | undefined;
  readonly nftBalance: number;
  readonly transactions: readonly Transaction[];
  readonly wallets: readonly MemeLabWallet[];
  readonly userLoaded: boolean;
  readonly hasImagePadding: boolean;
}) {
  if (!nft) {
    return null;
  }

  return (
    <div className={clsx(hasImagePadding && "tw-pb-[35px]")}>
      <div className="tw-grid tw-grid-cols-1 tw-gap-x-10 md:tw-grid-cols-2">
        <div className="tw-flex tw-min-w-0 tw-items-center tw-pb-5 tw-pt-2">
          <NFTImage
            nft={nft}
            animation={true}
            height={650}
            showBalance={true}
          />
        </div>
        <MemeLabYourCardsSummary
          nft={nft}
          nftBalance={nftBalance}
          transactions={transactions}
          wallets={wallets.map((wallet) => wallet.wallet)}
          userLoaded={userLoaded}
        />
      </div>
    </div>
  );
}
