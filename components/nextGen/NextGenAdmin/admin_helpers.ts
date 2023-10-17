import { useContractRead, useContractReads } from "wagmi";
import {
  NEXTGEN_ADMIN,
  NEXTGEN_CHAIN_ID,
  NEXTGEN_CORE,
  NEXTGEN_FUNCTION_SELECTOR,
} from "../contracts";
import { areEqualAddresses } from "../../../helpers/Helpers";

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
    contracts: getCollectionAdminReadParams(collectionIndex, address as string),
  });
}

export function isCollectionAdmin(collectionAdmin: any) {
  return (
    collectionAdmin &&
    collectionAdmin.data &&
    collectionAdmin.data.some((d: any) => d.result === true)
  );
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
  return (
    collectionArtists &&
    collectionArtists.data &&
    collectionArtists.data.some((d: any) =>
      areEqualAddresses(address, d.result)
    )
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
  } else if (collectionAdmin && collectionAdmin.data) {
    collectionAdmin.data.forEach((d: any, i: number) => {
      if (d.result === true) {
        collectionIndexArray.push((i + 1).toString());
      }
    });
  }

  return collectionIndexArray;
}
