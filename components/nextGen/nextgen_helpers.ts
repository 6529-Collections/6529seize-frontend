import { useContractRead, useContractReads, useContractWrite } from "wagmi";
import {
  NEXTGEN_ADMIN,
  NEXTGEN_CHAIN_ID,
  NEXTGEN_CORE,
  NEXTGEN_MINTER,
} from "./nextgen_contracts";
import { areEqualAddresses } from "../../helpers/Helpers";
import {
  AdditionalData,
  Info,
  LibraryScript,
  MintingDetails,
  PhaseTimes,
  Status,
} from "./nextgen_entities";
import { NEVER_DATE } from "../../constants";

export function useGlobalAdmin(address: string) {
  return useContractRead({
    address: NEXTGEN_ADMIN.contract as `0x${string}`,
    abi: NEXTGEN_ADMIN.abi,
    chainId: NEXTGEN_CHAIN_ID,
    functionName: "retrieveGlobalAdmin",
    args: [address],
  });
}

export function useFunctionAdmin(address: string, functionSelector: string) {
  return useContractRead({
    address: NEXTGEN_ADMIN.contract as `0x${string}`,
    abi: NEXTGEN_ADMIN.abi,
    chainId: NEXTGEN_CHAIN_ID,
    functionName: "retrieveFunctionAdmin",
    args: [address, functionSelector],
  });
}

export function useCollectionIndex() {
  return useContractRead({
    address: NEXTGEN_CORE.contract as `0x${string}`,
    abi: NEXTGEN_CORE.abi,
    chainId: NEXTGEN_CHAIN_ID,
    functionName: "newCollectionIndex",
  });
}

function getCollectionAdminReadParams(
  collectionIndex: number,
  address: string
) {
  const params: any = [];
  for (let i = 1; i <= collectionIndex - 1; i++) {
    params.push({
      address: NEXTGEN_ADMIN.contract as `0x${string}`,
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
      address: NEXTGEN_CORE.contract as `0x${string}`,
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

export function retrieveCollectionPhases(
  collection: number | string,
  callback: (data: any) => void,
  watch: boolean = false
) {
  return useContractRead({
    address: NEXTGEN_MINTER.contract as `0x${string}`,
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

export function retrieveCollectionAdditionalData(
  collection: number | string,
  callback: (data: any) => void,
  watch: boolean = false
) {
  return useContractRead({
    address: NEXTGEN_CORE.contract as `0x${string}`,
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

export function retrieveCollectionInfo(
  collection: number | string,
  callback: (data: any) => void,
  watch: boolean = false
) {
  return useContractRead({
    address: NEXTGEN_CORE.contract as `0x${string}`,
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

export function retrieveCollectionLibraryAndScript(
  collection: number | string,
  callback: (data: any) => void,
  watch: boolean = false
) {
  return useContractRead({
    address: NEXTGEN_CORE.contract as `0x${string}`,
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
          script: d[1],
        };
        callback(ls);
      }
    },
  });
}

export function retrieveCollectionCosts(
  collection: number | string,
  callback: (data: any) => void,
  watch: boolean = false
) {
  useContractRead({
    address: NEXTGEN_MINTER.contract as `0x${string}`,
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

export const getPhaseDateDisplay = (numberDate: number) => {
  const date = new Date(numberDate * 1000);
  if (
    isNaN(date.getTime()) ||
    numberDate >= NEVER_DATE * 1000 ||
    numberDate === 0
  ) {
    return "UNAVAILABLE";
  }
  const formattedDate = date.toLocaleString("default", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
  return `STARTING ${formattedDate.toUpperCase()}`;
};

export function isMintingOpen(startTime: number, endTime: number) {
  const now = new Date().getTime();
  return now > startTime * 1000 && now < endTime * 1000;
}

export function isMintingUpcoming(startTime: number) {
  const now = new Date().getTime();
  return startTime * 1000 > now;
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
  let alStatus = Status.COMPLETE;
  let publicStatus = Status.COMPLETE;
  const al_start = parseInt(d[0]);
  const al_end = parseInt(d[1]);
  if (isMintingOpen(al_start, al_end)) {
    alStatus = Status.LIVE;
  }
  if (isMintingUpcoming(al_start)) {
    alStatus = Status.UPCOMING;
  }

  const public_start = parseInt(d[3]);
  const public_end = parseInt(d[4]);
  if (isMintingOpen(public_start, public_end)) {
    publicStatus = Status.LIVE;
  }
  if (isMintingUpcoming(public_start)) {
    publicStatus = Status.UPCOMING;
  }

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

export function getCoreUseContractWrite(
  functionName: string,
  onError: () => void
) {
  return getUseContractWrite(NEXTGEN_CORE, functionName, onError);
}

export function getMinterUseContractWrite(
  functionName: string,
  onError: () => void
) {
  return getUseContractWrite(NEXTGEN_MINTER, functionName, onError);
}

export function getAdminUseContractWrite(
  functionName: string,
  onError: () => void
) {
  return getUseContractWrite(NEXTGEN_ADMIN, functionName, onError);
}

function getUseContractWrite(
  contract: { contract: string; abi: any },
  functionName: string,
  onError: () => void
) {
  return useContractWrite({
    address: contract.contract as `0x${string}`,
    abi: contract.abi,
    chainId: NEXTGEN_CHAIN_ID,
    functionName: functionName,
    onError() {
      onError();
    },
  });
}
