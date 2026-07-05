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
import NextGenNavigationHeader from "@/components/nextGen/collections/NextGenNavigationHeader";

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
      setBurnAmount(parseInt(String(data)));
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

  return (
    <>
      <NextGenNavigationHeader />
      <div className="tailwind-scope tw-mx-auto tw-w-full tw-px-3 tw-py-4 sm:tw-max-w-[540px] md:tw-max-w-[720px] lg:tw-max-w-[960px] xl:tw-max-w-[1140px] 2xl:tw-max-w-[1320px]">
        {burnAmountRead.isSuccess && mintPriceRead.isSuccess && (
          <NextGenMint
            collection={props.collection}
            mint_price={mintPrice}
            burn_amount={burnAmount}
          />
        )}
      </div>
    </>
  );
}
