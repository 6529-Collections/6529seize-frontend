import { publicEnv } from "@/config/env";
import { goerli, sepolia } from "wagmi/chains";

import type {
  AlchemyGetNftsForOwnerResponse,
  AlchemyOwnedNft,
} from "./types";

const MAX_GET_NFTS_RETRIES = 3;
const legacyOptions = { method: "GET", headers: { accept: "application/json" } };

function createAbortError(signal: AbortSignal): Error {
  if (signal.reason instanceof Error) {
    return signal.reason;
  }
  if (typeof DOMException === "function") {
    return new DOMException("The operation was aborted.", "AbortError");
  }
  const error = new Error("The operation was aborted.");
  (error as Error & { name: string }).name = "AbortError";
  return error;
}

function delayWithAbort(ms: number, signal?: AbortSignal): Promise<void> {
  if (ms <= 0) {
    return Promise.resolve();
  }
  if (!signal) {
    return new Promise((resolve) => {
      setTimeout(resolve, ms);
    });
  }
  if (signal.aborted) {
    return Promise.reject(createAbortError(signal));
  }

  return new Promise((resolve, reject) => {
    let timeoutId: ReturnType<typeof setTimeout>;
    const onAbort = () => {
      clearTimeout(timeoutId);
      signal.removeEventListener("abort", onAbort);
      reject(createAbortError(signal));
    };

    timeoutId = setTimeout(() => {
      signal.removeEventListener("abort", onAbort);
      resolve();
    }, ms);

    signal.addEventListener("abort", onAbort, { once: true });
  });
}

async function fetchLegacyUrl<T>(url: string, signal?: AbortSignal): Promise<T> {
  const response = await fetch(url, { ...legacyOptions, signal });
  return (await response.json()) as T;
}

export async function getNftsForContractAndOwner(
  chainId: number,
  contract: string,
  owner: string,
  nfts: AlchemyOwnedNft[] = [],
  pageKey?: string,
  retries = 0,
  signal?: AbortSignal
) {
  let path = "eth-mainnet";
  if (chainId === sepolia.id) {
    path = "eth-sepolia";
  } else if (chainId === goerli.id) {
    path = "eth-goerli";
  }

  let url = `https://${path}.g.alchemy.com/nft/v3/${publicEnv.ALCHEMY_API_KEY}/getNFTsForOwner?owner=${owner}&contractAddresses[]=${contract}`;
  if (pageKey) {
    url += `&pageKey=${pageKey}`;
  }
  const response = await fetchLegacyUrl<AlchemyGetNftsForOwnerResponse>(
    url,
    signal
  );
  if (response.error) {
    if (retries >= MAX_GET_NFTS_RETRIES) {
      throw new Error("Failed to fetch NFTs for owner after retries");
    }
    await delayWithAbort(250 * (retries + 1), signal);
    return getNftsForContractAndOwner(
      chainId,
      contract,
      owner,
      nfts,
      pageKey,
      retries + 1,
      signal
    );
  }
  nfts = [...nfts, ...(response.ownedNfts ?? [])];
  if (response.pageKey) {
    return getNftsForContractAndOwner(
      chainId,
      contract,
      owner,
      nfts,
      response.pageKey,
      retries,
      signal
    );
  }

  const allNfts = nfts.map((nft) => {
    return {
      tokenId: nft.tokenId,
      tokenType: nft.tokenType,
      name: nft.name,
      tokenUri: nft.tokenUri,
      image: nft.image,
    };
  });
  return allNfts;
}
