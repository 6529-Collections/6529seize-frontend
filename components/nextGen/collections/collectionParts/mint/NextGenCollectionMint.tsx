"use client";

import NextGenMint from "./NextGenMint";
import { useEffect, useState } from "react";
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

export default function NextGenCollectionMint(props: Readonly<Props>) {
  const [burnAmount, setBurnAmount] = useState<number>(0);
  const [mintPrice, setMintPrice] = useState<number>(0);

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

  useEffect(() => {
    const data = burnAmountRead.data;
    if (data) {
      setBurnAmount(parseInt((data as bigint).toString()));
    }
  }, [burnAmountRead.data]);

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

  useEffect(() => {
    const data = mintPriceRead.data;
    if (!isNaN(parseInt(String(data)))) {
      setMintPrice(parseInt(String(data)));
    }
  }, [mintPriceRead.data]);

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
          <div
            role="status"
            className="tw-flex tw-items-center tw-gap-2 tw-py-8 tw-text-sm tw-text-iron-400"
          >
            Loading mint details…
          </div>
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
              mint_price={mintPrice}
              burn_amount={burnAmount}
            />
          )}
      </section>
    </div>
  );
}
