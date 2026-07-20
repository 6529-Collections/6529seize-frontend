"use client";

import { DELEGATION_ABI } from "@/abis/abis";
import { useSeizeConnectContext } from "@/components/auth/SeizeConnectContext";
import {
  ALL_USE_CASE,
  MINTING_USE_CASE,
} from "@/components/delegation/delegation-constants";
import DotLoader from "@/components/dotLoader/DotLoader";
import {
  NEXTGEN_CHAIN_ID,
  NEXTGEN_CORE,
} from "@/components/nextGen/nextgen_contracts";
import type { CollectionWithMerkle } from "@/components/nextGen/nextgen_entities";
import { AllowlistType, Status } from "@/components/nextGen/nextgen_entities";
import {
  getStatusFromDates,
  useCollectionMintCount,
  useCollectionCostsHook,
  useMintSharedState,
  useSharedState,
} from "@/components/nextGen/nextgen_helpers";
import { publicEnv } from "@/config/env";
import {
  DELEGATION_ALL_ADDRESS,
  DELEGATION_CONTRACT,
} from "@/constants/constants";
import type { NextGenCollection } from "@/entities/INextgen";
import { fromGWEI } from "@/helpers/Helpers";
import { fetchUrl } from "@/services/6529api";
import Image from "next/image";
import { useEffect, useState } from "react";
import type { Abi } from "viem";
import { useReadContract, useReadContracts } from "wagmi";
import NextGenMintBurnWidget from "./NextGenMintBurnWidget";
import NextGenMintWidget from "./NextGenMintWidget";

interface Props {
  collection: NextGenCollection;
  mint_price: number;
  burn_amount: number;
}

export function Spinner() {
  return (
    <output
      aria-label="Processing"
      className="tw-ml-2 tw-inline-block tw-h-4 tw-w-4 tw-animate-spin tw-rounded-full tw-border-2 tw-border-solid tw-border-current tw-border-r-transparent tw-align-[-0.125em] motion-reduce:tw-animate-none"
    />
  );
}

export default function NextGenMint(props: Readonly<Props>) {
  const account = useSeizeConnectContext();

  const [collection, setCollection] = useState<CollectionWithMerkle>();
  const [collectionLoaded, setCollectionLoaded] = useState<boolean>(false);

  const { mintingDetails, setMintingDetails } = useSharedState();
  useCollectionCostsHook(props.collection.id, setMintingDetails);

  const publicStatus = getStatusFromDates(
    props.collection.public_start,
    props.collection.public_end
  );

  const [enableMintCountRefresh, setEnableMintCountRefresh] = useState(true);

  const {
    available,
    setAvailable,
    delegators,
    setDelegators,
    mintForAddress,
    setMintForAddress,
    addressMintCounts,
    setAddressMintCounts,
    fetchingMintCounts,
    setFetchingMintCounts,
  } = useMintSharedState();

  const collectionMintCountRead = useCollectionMintCount(
    props.collection.id,
    enableMintCountRefresh
  );

  useEffect(() => {
    const currentMintCount = Number(collectionMintCountRead.data);
    const nextAvailable = props.collection.total_supply - currentMintCount;
    if (!Number.isFinite(nextAvailable)) {
      return;
    }
    setAvailable(Math.max(nextAvailable, 0));
    setEnableMintCountRefresh(nextAvailable > 0);
  }, [collectionMintCountRead.data, props.collection.total_supply]);

  function getDelegationAddress() {
    if (collection && mintingDetails) {
      if (collection.al_type === AllowlistType.ALLOWLIST) {
        return mintingDetails.del_address;
      } else if (collection.al_type === AllowlistType.EXTERNAL_BURN) {
        return collection.burn_collection;
      }
    }
    return "";
  }

  const delegationsRead = useReadContracts({
    contracts: [
      {
        address: DELEGATION_CONTRACT.contract,
        abi: DELEGATION_ABI as Abi,
        chainId: DELEGATION_CONTRACT.chain_id,
        functionName: "retrieveDelegators",
        args: [
          account.address ? account.address : "",
          DELEGATION_ALL_ADDRESS,
          ALL_USE_CASE.use_case,
        ],
      },
      {
        address: DELEGATION_CONTRACT.contract,
        abi: DELEGATION_ABI as Abi,
        chainId: DELEGATION_CONTRACT.chain_id,
        functionName: "retrieveDelegators",
        args: [
          account.address ? account.address : "",
          DELEGATION_ALL_ADDRESS,
          MINTING_USE_CASE.use_case,
        ],
      },
      {
        address: DELEGATION_CONTRACT.contract,
        abi: DELEGATION_ABI as Abi,
        chainId: DELEGATION_CONTRACT.chain_id,
        functionName: "retrieveDelegators",
        args: [
          account.address ? account.address : "",
          getDelegationAddress(),
          ALL_USE_CASE.use_case,
        ],
      },
      {
        address: DELEGATION_CONTRACT.contract,
        abi: DELEGATION_ABI as Abi,
        chainId: DELEGATION_CONTRACT.chain_id,
        functionName: "retrieveDelegators",
        args: [
          account.address ? account.address : "",
          getDelegationAddress(),
          MINTING_USE_CASE.use_case,
        ],
      },
    ],
    query: {
      refetchInterval: 10000,
      enabled:
        account.isConnected &&
        mintingDetails !== undefined &&
        collection !== undefined,
    },
  });

  useEffect(() => {
    const data = delegationsRead.data;
    if (data) {
      const del: string[] = [];
      data.forEach((r) => {
        (r.result as string[]).forEach((a) => del.push(a));
      });
      setDelegators(del);
    }
  }, [delegationsRead.data]);

  function retrievePerAddressParams() {
    return {
      address: NEXTGEN_CORE[NEXTGEN_CHAIN_ID] as `0x${string}`,
      abi: NEXTGEN_CORE.abi,
      chainId: NEXTGEN_CHAIN_ID,
      watch: true,
      enabled: account.isConnected && available > 0,
      args: [props.collection.id, mintForAddress],
    };
  }

  const addressMintCountAirdropRead = useReadContract({
    functionName: "retrieveTokensAirdroppedPerAddress",
    ...retrievePerAddressParams(),
  });

  useEffect(() => {
    const data = addressMintCountAirdropRead.data;
    if (data) {
      const air = parseInt((data as bigint).toString());
      setAddressMintCounts((amc) => {
        amc.airdrop = air;
        amc.total = amc.airdrop + amc.allowlist + amc.public;
        return amc;
      });
    }
  }, [addressMintCountAirdropRead.data]);

  const addressMintCountMintedALRead = useReadContract({
    functionName: "retrieveTokensMintedALPerAddress",
    ...retrievePerAddressParams(),
  });

  useEffect(() => {
    const data = addressMintCountMintedALRead.data;
    if (data) {
      const allow = parseInt((data as bigint).toString());
      setAddressMintCounts((amc) => {
        amc.allowlist = allow;
        amc.total = amc.airdrop + amc.allowlist + amc.public;
        return amc;
      });
    }
  }, [addressMintCountMintedALRead.data]);

  const addressMintCountMintedPublicRead = useReadContract({
    functionName: "retrieveTokensMintedPublicPerAddress",
    ...retrievePerAddressParams(),
  });

  useEffect(() => {
    const data = addressMintCountMintedPublicRead.data;
    if (data) {
      const pub = parseInt((data as bigint).toString());
      setAddressMintCounts((amc) => {
        amc.public = pub;
        amc.total = amc.airdrop + amc.allowlist + amc.public;
        return amc;
      });
    }
  }, [addressMintCountMintedPublicRead.data]);

  useEffect(() => {
    if (props.collection.merkle_root) {
      const merkleRoot = props.collection.merkle_root;
      const url = `${publicEnv.API_ENDPOINT}/api/nextgen/merkle_roots/${merkleRoot}`;
      fetchUrl<CollectionWithMerkle>(url).then(
        (response: CollectionWithMerkle) => {
          if (response) {
            setCollection(response);
          }
          setCollectionLoaded(true);
        }
      );
    }
  }, [props.collection.merkle_root]);

  function getSalesModel() {
    if (!mintingDetails) {
      return "-";
    }

    switch (mintingDetails.sales_option) {
      case 1:
        return "Fixed Price";
      case 2:
        if (mintingDetails.rate === 0) {
          return "Exponential Descending";
        } else {
          return "Linear Descending";
        }
      case 3:
        return "Periodic Sale";
      default:
        return `${mintingDetails.sales_option}`;
    }
  }

  useEffect(() => {
    setAddressMintCounts({
      airdrop: 0,
      allowlist: 0,
      public: 0,
      total: 0,
    });
    addressMintCountAirdropRead.refetch();
    addressMintCountMintedALRead.refetch();
    addressMintCountMintedPublicRead.refetch();
  }, [mintForAddress]);

  useEffect(() => {
    const isFetching =
      addressMintCountAirdropRead.isFetching ||
      addressMintCountMintedALRead.isFetching ||
      addressMintCountMintedPublicRead.isFetching;
    setFetchingMintCounts(isFetching);
  }, [
    addressMintCountAirdropRead.isFetching,
    addressMintCountMintedALRead.isFetching,
    addressMintCountMintedPublicRead.isFetching,
  ]);

  function refreshMintCounts() {
    void collectionMintCountRead.refetch();
    void addressMintCountAirdropRead.refetch();
    void addressMintCountMintedALRead.refetch();
    void addressMintCountMintedPublicRead.refetch();
  }

  function printMintWidget(type: AllowlistType) {
    if (type === AllowlistType.ALLOWLIST) {
      return (
        <NextGenMintWidget
          collection={props.collection}
          available_supply={available}
          mint_price={props.mint_price}
          mint_counts={addressMintCounts}
          delegators={delegators}
          mintForAddress={setMintForAddress}
          fetchingMintCounts={fetchingMintCounts}
          refreshMintCounts={refreshMintCounts}
        />
      );
    } else if (collection && type == AllowlistType.EXTERNAL_BURN) {
      return (
        <NextGenMintBurnWidget
          collection={props.collection}
          collection_merkle={collection}
          available_supply={available}
          mint_price={props.mint_price}
          mint_counts={addressMintCounts}
          delegators={delegators}
          mintForAddress={setMintForAddress}
          fetchingMintCounts={fetchingMintCounts}
          refreshMintCounts={refreshMintCounts}
        />
      );
    }
    return;
  }

  function printMintWidgetContent() {
    if (publicStatus === Status.LIVE) {
      return printMintWidget(AllowlistType.ALLOWLIST);
    }
    if (collectionLoaded) {
      if (collection) {
        return printMintWidget(collection.al_type);
      }
      return (
        <span className="tw-flex tw-items-center tw-gap-2 tw-text-sm tw-text-iron-300">
          <Image
            unoptimized
            loading="eager"
            width={50}
            height={50}
            className="tw-h-12 tw-w-auto"
            src="/SummerGlasses.svg"
            alt=""
          />
          <b className="tw-font-semibold tw-text-white">Allowlist not found</b>
        </span>
      );
    }
    return (
      <output
        aria-label="Loading mint options"
        className="tw-text-sm tw-text-iron-400"
      >
        Loading mint options <DotLoader />
      </output>
    );
  }

  return (
    <section className="tw-rounded-xl tw-border tw-border-solid tw-border-white/10 tw-bg-iron-900/80 tw-p-4 sm:tw-p-5">
      <div className="tw-grid tw-gap-5 lg:tw-grid-cols-[minmax(0,0.95fr)_minmax(22rem,1.05fr)]">
        <div
          aria-label={`${props.collection.name} artwork`}
          className="tw-flex tw-min-h-[18rem] tw-items-center tw-justify-center"
        >
          <Image
            unoptimized
            priority
            loading="eager"
            width={1200}
            height={1200}
            className="tw-h-auto tw-max-h-[70vh] tw-w-auto tw-max-w-full tw-object-contain"
            src={props.collection.image}
            alt={props.collection.name}
            onError={(e) => {
              e.currentTarget.src = "/pebbles-loading.jpeg";
            }}
          />
        </div>

        <div className="tw-border-0 tw-border-t tw-border-solid tw-border-white/10 tw-pt-5 lg:tw-border-0 lg:tw-border-l lg:tw-border-solid lg:tw-border-white/10 lg:tw-pl-5 lg:tw-pt-0">
          <div>
            <dl className="tw-m-0 tw-grid tw-gap-4 tw-border-0 tw-border-b tw-border-solid tw-border-white/10 tw-pb-4 sm:tw-grid-cols-2">
              <div className="tw-grid tw-gap-1">
                <dt className="tw-text-xs tw-font-semibold tw-uppercase tw-tracking-wide tw-text-iron-400">
                  Mint Cost
                </dt>
                <dd className="tw-m-0 tw-text-base tw-font-semibold tw-text-white">
                  {props.mint_price > 0
                    ? `${fromGWEI(props.mint_price)} ETH`
                    : "Free"}
                </dd>
              </div>
              <div className="tw-grid tw-gap-1">
                <dt className="tw-text-xs tw-font-semibold tw-uppercase tw-tracking-wide tw-text-iron-400">
                  Sales Model
                </dt>
                <dd className="tw-m-0 tw-text-base tw-font-semibold tw-text-white">
                  {getSalesModel()}
                </dd>
              </div>
            </dl>
            <div className="tw-pt-4">{printMintWidgetContent()}</div>
          </div>
        </div>
      </div>
    </section>
  );
}
