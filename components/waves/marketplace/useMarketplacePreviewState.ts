"use client";

import { useQuery } from "@tanstack/react-query";

import { QueryKey } from "@/components/react-query-wrapper/ReactQueryWrapper";
import {
  fromNftLink,
  mergeOpenGraphFallback,
  needsOpenGraphFallback,
  type MarketplacePreviewMode,
  type MarketplacePreviewState,
} from "./common";
import { fetchLinkPreview } from "@/services/api/link-preview-api";
import { fetchNftLink } from "@/services/api/nft-link-api";

interface UseMarketplacePreviewStateParams {
  readonly href: string;
  readonly mode?: MarketplacePreviewMode | undefined;
}

const MARKETPLACE_PREVIEW_STALE_TIME_MS = 5 * 60 * 1000;

const toError = (value: unknown, fallbackMessage: string): Error =>
  value instanceof Error ? value : new Error(fallbackMessage);

const toNonEmptyString = (value: unknown): string | undefined => {
  if (typeof value !== "string") {
    return undefined;
  }

  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : undefined;
};

export const useMarketplacePreviewState = ({
  href,
  mode = "default",
}: UseMarketplacePreviewStateParams): MarketplacePreviewState => {
  const normalizedHref = href.trim();
  const hasHref = normalizedHref.length > 0;

  const marketplacePreviewQuery = useQuery({
    queryKey: [QueryKey.MARKETPLACE_PREVIEW, { href: normalizedHref, mode }],
    queryFn: async () => {
      let preview = fromNftLink({ href: normalizedHref });

      try {
        const nftLinkResponse = await fetchNftLink(normalizedHref);
        preview = fromNftLink({
          href: normalizedHref,
          response: nftLinkResponse,
        });
      } catch {
        // Ignore nft-link errors and continue with open-graph fallback.
      }

      if (!needsOpenGraphFallback(preview)) {
        return preview;
      }

      try {
        const linkPreview = await fetchLinkPreview(normalizedHref);
        return mergeOpenGraphFallback({
          href: normalizedHref,
          mode,
          current: preview,
          linkPreview,
        });
      } catch (error) {
        if (preview.media !== null) {
          return preview;
        }

        throw error;
      }
    },
    enabled: hasHref,
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

  if (marketplacePreviewQuery.isPending) {
    return {
      type: "loading",
      href,
    };
  }

  const resolvedMedia = marketplacePreviewQuery.data?.media;

  if (resolvedMedia !== null && resolvedMedia !== undefined) {
    return {
      type: "success",
      href,
      resolvedMedia,
      resolvedPrice: marketplacePreviewQuery.data?.price ?? undefined,
      resolvedTitle: toNonEmptyString(marketplacePreviewQuery.data?.title),
    };
  }

  const error = marketplacePreviewQuery.error;

  return {
    type: "error",
    href,
    error: toError(error, "Failed to load marketplace preview"),
  };
};
