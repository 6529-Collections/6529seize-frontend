"use client";

import { DELEGATION_ABI } from "@/abis/abis";
import { useSeizeConnectContext } from "@/components/auth/SeizeConnectContext";
import {
  ALL_USE_CASE,
  MINTING_USE_CASE,
} from "@/components/delegation/delegation-constants";
import DotLoader from "@/components/dotLoader/DotLoader";
import styles from "@/components/nextGen/collections/NextGen.module.css";
import {
  NEXTGEN_CHAIN_ID,
  NEXTGEN_CORE,
} from "@/components/nextGen/nextgen_contracts";
import type { CollectionWithMerkle } from "@/components/nextGen/nextgen_entities";
import { AllowlistType, Status } from "@/components/nextGen/nextgen_entities";
import {
  formatNameForUrl,
  getStatusFromDates,
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
import Link from "next/link";
import { useEffect, useState } from "react";
import { useReadContract, useReadContracts } from "wagmi";
import {
  NextGenCountdown,
  NextGenMintCounts,
  NextGenPhases,
} from "../NextGenCollectionHeader";
import NextGenMintBurnWidget from "./NextGenMintBurnWidget";
import NextGenMintWidget from "./NextGenMintWidget";

interface Props {
  collection: NextGenCollection;
  mint_price: number;
  burn_amount: number;
}

export function Spinner() {
  return (
    <div className="tw-inline">
      <output
        className={`${styles["loader"]} tw-inline-block tw-animate-spin tw-rounded-full tw-border-2 tw-border-solid tw-border-current tw-border-r-transparent tw-align-[-0.125em]`}
      ></output>
    </div>
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

  const [shouldRefetchMintCounts, setShouldRefetchMintCounts] = useState(false);

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
        abi: DELEGATION_ABI as any,
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
        abi: DELEGATION_ABI as any,
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
        abi: DELEGATION_ABI as any,
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
        abi: DELEGATION_ABI as any,
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
    const data = delegationsRead.data as any;
    if (data) {
      const del: string[] = [];
      const d = data as any[];
      d.forEach((r) => {
        r.result.forEach((a: string) => del.push(a));
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
    const data = addressMintCountAirdropRead.data as any;
    if (data) {
      const air = parseInt(data);
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
    const data = addressMintCountMintedALRead.data as any;
    if (data) {
      const allow = parseInt(data);
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
    const data = addressMintCountMintedPublicRead.data as any;
    if (data) {
      const pub = parseInt(data);
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
          refreshMintCounts={() => {
            setShouldRefetchMintCounts(true);
          }}
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
          refreshMintCounts={() => {
            setShouldRefetchMintCounts(true);
          }}
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
        <span className="tw-flex tw-items-center tw-gap-1">
          <Image
            unoptimized
            loading="eager"
            width="0"
            height="0"
            style={{ height: "50px", width: "auto" }}
            src="/SummerGlasses.svg"
            alt="SummerGlasses"
          />
          <b>Allowlist Not Found</b>
        </span>
      );
    }
    return <DotLoader />;
  }

  return (
    <div>
      <div className="tw-grid tw-grid-cols-1 tw-pt-2 md:tw-grid-cols-2">
        <div className="tw-flex tw-flex-col tw-px-3">
          <NextGenPhases collection={props.collection} available={available} />
          <Link
            href={`/nextgen/collection/${formatNameForUrl(
              props.collection.name
            )}`}
            className="tw-no-underline hover:tw-underline"
          >
            <h1 className="tw-text-white tw-mb-0">{props.collection.name}</h1>
          </Link>
          <span className="tw-text-lg">
            by{" "}
            <b>
              <Link href={`/${props.collection.artist_address}`}>
                {props.collection.artist}
              </Link>
            </b>
          </span>
          <span className="tw-text-lg tw-inline-flex tw-items-center tw-pt-2">
            <NextGenMintCounts
              collection={props.collection}
              setAvailable={setAvailable}
              shouldRefetchMintCounts={shouldRefetchMintCounts}
              setShouldRefetchMintCounts={setShouldRefetchMintCounts}
            />
          </span>
        </div>
        <div className="tw-flex tw-items-center tw-px-3 tw-py-1">
          <NextGenCountdown collection={props.collection} />
        </div>
      </div>
      <div className="tw-grid tw-grid-cols-1 tw-py-4 tw-pt-4 md:tw-grid-cols-2">
        <div className="tw-flex tw-items-start tw-justify-start tw-gap-3 tw-px-0">
          <Image
            unoptimized
            loading="eager"
            width="0"
            height="0"
            style={{
              height: "auto",
              width: "auto",
              maxHeight: "100%",
              maxWidth: "100%",
              padding: "10px",
            }}
            src={props.collection.image}
            alt={props.collection.name}
            onError={(e) => {
              e.currentTarget.src = "/pebbles-loading.jpeg";
            }}
          />
        </div>
        <div className="tw-px-3">
          <div>
            <div className="tw-pt-2">
              <div className="tw-flex tw-gap-2">
                <span
                  className={`tw-mb-0 tw-flex tw-items-center tw-gap-2 tw-whitespace-nowrap tw-min-w-fit ${styles["nextgenTag"]}`}
                >
                  <span>Mint Cost:</span>
                  <span className="tw-font-bold">
                    {props.mint_price > 0 ? fromGWEI(props.mint_price) : `Free`}{" "}
                    {props.mint_price > 0 ? `ETH` : ``}
                  </span>
                </span>
                <span
                  className={`tw-mb-0 tw-flex tw-items-center tw-gap-2 tw-whitespace-nowrap tw-min-w-fit ${styles["nextgenTag"]}`}
                >
                  <span>Sales Model:</span>
                  <span className="tw-font-bold">{getSalesModel()}</span>
                </span>
              </div>
            </div>
            <div className="tw-pt-3">{printMintWidgetContent()}</div>
          </div>
        </div>
      </div>
    </div>
  );
}
