"use client";

import { TransferSingleActions } from "@/components/nft-transfer/TransferSingle";
import { MEMES_CONTRACT, NULL_ADDRESS } from "@/constants/constants";
import type { NFT, NftRank, NftTDH } from "@/entities/INFT";
import { CollectedCollectionType } from "@/entities/IProfile";
import type { ConsolidatedTDH } from "@/entities/ITDH";
import type { Transaction } from "@/entities/ITransaction";
import {
  areEqualAddresses,
  numberWithCommas,
  printMintDate,
} from "@/helpers/Helpers";
import useDeviceInfo from "@/hooks/useDeviceInfo";
import { ContractType } from "@/types/enums";
import LatestActivityRow from "../latest-activity/LatestActivityRow";

function MemePageYourCardsTransferCard(props: {
  readonly transferNft: NFT;
  readonly nftBalance: number;
  readonly myTDH: NftTDH | undefined;
  readonly myRank: NftRank | undefined;
}) {
  const { isMobileDevice } = useDeviceInfo();

  const statsContent = (
    <div className="tw-flex tw-w-full tw-flex-wrap tw-items-center tw-justify-between tw-gap-x-6 tw-gap-y-3 sm:tw-w-auto sm:tw-shrink-0 sm:tw-justify-start sm:tw-gap-x-8">
      <div className="tw-inline-flex tw-items-baseline tw-gap-1.5 tw-whitespace-nowrap sm:tw-flex sm:tw-flex-col sm:tw-gap-1">
        <span className="tw-text-[10px] tw-font-bold tw-uppercase tw-tracking-wider tw-text-iron-500">
          {isMobileDevice ? "Your Cards" : "Cards"}
        </span>
        <span className="tw-whitespace-nowrap tw-text-sm tw-font-bold tw-text-white">{`x${props.nftBalance}`}</span>
      </div>
      {props.myRank && props.myTDH ? (
        <>
          <div className="tw-inline-flex tw-items-baseline tw-gap-1.5 tw-whitespace-nowrap sm:tw-flex sm:tw-flex-col sm:tw-gap-1">
            <span className="tw-text-[10px] tw-font-bold tw-uppercase tw-tracking-wider tw-text-iron-500">
              TDH
            </span>
            <span className="tw-whitespace-nowrap tw-text-sm tw-font-bold tw-text-white">
              {numberWithCommas(Math.round(props.myTDH.tdh))}
            </span>
          </div>
          <div className="tw-inline-flex tw-items-baseline tw-gap-1.5 tw-whitespace-nowrap sm:tw-flex sm:tw-flex-col sm:tw-gap-1">
            <span className="tw-text-[10px] tw-font-bold tw-uppercase tw-tracking-wider tw-text-iron-500">
              Rank
            </span>
            <span className="tw-whitespace-nowrap tw-text-sm tw-font-bold tw-text-white">
              #{props.myRank.rank}
            </span>
          </div>
        </>
      ) : (
        <div className="tw-text-xs tw-font-medium tw-text-iron-500">
          No TDH accrued
        </div>
      )}
    </div>
  );

  return (
    <div className="tw-mb-3">
      <div
        className="tw-w-full tw-overflow-hidden tw-rounded-xl tw-border tw-border-solid tw-border-iron-800 tw-bg-iron-950 tw-shadow-2xl tw-ring-1 tw-ring-white/5"
        data-testid="transfer-single"
      >
        <div className="tw-flex tw-flex-wrap tw-items-center tw-gap-x-6 tw-gap-y-4 tw-px-4 tw-py-4 tw-@container">
          {statsContent}
          {!isMobileDevice && (
            <div className="tw-flex tw-min-w-0 tw-flex-[1_1_20rem] tw-items-center tw-gap-x-6">
              <div className="tw-hidden tw-h-10 tw-w-px tw-shrink-0 tw-bg-iron-800 @lg:tw-block" />

              <div className="tw-min-w-0 tw-flex-1">
                <TransferSingleActions
                  collectionType={CollectedCollectionType.MEMES}
                  contractType={ContractType.ERC1155}
                  contract={MEMES_CONTRACT}
                  tokenId={props.transferNft.id}
                  max={props.nftBalance}
                  title={
                    (props.transferNft as { name?: string }).name ??
                    `The Memes #${props.transferNft.id}`
                  }
                  thumbUrl={props.transferNft.thumbnail}
                />
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export function MemePageYourCardsRightMenu(props: {
  show: boolean;
  transactions: Transaction[];
  wallets: string[];
  nft: NFT | undefined;
  nftBalance: number;
  myOwner: ConsolidatedTDH | undefined;
  myTDH: NftTDH | undefined;
  myRank: NftRank | undefined;
}) {
  function getTokenCount(transactions: Transaction[]) {
    return transactions.reduce((count, e) => count + e.token_count, 0);
  }

  if (!props.show) {
    return <></>;
  }

  const transferNft =
    props.nftBalance > 0 &&
    props.myOwner &&
    props.nft !== undefined &&
    props.nft.id !== 0
      ? props.nft
      : undefined;

  if (transferNft === undefined) {
    return <></>;
  }

  const firstAcquired = [...props.transactions].sort((a, b) =>
    a.transaction_date > b.transaction_date ? 1 : -1
  )[0];

  const airdropped = props.transactions.filter(
    (t) => t.value === 0 && areEqualAddresses(t.from_address, NULL_ADDRESS)
  );

  /*
  const transferredIn =
    props.wallets.length === 0
      ? []
      : props.transactions.filter(
          (t) =>
            !areEqualAddresses(t.from_address, NULL_ADDRESS) &&
            props.wallets.some((w) => areEqualAddresses(t.to_address, w)) &&
            t.value === 0
        );
  */

  const transferredOut =
    props.wallets.length === 0
      ? []
      : props.transactions.filter(
          (t) =>
            props.wallets.some((w) => areEqualAddresses(t.from_address, w)) &&
            t.value === 0
        );

  const bought =
    props.wallets.length === 0
      ? []
      : props.transactions.filter(
          (t) =>
            props.wallets.some((w) => areEqualAddresses(t.to_address, w)) &&
            t.value > 0
        );

  const boughtSum = bought.reduce((sum, b) => sum + b.value, 0);

  const sold =
    props.wallets.length === 0
      ? []
      : props.transactions.filter(
          (t) =>
            props.wallets.some((w) => areEqualAddresses(t.from_address, w)) &&
            t.value > 0
        );

  const soldSum = sold.reduce((sum, b) => sum + b.value, 0);

  return (
    <div className="tw-pt-3">
      {props.transactions.length > 0 && props.wallets.length > 0 && (
        <>
          <MemePageYourCardsTransferCard
            transferNft={transferNft}
            nftBalance={props.nftBalance}
            myTDH={props.myTDH}
            myRank={props.myRank}
          />
          {/*
          {props.nftBalance > 0 && (
            <h3 className="tw-mb-0 tw-text-lg tw-font-bold tw-leading-6 tw-text-white">
              You Own {props.nftBalance} edition
              {props.nftBalance > 1 && "s"}
            </h3>
          )}
          */}
          <section>
            <div className="tw-space-y-1">
              <p className="tw-m-0 tw-text-xs tw-font-medium tw-leading-5 tw-text-iron-300">
                First acquired{" "}
                {printMintDate(new Date(firstAcquired!.transaction_date))}
              </p>
              {airdropped.length > 0 && (
                <p className="tw-m-0 tw-text-sm tw-font-medium tw-leading-5 tw-text-iron-400">
                  {getTokenCount(airdropped)} card
                  {getTokenCount(airdropped) > 1 && "s"} airdropped
                </p>
              )}
              {bought.length > 0 && (
                <p className="tw-m-0 tw-text-sm tw-font-medium tw-leading-5 tw-text-iron-400">
                  {getTokenCount(bought)} card
                  {getTokenCount(bought) > 1 && "s"} bought for {boughtSum} ETH
                </p>
              )}
              {/*
              {transferredIn.length > 0 && (
                <p className="tw-m-0 tw-text-sm tw-font-medium tw-leading-5 tw-text-iron-400">
                  {getTokenCount(transferredIn)} card
                  {getTokenCount(transferredIn) > 1 && "s"} transferred in
                </p>
              )}
              */}
              {sold.length > 0 && (
                <p className="tw-m-0 tw-text-sm tw-font-medium tw-leading-5 tw-text-iron-400">
                  {getTokenCount(sold)} card
                  {getTokenCount(sold) > 1 && "s"} sold for {soldSum} ETH
                </p>
              )}
              {transferredOut.length > 0 && (
                <p className="tw-m-0 tw-text-sm tw-font-medium tw-leading-5 tw-text-iron-400">
                  {getTokenCount(transferredOut)} card
                  {getTokenCount(transferredOut) > 1 && "s"} transferred out
                </p>
              )}
            </div>
          </section>
        </>
      )}
    </div>
  );
}

export function MemePageYourCardsSubMenu(props: {
  show: boolean;
  transactions: Transaction[];
}) {
  if (!props.show) {
    return <></>;
  }

  return (
    <>
      {props.transactions.length > 0 && (
        <section>
          <div className="tw-w-full tw-overflow-x-auto [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:tw-hidden">
            <table className="tw-min-w-full tw-border-separate tw-border-spacing-0">
              <tbody>
                {props.transactions.map((tr) => (
                  <LatestActivityRow
                    tr={tr}
                    variant="tailwind"
                    rowStyle="striped"
                    key={`${tr.from_address}-${tr.to_address}-${tr.transaction}-${tr.token_id}`}
                  />
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}
    </>
  );
}
