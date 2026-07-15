import { useEffect, useState } from "react";

import { MEMES_CONTRACT } from "@/constants/constants";
import type { DBResponse } from "@/entities/IDBResponse";
import type { NFT } from "@/entities/INFT";
import type { ApiMemesExtendedData } from "@/generated/models/ApiMemesExtendedData";
import { publicEnv } from "@/config/env";
import { fetchUrl } from "@/services/6529api";

export interface MemePageInitialData {
  readonly nft?: NFT | undefined;
  readonly nftMeta?: ApiMemesExtendedData | undefined;
  readonly nftNotFound: boolean;
}

type MemePageFallbackState =
  | { readonly status: "loading"; readonly attempt: number }
  | {
      readonly status: "loaded";
      readonly attempt: number;
      readonly data: MemePageInitialData;
    }
  | { readonly status: "error"; readonly attempt: number };

function isAbortError(error: unknown): boolean {
  return error instanceof Error && error.name === "AbortError";
}

export function useMemePageFallbackData({
  nftId,
  initialData,
}: {
  readonly nftId: string;
  readonly initialData?: MemePageInitialData | undefined;
}) {
  const [fallbackState, setFallbackState] = useState<MemePageFallbackState>({
    status: "loading",
    attempt: 0,
  });

  useEffect(() => {
    if (!nftId || initialData !== undefined) {
      return;
    }

    const controller = new AbortController();

    async function loadCardData() {
      try {
        const [metaResponse, nftResponse] = await Promise.all([
          fetchUrl<DBResponse<ApiMemesExtendedData>>(
            `${publicEnv.API_ENDPOINT}/api/memes_extended_data?id=${nftId}`,
            { signal: controller.signal }
          ),
          fetchUrl<DBResponse<NFT>>(
            `${publicEnv.API_ENDPOINT}/api/nfts?id=${nftId}&contract=${MEMES_CONTRACT}`,
            { signal: controller.signal }
          ),
        ]);
        if (controller.signal.aborted) {
          return;
        }

        const nftMetas = metaResponse.data;
        const nft = nftResponse.data[0];
        setFallbackState({
          status: "loaded",
          attempt: fallbackState.attempt,
          data:
            Array.isArray(nftMetas) && nftMetas.length === 1 && nft
              ? {
                  nftMeta: nftMetas[0],
                  nft,
                  nftNotFound: false,
                }
              : { nftNotFound: true },
        });
      } catch (error: unknown) {
        if (!isAbortError(error)) {
          setFallbackState({
            status: "error",
            attempt: fallbackState.attempt,
          });
        }
      }
    }

    void loadCardData();
    return () => controller.abort();
  }, [fallbackState.attempt, initialData, nftId]);

  const fallbackData =
    fallbackState.status === "loaded" ? fallbackState.data : undefined;

  return {
    pageData: initialData ?? fallbackData,
    cardLoadFailed:
      initialData === undefined && fallbackState.status === "error",
    retryCardData: () =>
      setFallbackState((current) => ({
        status: "loading",
        attempt: current.attempt + 1,
      })),
  };
}
