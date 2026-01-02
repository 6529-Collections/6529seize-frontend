import { goerli, sepolia } from "wagmi/chains";

import { getAlchemyApiKey } from "@/config/alchemyEnv";
import type {
  AlchemyGetNftsForOwnerResponse,
  AlchemyOwnedNft,
  OwnerNft,
} from "./types";
import { processOwnerNftsResponse } from "./utils";

const MAX_GET_NFTS_RETRIES = 3;
const legacyOptions = {
  method: "GET",
  headers: { accept: "application/json" },
};

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

async function fetchLegacyUrl<T>(
  url: string,
  signal?: AbortSignal
): Promise<T> {
  const response = await fetch(url, { ...legacyOptions, ...(signal !== undefined ? { signal: signal } : {}) });
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
): Promise<OwnerNft[]> {
  if (!contract || !owner) {
    throw new Error("Contract and owner are required");
  }

  let path = "eth-mainnet";
  if (chainId === sepolia.id) {
    path = "eth-sepolia";
  } else if (chainId === goerli.id) {
    path = "eth-goerli";
  }

  const apiKey = getAlchemyApiKey();
  const baseUrl = `https://${path}.g.alchemy.com/nft/v3/${apiKey}/getNFTsForOwner?owner=${owner}&contractAddresses[]=${contract}`;
  const ownedNfts: AlchemyOwnedNft[] = [...nfts];
  let nextPageKey = pageKey;
  let attempts = retries;

  while (true) {
    let url = baseUrl;
    if (nextPageKey) {
      url += `&pageKey=${nextPageKey}`;
    }

    const response = await fetchLegacyUrl<AlchemyGetNftsForOwnerResponse>(
      url,
      signal
    );

    if (response.error) {
      if (attempts >= MAX_GET_NFTS_RETRIES) {
        throw new Error("Failed to fetch NFTs for owner after retries");
      }
      attempts += 1;
      await delayWithAbort(250 * attempts, signal);
      continue;
    }

    ownedNfts.push(...(response.ownedNfts ?? []));

    if (!response.pageKey) {
      break;
    }

    nextPageKey = response.pageKey;
  }

  return processOwnerNftsResponse(ownedNfts);
}
