"use client";

import LatestActivityRow from "@/components/latest-activity/LatestActivityRow";
import { TransferSingleActions } from "@/components/nft-transfer/TransferSingle";
import { MEMELAB_CONTRACT } from "@/constants/constants";
import type { LabNFT } from "@/entities/INFT";
import { CollectedCollectionType } from "@/entities/IProfile";
import type { Transaction } from "@/entities/ITransaction";
import useDeviceInfo from "@/hooks/useDeviceInfo";
import { ContractType } from "@/types/enums";

function MemeLabYourCardsTransferCard({
  nft,
  nftBalance,
}: {
  readonly nft: LabNFT;
  readonly nftBalance: number;
}) {
  const { isMobileDevice } = useDeviceInfo();
  const statClassName =
    "tw-inline-flex tw-items-baseline tw-gap-1.5 tw-whitespace-nowrap";

  return (
    <div className="tw-mb-3">
      <div
        className="tw-w-full tw-overflow-hidden tw-rounded-xl tw-border tw-border-solid tw-border-iron-800 tw-bg-iron-950 tw-shadow-2xl tw-ring-1 tw-ring-white/5"
        data-testid="transfer-single"
      >
        <div className="tw-flex tw-flex-wrap tw-items-center tw-gap-x-6 tw-gap-y-4 tw-px-4 tw-py-4 tw-@container">
          <div className="tw-flex tw-w-full tw-flex-none tw-flex-wrap tw-items-center tw-justify-between tw-gap-x-6 tw-gap-y-3 @lg:tw-w-auto @lg:tw-justify-start">
            <div className={statClassName}>
              <span className="tw-text-[10px] tw-font-bold tw-uppercase tw-tracking-wider tw-text-iron-500">
                {isMobileDevice ? "Your Cards" : "Cards"}
              </span>
              <span className="tw-whitespace-nowrap tw-text-sm tw-font-bold tw-text-white">{`x${nftBalance}`}</span>
            </div>
          </div>
          {!isMobileDevice && (
            <div className="tw-flex tw-w-full tw-min-w-0 tw-items-center tw-gap-x-6 @lg:tw-w-auto @lg:tw-flex-1">
              <div className="tw-hidden tw-h-10 tw-w-px tw-shrink-0 tw-bg-iron-800 @lg:tw-block" />
              <div className="tw-min-w-0 tw-flex-1">
                <TransferSingleActions
                  collectionType={CollectedCollectionType.MEMELAB}
                  contractType={ContractType.ERC1155}
                  contract={MEMELAB_CONTRACT}
                  tokenId={nft.id}
                  max={nftBalance}
                  title={nft.name}
                  thumbUrl={nft.thumbnail}
                />
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
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
}: {
  readonly nft: LabNFT | undefined;
  readonly nftBalance: number;
}) {
  if (!nft || nftBalance <= 0) {
    return null;
  }

  return (
    <div className="tw-pb-[35px]">
      <MemeLabYourCardsTransferCard nft={nft} nftBalance={nftBalance} />
    </div>
  );
}
