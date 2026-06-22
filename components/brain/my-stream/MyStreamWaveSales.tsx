"use client";

import { WaveLeaderboardLoadingBar } from "@/components/waves/leaderboard/drops/WaveLeaderboardLoadingBar";
import { primeMarketplacePreviewCacheFromNftLinks } from "@/components/waves/marketplace/common";
import MarketplacePreview from "@/components/waves/MarketplacePreview";
import type { ApiDropNftLink } from "@/generated/models/ApiDropNftLink";
import { useIntersectionObserver } from "@/hooks/useIntersectionObserver";
import { useWaveSalesDecisions } from "@/hooks/waves/useWaveSalesDecisions";
import { useQueryClient } from "@tanstack/react-query";
import { useLayout } from "./layout/LayoutContext";
import React, { useCallback, useLayoutEffect, useMemo } from "react";

interface MyStreamWaveSalesProps {
  readonly waveId: string;
}

const getFirstSaleNftLink = (
  nftLinks: readonly ApiDropNftLink[] | undefined
): ApiDropNftLink | null => {
  for (const nftLink of nftLinks ?? []) {
    if (typeof nftLink.url_in_text !== "string") {
      continue;
    }

    const url = nftLink.url_in_text.trim();
    if (url.length > 0) {
      return nftLink;
    }
  }

  return null;
};

const getSalesErrorMessage = (error: unknown): string | null => {
  if (error instanceof Error) {
    return error.message;
  }

  if (typeof error === "string") {
    return error;
  }

  return null;
};

const MyStreamWaveSales: React.FC<MyStreamWaveSalesProps> = ({ waveId }) => {
  const { salesViewStyle } = useLayout();
  const queryClient = useQueryClient();
  const {
    decisionPoints,
    error,
    fetchNextPage,
    hasNextPage,
    isError,
    isFetching,
    isFetchingNextPage,
  } = useWaveSalesDecisions({ waveId });
  const saleNftLinks = useMemo(
    () =>
      decisionPoints
        .slice()
        .reverse()
        .flatMap((decisionPoint) =>
          decisionPoint.winners.flatMap((winner) => {
            const nftLink = getFirstSaleNftLink(winner.drop.nft_links);
            return nftLink ? [nftLink] : [];
          })
        ),
    [decisionPoints]
  );
  const salesUrls = useMemo(
    () =>
      saleNftLinks.flatMap((nftLink) => {
        const url = nftLink.url_in_text?.trim();
        return url ? [url] : [];
      }),
    [saleNftLinks]
  );

  useLayoutEffect(() => {
    primeMarketplacePreviewCacheFromNftLinks({
      queryClient,
      nftLinks: saleNftLinks,
    });
  }, [queryClient, saleNftLinks]);

  const handleIntersection = useCallback(
    (isIntersecting: boolean) => {
      if (!isIntersecting || !hasNextPage || isFetching || isFetchingNextPage) {
        return;
      }

      void fetchNextPage();
    },
    [fetchNextPage, hasNextPage, isFetching, isFetchingNextPage]
  );
  const intersectionElementRef = useIntersectionObserver(handleIntersection);
  const isInitialLoading =
    isFetching && !isFetchingNextPage && decisionPoints.length === 0;
  const salesErrorMessage = getSalesErrorMessage(error);

  let salesContent: React.ReactNode;
  if (isInitialLoading) {
    salesContent = (
      <div className="tw-flex tw-h-full tw-items-center tw-justify-center tw-p-6">
        <p className="tw-text-sm tw-font-medium tw-text-iron-200">
          Loading sales...
        </p>
      </div>
    );
  } else if (isError) {
    salesContent = (
      <div className="tw-flex tw-h-full tw-items-center tw-justify-center tw-p-6">
        <p className="tw-text-sm tw-font-medium tw-text-iron-200">
          Failed to load sales
          {salesErrorMessage ? `: ${salesErrorMessage}` : "."}
        </p>
      </div>
    );
  } else if (salesUrls.length === 0 && !hasNextPage) {
    salesContent = (
      <div className="tw-flex tw-h-full tw-items-center tw-justify-center tw-p-6">
        <p className="tw-text-sm tw-font-medium tw-text-iron-200">
          No sales yet.
        </p>
      </div>
    );
  } else {
    salesContent = (
      <div className="tw-p-2 sm:tw-p-4 lg:tw-pr-2">
        {salesUrls.length > 0 ? (
          <div
            data-testid="wave-sales-grid"
            className="tw-grid tw-gap-4 @lg:tw-grid-cols-2 @3xl:tw-grid-cols-3"
          >
            {salesUrls.map((url, index) => (
              <MarketplacePreview key={`${url}-${index}`} href={url} compact />
            ))}
          </div>
        ) : (
          <div className="tw-flex tw-h-full tw-items-center tw-justify-center tw-p-6">
            <p className="tw-text-sm tw-font-medium tw-text-iron-200">
              No sales yet.
            </p>
          </div>
        )}

        {isFetchingNextPage && (
          <div className="tw-mt-4">
            <WaveLeaderboardLoadingBar />
          </div>
        )}
        {hasNextPage && (
          <div
            ref={intersectionElementRef}
            aria-hidden="true"
            className="tw-h-px"
          />
        )}
      </div>
    );
  }

  return (
    <div
      data-testid="wave-sales-scroll-container"
      className="tw-flex tw-w-full tw-flex-col tw-overflow-y-auto tw-scrollbar-thin tw-scrollbar-track-iron-800 tw-scrollbar-thumb-iron-500 tw-@container hover:tw-scrollbar-thumb-iron-300"
      style={salesViewStyle}
    >
      {salesContent}
    </div>
  );
};

export default MyStreamWaveSales;
