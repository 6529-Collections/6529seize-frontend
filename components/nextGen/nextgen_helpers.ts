import {
  useAccount,
  useContractRead,
  useContractReads,
  useContractWrite,
} from "wagmi";
import {
  NEXTGEN_ADMIN,
  NEXTGEN_CHAIN_ID,
  NEXTGEN_CORE,
  NEXTGEN_MINTER,
  NextGenContract,
} from "./nextgen_contracts";
import { areEqualAddresses } from "../../helpers/Helpers";
import {
  AdditionalData,
  Info,
  LibraryScript,
  MintingDetails,
  PhaseTimes,
  ProofResponse,
  ProofResponseBurn,
  Status,
  TokensPerAddress,
} from "./nextgen_entities";
import { NEVER_DATE } from "../../constants";
import { useState } from "react";
import { Crumb } from "../breadcrumb/Breadcrumb";
import { goerli, mainnet, sepolia } from "viem/chains";
import { NextGenCollection } from "../../entities/INextgen";

export function useGlobalAdmin(address: string) {
  return useContractRead({
    address: NEXTGEN_ADMIN[NEXTGEN_CHAIN_ID] as `0x${string}`,
    abi: NEXTGEN_ADMIN.abi,
    chainId: NEXTGEN_CHAIN_ID,
    functionName: "retrieveGlobalAdmin",
    args: [address],
  });
}

export function useFunctionAdmin(address: string, functionSelector: string) {
  return useContractRead({
    address: NEXTGEN_ADMIN[NEXTGEN_CHAIN_ID] as `0x${string}`,
    abi: NEXTGEN_ADMIN.abi,
    chainId: NEXTGEN_CHAIN_ID,
    functionName: "retrieveFunctionAdmin",
    args: [address, functionSelector],
  });
}

export function useCollectionIndex() {
  return useContractRead({
    address: NEXTGEN_CORE[NEXTGEN_CHAIN_ID] as `0x${string}`,
    abi: NEXTGEN_CORE.abi,
    chainId: NEXTGEN_CHAIN_ID,
    functionName: "newCollectionIndex",
  });
}

export function useParsedCollectionIndex(collectionIndex: any) {
  const collectionIndexData = collectionIndex?.data;
  return collectionIndexData ? parseInt(collectionIndexData.toString()) : 0;
}

function getCollectionAdminReadParams(
  collectionIndex: number,
  address: string
) {
  const params: any = [];
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
  return useContractReads({
    contracts: getCollectionAdminReadParams(collectionIndex, address),
  });
}

export function isCollectionAdmin(collectionAdmin: any) {
  return collectionAdmin?.data?.some((d: any) => d.result === true);
}

function getCollectionArtistReadParams(collectionIndex: number) {
  const params: any = [];
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
  return useContractReads({
    contracts: getCollectionArtistReadParams(collectionIndex),
  });
}

export function isCollectionArtist(address: string, collectionArtists: any) {
  return collectionArtists?.data?.some((a: any) =>
    areEqualAddresses(address, a.result)
  );
}

export function getCollectionIdsForAddress(
  globalAdmin: boolean,
  functionAdmin: boolean,
  collectionAdmin: any,
  collectionIndex: number
) {
  const collectionIndexArray: string[] = [];
  if (globalAdmin || functionAdmin) {
    for (let i = 1; i <= collectionIndex - 1; i++) {
      collectionIndexArray.push(i.toString());
    }
  } else if (collectionAdmin?.data) {
    collectionAdmin.data.forEach((d: any, i: number) => {
      if (d.result === true) {
        collectionIndexArray.push((i + 1).toString());
      }
    });
  }

  return collectionIndexArray;
}

export function useCollectionPhases(
  collection: number | string,
  callback: (data: any) => void,
  watch: boolean = false
) {
  return useContractRead({
    address: NEXTGEN_MINTER[NEXTGEN_CHAIN_ID] as `0x${string}`,
    abi: NEXTGEN_MINTER.abi,
    chainId: NEXTGEN_CHAIN_ID,
    watch: watch,
    functionName: "retrieveCollectionPhases",
    args: [collection],
    onSettled(data: any, error: any) {
      if (data) {
        const d = data as any[];
        callback(extractPhases(d));
      }
    },
  });
}

export function useCollectionPhasesHook(
  collection: number,
  setPhaseTimes: (data: PhaseTimes) => void
) {
  useCollectionPhases(collection, (data: PhaseTimes) => {
    setPhaseTimes(data);
  });
}

export function useCollectionAdditionalData(
  collection: number | string,
  callback: (data: any) => void,
  watch: boolean = false
) {
  return useContractRead({
    address: NEXTGEN_CORE[NEXTGEN_CHAIN_ID] as `0x${string}`,
    abi: NEXTGEN_CORE.abi,
    chainId: NEXTGEN_CHAIN_ID,
    watch: watch,
    functionName: "retrieveCollectionAdditionalData",
    args: [collection],
    onSettled(data: any, error: any) {
      if (data) {
        const d = data as any[];
        const ad: AdditionalData = {
          artist_address: d[0],
          max_purchases: parseInt(d[1]),
          circulation_supply: parseInt(d[2]),
          total_supply: parseInt(d[3]),
          final_supply_after_mint: parseInt(d[4]),
          randomizer: d[5],
        };
        callback(ad);
      }
    },
  });
}

export function useCollectionAdditionalHook(
  collection: number,
  setData: (data: AdditionalData) => void,
  watch: boolean = false
) {
  useCollectionAdditionalData(
    collection,
    (data: AdditionalData) => {
      setData(data);
    },
    watch
  );
}

export function useCollectionInfo(
  collection: number | string,
  callback: (data: any) => void,
  watch: boolean = false
) {
  return useContractRead({
    address: NEXTGEN_CORE[NEXTGEN_CHAIN_ID] as `0x${string}`,
    abi: NEXTGEN_CORE.abi,
    chainId: NEXTGEN_CHAIN_ID,
    watch: watch,
    functionName: "retrieveCollectionInfo",
    args: [collection],
    onSettled(data: any, error: any) {
      if (data) {
        const d = data as any[];
        if (d.some((e) => e)) {
          const i1: Info = {
            name: d[0],
            artist: d[1],
            description: d[2],
            website: d[3],
            licence: d[4],
            base_uri: d[5],
          };
          callback(i1);
        }
      }
    },
  });
}

export function useCollectionInfoHook(
  collection: number,
  setData: (data: Info) => void,
  watch: boolean = false
) {
  useCollectionInfo(
    collection,
    (data: Info) => {
      setData(data);
    },
    watch
  );
}

export function useCollectionLibraryAndScript(
  collection: number | string,
  callback: (data: any) => void,
  watch: boolean = false
) {
  return useContractRead({
    address: NEXTGEN_CORE[NEXTGEN_CHAIN_ID] as `0x${string}`,
    abi: NEXTGEN_CORE.abi,
    chainId: NEXTGEN_CHAIN_ID,
    watch: watch,
    functionName: "retrieveCollectionLibraryAndScript",
    args: [collection],
    onSettled(data: any, error: any) {
      if (data) {
        const d = data as any[];
        const ls: LibraryScript = {
          library: d[0],
          dependency_script: d[1],
          script: d[2],
        };
        callback(ls);
      }
    },
  });
}

export function useCollectionCosts(
  collection: number | string,
  callback: (data: any) => void,
  watch: boolean = false
) {
  useContractRead({
    address: NEXTGEN_MINTER[NEXTGEN_CHAIN_ID] as `0x${string}`,
    abi: NEXTGEN_MINTER.abi,
    chainId: NEXTGEN_CHAIN_ID,
    functionName: "retrieveCollectionMintingDetails",
    args: [collection],
    watch: watch,
    enabled: !!collection,
    onSettled(data: any, error: any) {
      if (data) {
        const d = data as any[];
        const md: MintingDetails = {
          mint_cost: parseInt(d[1]),
          end_mint_cost: parseInt(d[1]),
          rate: parseInt(d[2]),
          time_period: parseInt(d[3]),
          sales_option: parseInt(d[4]),
          del_address: d[5],
        };
        callback(md);
      }
    },
  });
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

export function extractURI(s: string) {
  const regex = /"animation_url":"([^"]+)"/;
  const match = regex.exec(s);
  if (match && match.length >= 2) {
    const animationUrl = match[1];
    const base64Data = animationUrl.split(",")[1];
    const uri = Buffer.from(base64Data, "base64").toString("utf-8");
    return {
      uri: uri,
      data: animationUrl,
    };
  } else {
    return {
      uri: "",
      data: "",
    };
  }
}

export function extractField(field: string, s: string) {
  const regex = new RegExp(`"${field}":"([^"]+)"`);
  const match = regex.exec(s);
  if (match && match.length >= 2) {
    return match[1];
  } else {
    return "";
  }
}

export function extractAttributes(s: string) {
  const regex = /"attributes":\[(.*?)\]/;
  const match = regex.exec(s);
  if (match) {
    return JSON.parse(`[${match[1]}]`);
  }
  return null;
}

export function extractPhases(d: any[]) {
  const al_start = parseInt(d[0]);
  const al_end = parseInt(d[1]);
  const public_start = parseInt(d[3]);
  const public_end = parseInt(d[4]);

  const alStatus = getStatusFromDates(al_start, al_end);
  const publicStatus = getStatusFromDates(public_start, public_end);

  const phases: PhaseTimes = {
    allowlist_start_time: al_start,
    allowlist_end_time: al_end,
    merkle_root: d[2],
    public_start_time: public_start,
    public_end_time: public_end,
    al_status: alStatus,
    public_status: publicStatus,
  };
  return phases;
}

export function useTokensIndex(
  type: "min" | "max",
  collection: number | string,
  callback: (data: any) => void
) {
  return useContractRead({
    address: NEXTGEN_CORE[NEXTGEN_CHAIN_ID] as `0x${string}`,
    abi: NEXTGEN_CORE.abi,
    chainId: NEXTGEN_CHAIN_ID,
    functionName: type === "min" ? "viewTokensIndexMin" : "viewTokensIndexMax",
    args: [collection],
    onSettled(data: any, error: any) {
      if (data) {
        const d = parseInt(data);
        callback(d);
      }
    },
  });
}

export function useCoreContractWrite(
  functionName: string,
  onError: () => void
) {
  return useContractWriteForFunction(NEXTGEN_CORE, functionName, onError);
}

export function useMinterContractWrite(
  functionName: string,
  onError: () => void
) {
  return useContractWriteForFunction(NEXTGEN_MINTER, functionName, onError);
}

export function useAdminContractWrite(
  functionName: string,
  onError: () => void
) {
  return useContractWriteForFunction(NEXTGEN_ADMIN, functionName, onError);
}

function useContractWriteForFunction(
  contract: NextGenContract,
  functionName: string,
  onError: () => void
) {
  return useContractWrite({
    address: contract[NEXTGEN_CHAIN_ID] as `0x${string}`,
    abi: contract.abi,
    chainId: NEXTGEN_CHAIN_ID,
    functionName: functionName,
    onError() {
      onError();
    },
  });
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
  const account = useAccount();
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
  return useContractRead({
    address: NEXTGEN_CORE[NEXTGEN_CHAIN_ID] as `0x${string}`,
    abi: NEXTGEN_CORE.abi,
    chainId: NEXTGEN_CHAIN_ID,
    watch: enableRefresh,
    functionName: "viewCirSupply",
    args: [collectionId],
  });
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

export function formatNameForUrl(name: string) {
  return name.replace(/ /g, "-").toLowerCase();
}

export function normalizeNextgenTokenID(tokenId: number) {
  const collectionId = Math.round(tokenId / 10000000000);
  const normalisedTokenId = tokenId - collectionId * 10000000000;
  return {
    collection_id: collectionId,
    token_id: normalisedTokenId,
  };
}

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
  LISTED = "Yes",
  NOT_LISTED = "No",
}

export function getCollectionBaseBreadcrums(
  collection: NextGenCollection,
  page: string
) {
  const crumbs = [
    { display: "Home", href: "/" },
    { display: "NextGen", href: "/nextgen" },
    {
      display: `${collection.name}`,
      href: `/nextgen/collection/${formatNameForUrl(collection.name)}`,
    },
    { display: page },
  ];

  return crumbs;
}

export enum NextGenTokenImageMode {
  LIVE = "Live",
  IMAGE = "Image",
  HIGH_RES = "High Res",
  // SCENE = "Scene",
  BOHO_CHICK_LIVINGROOM = "Boho Chick Livingroom",
  MODERN_BLACK_LIVINGROOM = "Modern Black Livingroom",
  PEBBLE_MUSEUM = "Pebble Museum",
  NYC_LOFT = "NYC Loft",
  URBAN_ALLEY = "Urban Alley",
  GRAND_LOBBY = "Grand Lobby",
}
