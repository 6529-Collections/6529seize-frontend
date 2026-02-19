"use client";

import { useQuery } from "@tanstack/react-query";

import { QueryKey } from "@/components/react-query-wrapper/ReactQueryWrapper";
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

const MARKETPLACE_PREVIEW_STALE_TIME_MS = 5 * 60 * 1000;

const toError = (value: unknown, fallbackMessage: string): Error =>
  value instanceof Error ? value : new Error(fallbackMessage);

export const useMarketplacePreviewState = ({
  href,
  mode = "default",
}: UseMarketplacePreviewStateParams): MarketplacePreviewState => {
  const normalizedHref = href.trim();
  const hasHref = normalizedHref.length > 0;

  const nftLinkQuery = useQuery({
    queryKey: [QueryKey.MARKETPLACE_NFT_LINK, { href: normalizedHref }],
    queryFn: async () => await fetchNftLink(normalizedHref),
    enabled: hasHref,
    staleTime: MARKETPLACE_PREVIEW_STALE_TIME_MS,
    retry: false,
  });

  const selectedNftLink =
    nftLinkQuery.data !== undefined && nftLinkQuery.data.data !== null
      ? nftLinkQuery.data
      : undefined;
  const resolvedMedia = pickNftLinkMedia(selectedNftLink);
  const resolvedPrice = pickNftLinkPrice(selectedNftLink);
  const shouldLoadFallback =
    !nftLinkQuery.isPending && resolvedMedia === undefined;

  const linkPreviewQuery = useQuery({
    queryKey: [
      QueryKey.MARKETPLACE_LINK_PREVIEW,
      { href: normalizedHref, mode },
    ],
    queryFn: async () => await fetchLinkPreview(normalizedHref),
    enabled: hasHref && shouldLoadFallback,
    staleTime: MARKETPLACE_PREVIEW_STALE_TIME_MS,
    retry: false,
  });

  if (!hasHref) {
    return {
      type: "error",
      href,
      error: new Error(
        "A valid URL is required to fetch link preview metadata."
      ),
    };
  }

  if (resolvedMedia) {
    return {
      type: "success",
      href,
      resolvedMedia,
      resolvedPrice,
    };
  }

  if (
    nftLinkQuery.isPending ||
    (shouldLoadFallback && linkPreviewQuery.isPending)
  ) {
    return {
      type: "loading",
      href,
    };
  }

  let fallbackMedia: PickedMedia | undefined;
  if (linkPreviewQuery.data) {
    const linkPreviewResponse =
      mode === "opensea-sanitized"
        ? sanitizeOpenSeaOverlayMedia(href, linkPreviewQuery.data)
        : linkPreviewQuery.data;
    fallbackMedia = pickMedia(linkPreviewResponse);
  }

  if (fallbackMedia) {
    return {
      type: "success",
      href,
      resolvedMedia: fallbackMedia,
      resolvedPrice,
    };
  }

  const error = linkPreviewQuery.error ?? nftLinkQuery.error;

  return {
    type: "error",
    href,
    error: toError(error, "Failed to load marketplace preview"),
  };
};
