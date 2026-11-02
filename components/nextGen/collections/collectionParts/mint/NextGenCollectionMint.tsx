"use client";

import NextGenMint from "./NextGenMint";
import NftPurchasingGate from "@/components/common/NftPurchasingGate";
import { formatNameForUrl } from "@/components/nextGen/nextgen_helpers";
import { useReadContract } from "wagmi";
import {
  NEXTGEN_CORE,
  NEXTGEN_CHAIN_ID,
  NEXTGEN_MINTER,
} from "@/components/nextGen/nextgen_contracts";
import type { NextGenCollection } from "@/entities/INextgen";
import NextGenCollectionHeader, {
  NextGenBackToCollectionPageLink,
} from "../NextGenCollectionHeader";

interface Props {
  collection: NextGenCollection;
}

function getReadNumber(value: unknown) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

// Contract amounts (wei) stay bigint: a Number round trip silently drops
// precision above 2^53 wei (about 0.009 ETH), which includes ordinary prices.
function getReadBigInt(value: unknown): bigint {
  if (typeof value === "bigint") {
    return value > 0n ? value : 0n;
  }
  if (typeof value === "number") {
    return Number.isSafeInteger(value) && value > 0 ? BigInt(value) : 0n;
  }
  if (typeof value === "string" && /^\d+$/.test(value.trim())) {
    return BigInt(value.trim());
  }
  return 0n;
}

export default function NextGenCollectionMint(props: Readonly<Props>) {
  return (
    <NftPurchasingGate
      redirectTo={`/nextgen/collection/${formatNameForUrl(props.collection.name)}`}
    >
      <NextGenCollectionMintContent {...props} />
    </NftPurchasingGate>
  );
}

function NextGenCollectionMintContent(props: Readonly<Props>) {
  const burnAmountRead = useReadContract({
    address: NEXTGEN_CORE[NEXTGEN_CHAIN_ID] as `0x${string}`,
    abi: NEXTGEN_CORE.abi,
    chainId: NEXTGEN_CHAIN_ID,
    functionName: "burnAmount",
    query: {
      refetchInterval: 10000,
    },
    args: [props.collection.id],
  });

  const mintPriceRead = useReadContract({
    address: NEXTGEN_MINTER[NEXTGEN_CHAIN_ID] as `0x${string}`,
    abi: NEXTGEN_MINTER.abi,
    chainId: NEXTGEN_CHAIN_ID,
    functionName: "getPrice",
    query: {
      refetchInterval: 10000,
    },
    args: [props.collection.id],
  });

  const isLoading = burnAmountRead.isLoading || mintPriceRead.isLoading;
  const hasError = burnAmountRead.isError || mintPriceRead.isError;

  return (
    <div className="tw-mx-auto tw-w-full tw-max-w-[1400px] tw-px-4 tw-pb-12 md:tw-px-6 lg:tw-px-8">
      <section className="tw-py-6 sm:tw-py-8">
        <NextGenBackToCollectionPageLink collection={props.collection} />
        <div className="tw-mt-2">
          <NextGenCollectionHeader
            collection={props.collection}
            contained={false}
            compact={true}
            show_links={true}
          />
        </div>
      </section>

      <section>
        <h2 className="tw-mb-5 tw-mt-0 tw-text-2xl tw-font-semibold tw-tracking-tight tw-text-white sm:tw-text-3xl">
          Mint
        </h2>
        {isLoading && (
          <output
            aria-label="Loading mint details"
            className="tw-flex tw-items-center tw-gap-2 tw-py-8 tw-text-sm tw-text-iron-400"
          >
            Loading mint details…
          </output>
        )}
        {hasError && (
          <div role="alert" className="tw-py-8 tw-text-sm tw-text-error">
            Mint details could not be loaded. Please try again.
          </div>
        )}
        {!isLoading &&
          !hasError &&
          burnAmountRead.isSuccess &&
          mintPriceRead.isSuccess && (
            <NextGenMint
              collection={props.collection}
              mint_price={getReadBigInt(mintPriceRead.data)}
              burn_amount={getReadNumber(burnAmountRead.data)}
            />
          )}
      </section>
    </div>
  );
}
