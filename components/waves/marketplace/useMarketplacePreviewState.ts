"use client";

import { useEffect, useState } from "react";

import {
  type PickedMedia,
  pickMedia,
  pickNftLinkMedia,
  pickNftLinkPrice,
  sanitizeOpenSeaOverlayMedia,
  type MarketplacePreviewState,
} from "./common";
import { fetchLinkPreview } from "@/services/api/link-preview-api";
import { fetchNftLink } from "@/services/api/nft-link-api";

type MarketplacePreviewMode = "default" | "opensea-sanitized";

interface UseMarketplacePreviewStateParams {
  readonly href: string;
  readonly mode?: MarketplacePreviewMode | undefined;
}

export const useMarketplacePreviewState = ({
  href,
  mode = "default",
}: UseMarketplacePreviewStateParams): MarketplacePreviewState => {
  const [state, setState] = useState<MarketplacePreviewState>({
    type: "loading",
    href,
  });

  useEffect(() => {
    let active = true;

    const loadPreview = async (): Promise<void> => {
      let resolvedMedia: PickedMedia | undefined;
      let resolvedPrice: string | undefined;
      let nftLinkError: unknown;

      try {
        const nftLinkResult = await fetchNftLink(href);
        console.warn("[MarketplacePreview] /nft-link response", {
          href,
          response: nftLinkResult,
        });
        const selectedNftLink =
          nftLinkResult.data !== null ? nftLinkResult : undefined;
        resolvedMedia = pickNftLinkMedia(selectedNftLink);
        resolvedPrice = pickNftLinkPrice(selectedNftLink);
      } catch (error) {
        nftLinkError = error;
        console.error("[MarketplacePreview] /nft-link failed", {
          href,
          error,
        });
      }

      if (resolvedMedia) {
        if (!active) {
          return;
        }

        setState({
          type: "success",
          href,
          resolvedMedia,
          resolvedPrice,
        });
        return;
      }

      let fallbackMedia: PickedMedia | undefined;
      let linkPreviewError: unknown;

      try {
        const linkPreviewResponse = await fetchLinkPreview(href);
        const response =
          mode === "opensea-sanitized"
            ? sanitizeOpenSeaOverlayMedia(href, linkPreviewResponse)
            : linkPreviewResponse;
        fallbackMedia = pickMedia(response);
      } catch (error) {
        linkPreviewError = error;
      }

      if (!active) {
        return;
      }

      if (fallbackMedia) {
        setState({
          type: "success",
          href,
          resolvedMedia: fallbackMedia,
          resolvedPrice,
        });
        return;
      }

      const error = linkPreviewError ?? nftLinkError;

      setState({
        type: "error",
        href,
        error:
          error instanceof Error
            ? error
            : new Error("Failed to load marketplace preview"),
      });
    };

    void loadPreview();

    return () => {
      active = false;
    };
  }, [href, mode]);

  return state;
};
