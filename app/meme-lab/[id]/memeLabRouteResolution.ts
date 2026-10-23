import { publicEnv } from "@/config/env";
import { MEMELAB_CONTRACT } from "@/constants/constants";
import type { DBResponse } from "@/entities/IDBResponse";
import type { BaseNFT } from "@/entities/INFT";
import { fetchUrl } from "@/services/6529api";
import { cache } from "react";

type MemeLabRouteResolution =
  | { readonly kind: "published"; readonly nft: BaseNFT }
  | { readonly kind: "missing" }
  | { readonly kind: "unavailable" };

export const resolveMemeLabRoute = cache(
  async (id: string): Promise<MemeLabRouteResolution> => {
    const numericId = Number(id);
    if (
      !/^\d+$/u.test(id) ||
      !Number.isSafeInteger(numericId) ||
      numericId < 1
    ) {
      return { kind: "missing" };
    }

    try {
      const params = new URLSearchParams({ contract: MEMELAB_CONTRACT, id });
      const response = await fetchUrl<DBResponse<BaseNFT>>(
        `${publicEnv.API_ENDPOINT}/api/nfts_memelab?${params.toString()}`,
        { cache: "no-store" }
      );
      if (!Array.isArray(response.data)) {
        return { kind: "unavailable" };
      }
      if (response.data.length === 0) {
        return { kind: "missing" };
      }
      const nft = response.data[0];
      if (
        response.data.length !== 1 ||
        nft?.id !== numericId ||
        typeof nft.contract !== "string"
      ) {
        return { kind: "unavailable" };
      }
      return { kind: "published", nft };
    } catch (error) {
      console.warn("Failed to resolve Meme Lab card", { id, error });
      return { kind: "unavailable" };
    }
  }
);
