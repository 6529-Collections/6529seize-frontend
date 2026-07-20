"use client";

import { TransferSingleActions } from "@/components/nft-transfer/TransferSingle";
import { MEMES_CONTRACT } from "@/constants/constants";
import type { NFT, NftRank, NftTDH } from "@/entities/INFT";
import { CollectedCollectionType } from "@/entities/IProfile";
import type { ConsolidatedTDH } from "@/entities/ITDH";
import type { Transaction } from "@/entities/ITransaction";
import { numberWithCommas } from "@/helpers/Helpers";
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
  const statClassName =
    "tw-inline-flex tw-items-baseline tw-gap-1.5 tw-whitespace-nowrap";

  const statsContent = (
    <div className="tw-flex tw-w-full tw-flex-none tw-flex-wrap tw-items-center tw-justify-between tw-gap-x-6 tw-gap-y-3 @lg:tw-w-auto @lg:tw-justify-start">
      <div className={statClassName}>
        <span className="tw-text-[10px] tw-font-bold tw-uppercase tw-tracking-wider tw-text-iron-500">
          {isMobileDevice ? "Your Cards" : "Cards"}
        </span>
        <span className="tw-whitespace-nowrap tw-text-sm tw-font-bold tw-text-white">{`x${props.nftBalance}`}</span>
      </div>
      {props.myRank && props.myTDH ? (
        <>
          <div className={statClassName}>
            <span className="tw-text-[10px] tw-font-bold tw-uppercase tw-tracking-wider tw-text-iron-500">
              TDH
            </span>
            <span className="tw-whitespace-nowrap tw-text-sm tw-font-bold tw-text-white">
              {numberWithCommas(Math.round(props.myTDH.tdh))}
            </span>
          </div>
          <div className={statClassName}>
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
            <div className="tw-flex tw-w-full tw-min-w-0 tw-items-center tw-gap-x-6 @lg:tw-w-auto @lg:tw-flex-1">
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

  return (
    <div className="tw-pt-6">
      {props.transactions.length > 0 && props.wallets.length > 0 && (
        <>
          <MemePageYourCardsTransferCard
            transferNft={transferNft}
            nftBalance={props.nftBalance}
            myTDH={props.myTDH}
            myRank={props.myRank}
          />
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
