"use client";

import { useEffect, useState } from "react";
import { formatNameForUrl, normalizeNextgenTokenID } from "@/helpers/nextgen-utils";
import { goerli, mainnet, sepolia } from "viem/chains";
import type { Abi } from "viem";
import { useReadContract, useReadContracts, useWriteContract } from "wagmi";
import { areEqualAddresses } from "@/helpers/Helpers";
import { useSeizeConnectContext } from "../auth/SeizeConnectContext";
import type {
  NextGenContract} from "./nextgen_contracts";
import {
  NEXTGEN_ADMIN,
  NEXTGEN_CHAIN_ID,
  NEXTGEN_CORE,
  NEXTGEN_MINTER
} from "./nextgen_contracts";
import type {
  AdditionalData,
  Info,
  LibraryScript,
  MintingDetails,
  PhaseTimes,
  ProofResponse,
  ProofResponseBurn,
  TokensPerAddress} from "./nextgen_entities";
import {
  Status
} from "./nextgen_entities";

interface Crumb {
  display: string;
  href?: string | undefined;
}

export function useGlobalAdmin(address: string) {
  return useReadContract({
    address: NEXTGEN_ADMIN[NEXTGEN_CHAIN_ID] as `0x${string}`,
    abi: NEXTGEN_ADMIN.abi,
    chainId: NEXTGEN_CHAIN_ID,
    functionName: "retrieveGlobalAdmin",
    args: [address],
  });
}

export function useFunctionAdmin(address: string, functionSelector: string) {
  return useReadContract({
    address: NEXTGEN_ADMIN[NEXTGEN_CHAIN_ID] as `0x${string}`,
    abi: NEXTGEN_ADMIN.abi,
    chainId: NEXTGEN_CHAIN_ID,
    functionName: "retrieveFunctionAdmin",
    args: [address, functionSelector],
  });
}

export function useCollectionIndex() {
  return useReadContract({
    address: NEXTGEN_CORE[NEXTGEN_CHAIN_ID] as `0x${string}`,
    abi: NEXTGEN_CORE.abi,
    chainId: NEXTGEN_CHAIN_ID,
    functionName: "newCollectionIndex",
  });
}

export function useParsedCollectionIndex(
  collectionIndex: { data?: unknown } | undefined
) {
  const collectionIndexData = collectionIndex?.data;
  return collectionIndexData ? parseInt(String(collectionIndexData)) : 0;
}

interface NextGenReadParams {
  address: `0x${string}`;
  abi: Abi;
  chainId: number;
  functionName: string;
  args: (string | number)[];
}

function getCollectionAdminReadParams(
  collectionIndex: number,
  address: string
) {
  const params: NextGenReadParams[] = [];
  for (let i = 1; i <= collectionIndex - 1; i++) {
    params.push({
      address: NEXTGEN_ADMIN[NEXTGEN_CHAIN_ID] as `0x${string}`,
      abi: NEXTGEN_ADMIN.abi,
      chainId: NEXTGEN_CHAIN_ID,
      functionName: "retrieveCollectionAdmin",
      args: [address, i],
    });
  }
  return params;
}

export function useCollectionAdmin(address: string, collectionIndex: number) {
  return useReadContracts({
    contracts: getCollectionAdminReadParams(collectionIndex, address),
  });
}

type ContractReadResults =
  | { data?: readonly { result?: unknown }[] | undefined }
  | undefined;

export function isCollectionAdmin(collectionAdmin: ContractReadResults) {
  return collectionAdmin?.data?.some((d) => d.result === true);
}

function getCollectionArtistReadParams(collectionIndex: number) {
  const params: NextGenReadParams[] = [];
  for (let i = 1; i <= collectionIndex - 1; i++) {
    params.push({
      address: NEXTGEN_CORE[NEXTGEN_CHAIN_ID] as `0x${string}`,
      abi: NEXTGEN_CORE.abi,
      chainId: NEXTGEN_CHAIN_ID,
      functionName: "retrieveArtistAddress",
      args: [i],
    });
  }
  return params;
}

export function useCollectionArtist(collectionIndex: number) {
  return useReadContracts({
    contracts: getCollectionArtistReadParams(collectionIndex),
  });
}

export function isCollectionArtist(
  address: string,
  collectionArtists: ContractReadResults
) {
  return collectionArtists?.data?.some((a) =>
    areEqualAddresses(address, a.result)
  );
}

export function getCollectionIdsForAddress(
  globalAdmin: boolean,
  functionAdmin: boolean,
  // Callers pass either the whole useReadContracts result or its `.data`
  // array. The array form has no `.data`, so (as before this was typed) it
  // contributes no collection ids; only the result-object form does.
  collectionAdmin: ContractReadResults | readonly { result?: unknown }[],
  collectionIndex: number
) {
  const collectionIndexArray: string[] = [];
  if (globalAdmin || functionAdmin) {
    for (let i = 1; i <= collectionIndex - 1; i++) {
      collectionIndexArray.push(i.toString());
    }
  } else if (
    collectionAdmin &&
    "data" in collectionAdmin &&
    collectionAdmin.data
  ) {
    collectionAdmin.data.forEach((d, i) => {
      if (d.result === true) {
        collectionIndexArray.push((i + 1).toString());
      }
    });
  }

  return collectionIndexArray;
}

export function useCollectionPhases(
  collection: number | string,
  callback: (data: PhaseTimes) => void,
  watch: boolean = false
) {
  const { data, error, isLoading } = useReadContract({
    address: NEXTGEN_MINTER[NEXTGEN_CHAIN_ID] as `0x${string}`,
    abi: NEXTGEN_MINTER.abi,
    chainId: NEXTGEN_CHAIN_ID,
    query: {
      refetchInterval: watch ? 10000 : false,
    },
    functionName: "retrieveCollectionPhases",
    args: [collection],
  });

  useEffect(() => {
    if (data) {
      callback(extractPhases(data as readonly unknown[]));
    }
  }, [data, callback]);

  return { data, error, isLoading };
}

export function useCollectionAdditionalData(
  collection: number | string,
  callback: (data: AdditionalData) => void,
  watch: boolean = false
) {
  const { data, error, isLoading } = useReadContract({
    address: NEXTGEN_CORE[NEXTGEN_CHAIN_ID] as `0x${string}`,
    abi: NEXTGEN_CORE.abi,
    chainId: NEXTGEN_CHAIN_ID,
    query: {
      refetchInterval: watch ? 10000 : false,
    },
    functionName: "retrieveCollectionAdditionalData",
    args: [collection],
  });

  useEffect(() => {
    if (data) {
      const d = data as readonly unknown[];
      const ad: AdditionalData = {
        artist_address: String(d[0]),
        max_purchases: parseInt(String(d[1])),
        circulation_supply: parseInt(String(d[2])),
        total_supply: parseInt(String(d[3])),
        final_supply_after_mint: parseInt(String(d[4])),
        randomizer: String(d[5]),
      };
      callback(ad);
    }
  }, [data, callback]);

  return { data, error, isLoading };
}

export function useCollectionInfo(
  collection: number | string,
  callback: (data: Info) => void,
  watch: boolean = false
) {
  const { data, error, isLoading } = useReadContract({
    address: NEXTGEN_CORE[NEXTGEN_CHAIN_ID] as `0x${string}`,
    abi: NEXTGEN_CORE.abi,
    chainId: NEXTGEN_CHAIN_ID,
    query: {
      refetchInterval: watch ? 10000 : false,
    },
    functionName: "retrieveCollectionInfo",
    args: [collection],
  });

  useEffect(() => {
    if (data) {
      const d = data as readonly unknown[];
      if (d.some((e) => e)) {
        const i1: Info = {
          name: String(d[0]),
          artist: String(d[1]),
          description: String(d[2]),
          website: String(d[3]),
          licence: String(d[4]),
          base_uri: String(d[5]),
        };
        callback(i1);
      }
    }
  }, [data, callback]);

  return { data, error, isLoading };
}

export function useCollectionLibraryAndScript(
  collection: number | string,
  callback: (data: LibraryScript) => void,
  watch: boolean = false
) {
  const { data, error, isLoading } = useReadContract({
    address: NEXTGEN_CORE[NEXTGEN_CHAIN_ID] as `0x${string}`,
    abi: NEXTGEN_CORE.abi,
    chainId: NEXTGEN_CHAIN_ID,
    query: {
      refetchInterval: watch ? 10000 : false,
    },
    functionName: "retrieveCollectionLibraryAndScript",
    args: [collection],
  });

  useEffect(() => {
    if (data) {
      const d = data as readonly unknown[];
      const ls: LibraryScript = {
        library: String(d[0]),
        dependency_script: String(d[1]),
        script: d[2] as string[],
      };
      callback(ls);
    }
  }, [data, callback]);

  return { data, error, isLoading };
}

export function useCollectionCosts(
  collection: number | string,
  callback: (data: MintingDetails) => void,
  watch: boolean = false
) {
  const { data, error, isLoading } = useReadContract({
    address: NEXTGEN_MINTER[NEXTGEN_CHAIN_ID] as `0x${string}`,
    abi: NEXTGEN_MINTER.abi,
    chainId: NEXTGEN_CHAIN_ID,
    functionName: "retrieveCollectionMintingDetails",
    args: [collection],
    query: {
      refetchInterval: watch ? 10000 : false,
      enabled: !!collection,
    },
  });

  useEffect(() => {
    if (data) {
      const d = data as readonly unknown[];
      const md: MintingDetails = {
        mint_cost: parseInt(String(d[1])),
        end_mint_cost: parseInt(String(d[1])),
        rate: parseInt(String(d[2])),
        time_period: parseInt(String(d[3])),
        sales_option: parseInt(String(d[4])),
        del_address: String(d[5]),
      };
      callback(md);
    }
  }, [data, callback]);

  return { data, error, isLoading };
}

export function useCollectionCostsHook(
  collection: number,
  setData: (data: MintingDetails) => void,
  watch: boolean = false
) {
  useCollectionCosts(
    collection,
    (data: MintingDetails) => {
      setData(data);
    },
    watch
  );
}

export function getStatusFromDates(startTime: number, endTime: number) {
  if ((startTime === 0 && endTime === 0) || endTime - startTime === 0) {
    return Status.UNAVAILABLE;
  }
  const now = new Date().getTime();
  if (now > endTime * 1000) {
    return Status.COMPLETE;
  }
  if (now > startTime * 1000 && now < endTime * 1000) {
    return Status.LIVE;
  }
  if (startTime * 1000 > now) {
    return Status.UPCOMING;
  }
  return Status.UNAVAILABLE;
}

function extractPhases(d: readonly unknown[]) {
  const al_start = parseInt(String(d[0]));
  const al_end = parseInt(String(d[1]));
  const public_start = parseInt(String(d[3]));
  const public_end = parseInt(String(d[4]));

  const alStatus = getStatusFromDates(al_start, al_end);
  const publicStatus = getStatusFromDates(public_start, public_end);

  const phases: PhaseTimes = {
    allowlist_start_time: al_start,
    allowlist_end_time: al_end,
    merkle_root: String(d[2]),
    public_start_time: public_start,
    public_end_time: public_end,
    al_status: alStatus,
    public_status: publicStatus,
  };
  return phases;
}

export function useCoreContractWrite(
  functionName: string,
  onError: () => void
) {
  return useWriteContractForFunction(NEXTGEN_CORE, functionName, onError);
}

export function useMinterContractWrite(
  functionName: string,
  onError: () => void
) {
  return useWriteContractForFunction(NEXTGEN_MINTER, functionName, onError);
}

export function useAdminContractWrite(
  functionName: string,
  onError: () => void
) {
  return useWriteContractForFunction(NEXTGEN_ADMIN, functionName, onError);
}

function useWriteContractForFunction(
  contract: NextGenContract,
  functionName: string,
  onError: () => void
) {
  const {
    data,
    error,
    writeContract,
    reset,
    isPending: isLoading,
    isSuccess,
    isError,
  } = useWriteContract();

  const params = {
    address: contract[NEXTGEN_CHAIN_ID] as `0x${string}`,
    abi: contract.abi,
    chainId: NEXTGEN_CHAIN_ID,
    functionName: functionName,
  };

  useEffect(() => {
    if (error) {
      onError();
    }
  }, [error, onError]);

  return {
    data,
    params,
    error,
    writeContract,
    reset,
    isLoading,
    isSuccess,
    isError,
  };
}

export function useSharedState() {
  const [breadcrumbs, setBreadcrumbs] = useState<Crumb[]>([]);
  const [info, setInfo] = useState<Info>();
  const [infoSettled, setInfoSettled] = useState<boolean>(false);
  const [tokenStartIndex, setTokenStartIndex] = useState<number>(0);
  const [tokenEndIndex, setTokenEndIndex] = useState<number>(0);
  const [phaseTimes, setPhaseTimes] = useState<PhaseTimes>();
  const [additionalData, setAdditionalData] = useState<AdditionalData>();
  const [tokenIds, setTokenIds] = useState<number[]>([]);
  const [burnAmount, setBurnAmount] = useState<number>(0);
  const [mintPrice, setMintPrice] = useState<number>(0);
  const [artistSignature, setArtistSignature] = useState<string>("");
  const [mintingDetails, setMintingDetails] = useState<MintingDetails>();
  const [libraryScript, setLibraryScript] = useState<LibraryScript>();
  const [sampleToken, setSampleToken] = useState<number>(0);

  return {
    breadcrumbs,
    setBreadcrumbs,
    info,
    setInfo,
    infoSettled,
    setInfoSettled,
    tokenStartIndex,
    setTokenStartIndex,
    tokenEndIndex,
    setTokenEndIndex,
    phaseTimes,
    setPhaseTimes,
    additionalData,
    setAdditionalData,
    tokenIds,
    setTokenIds,
    burnAmount,
    setBurnAmount,
    mintPrice,
    setMintPrice,
    artistSignature,
    setArtistSignature,
    mintingDetails,
    setMintingDetails,
    libraryScript,
    setLibraryScript,
    sampleToken,
    setSampleToken,
  };
}

export function useMintSharedState() {
  const account = useSeizeConnectContext();
  const [available, setAvailable] = useState<number>(0);
  const [delegators, setDelegators] = useState<string[]>([]);
  const [addressMintCounts, setAddressMintCounts] = useState<TokensPerAddress>({
    airdrop: 0,
    allowlist: 0,
    public: 0,
    total: 0,
  });
  const [fetchingMintCounts, setFetchingMintCounts] = useState(false);
  const [proofResponse, setProofResponse] = useState<ProofResponse[]>([]);
  const [burnProofResponse, setBurnProofResponse] =
    useState<ProofResponseBurn>();
  const [mintForAddress, setMintForAddress] = useState<string>(
    account.isConnected ? (account.address as string) : ""
  );
  const [tokenId, setTokenId] = useState<string>("");
  const salt = 0;
  const [mintCount, setMintCount] = useState<number>(0);
  const [mintToInput, setMintToInput] = useState<string>("");
  const [mintToAddress, setMintToAddress] = useState<string>("");
  const [isMinting, setIsMinting] = useState(false);
  const [fetchingProofs, setFetchingProofs] = useState(false);
  const [errors, setErrors] = useState<string[]>([]);

  return {
    available,
    setAvailable,
    delegators,
    setDelegators,
    addressMintCounts,
    setAddressMintCounts,
    fetchingMintCounts,
    setFetchingMintCounts,
    proofResponse,
    setProofResponse,
    burnProofResponse,
    setBurnProofResponse,
    mintForAddress,
    setMintForAddress,
    tokenId,
    setTokenId,
    salt,
    mintCount,
    setMintCount,
    mintToInput,
    setMintToInput,
    mintToAddress,
    setMintToAddress,
    isMinting,
    setIsMinting,
    fetchingProofs,
    setFetchingProofs,
    errors,
    setErrors,
  };
}

export function useCollectionMintCount(
  collectionId: number,
  enableRefresh: boolean
) {
  const { data, error, isLoading, isFetching, refetch } = useReadContract({
    address: NEXTGEN_CORE[NEXTGEN_CHAIN_ID] as `0x${string}`,
    abi: NEXTGEN_CORE.abi,
    chainId: NEXTGEN_CHAIN_ID,
    query: {
      refetchInterval: enableRefresh ? 10000 : false,
    },
    functionName: "viewCirSupply",
    args: [collectionId],
  });

  return { data, error, isLoading, isFetching, refetch };
}

export enum NextGenListFilters {
  ID = "ID",
  LISTED_PRICE = "Listed Price",
  LAST_SALE = "Last Sale",
  HIGHEST_SALE = "Highest Sale",
  RARITY_SCORE = "Rarity Score",
  STATISTICAL_SCORE = "Statistical Score",
  SINGLE_TRAIT_RARITY = "Single Trait Rarity",
}

export function getOpenseaLink(chainId: number, tokenId?: number) {
  const domain = chainId === mainnet.id ? "opensea" : "testnets.opensea";
  let path = "ethereum";
  if (chainId === sepolia.id) {
    path = "sepolia";
  } else if (chainId === goerli.id) {
    path = "goerli";
  }
  return `https://${domain}.io/assets/${path}/${
    NEXTGEN_CORE[NEXTGEN_CHAIN_ID]
  }/${tokenId ?? ""}`;
}

export function getBlurCollectionLink() {
  return `https://blur.io/eth/collection/${NEXTGEN_CORE[
    NEXTGEN_CHAIN_ID
  ].toLowerCase()}`;
}

export function getMagicEdenCollectionLink() {
  return `https://magiceden.io/collections/ethereum/${NEXTGEN_CORE[
    NEXTGEN_CHAIN_ID
  ].toLowerCase()}`;
}

export function getBlurLink(tokenId?: number) {
  return `https://blur.io/eth/asset/${NEXTGEN_CORE[
    NEXTGEN_CHAIN_ID
  ].toLowerCase()}/${tokenId ?? ""}`;
}

export function getMagicEdenLink(tokenId?: number) {
  return `https://magiceden.io/item-details/ethereum/${NEXTGEN_CORE[
    NEXTGEN_CHAIN_ID
  ].toLowerCase()}/${tokenId ?? ""}`;
}

export { formatNameForUrl, normalizeNextgenTokenID };

export enum NextGenTokenRarityType {
  RARITY_SCORE = "RARITY_SCORE",
  RARITY_SCORE_NORMALISED = "RARITY_SCORE_NORMALISED",
  RARITY_SCORE_TRAIT_COUNT = "RARITY_SCORE_TRAIT_COUNT",
  RARITY_SCORE_TRAIT_COUNT_NORMALISED = "RARITY_SCORE_TRAIT_COUNT_NORMALISED",
  STATISTICAL_SCORE = "STATISTICAL_SCORE",
  STATISTICAL_SCORE_NORMALISED = "STATISTICAL_SCORE_NORMALISED",
  STATISTICAL_SCORE_TRAIT_COUNT = "STATISTICAL_SCORE_TRAIT_COUNT",
  STATISTICAL_SCORE_TRAIT_COUNT_NORMALISED = "STATISTICAL_SCORE_TRAIT_COUNT_NORMALISED",
  SINGLE_TRAIT_RARITY_SCORE = "SINGLE_TRAIT_RARITY_SCORE",
  SINGLE_TRAIT_RARITY_SCORE_NORMALISED = "SINGLE_TRAIT_RARITY_SCORE_NORMALISED",
  SINGLE_TRAIT_RARITY_SCORE_TRAIT_COUNT = "SINGLE_TRAIT_RARITY_SCORE_TRAIT_COUNT",
  SINGLE_TRAIT_RARITY_SCORE_TRAIT_COUNT_NORMALISED = "SINGLE_TRAIT_RARITY_SCORE_TRAIT_COUNT_NORMALISED",
}

export enum NextGenTokenListedType {
  ALL = "All",
  LISTED = "Listed",
  NOT_LISTED = "Not Listed",
}
