"use client";

import { WaveLeaderboardLoadingBar } from "@/components/waves/leaderboard/drops/WaveLeaderboardLoadingBar";
import MarketplacePreview from "@/components/waves/MarketplacePreview";
import { ApiDropType } from "@/generated/models/ApiDropType";
import { useIntersectionObserver } from "@/hooks/useIntersectionObserver";
import { useWaveDrops } from "@/hooks/useWaveDrops";
import { useLayout } from "./layout/LayoutContext";
import React, { useCallback, useEffect, useMemo, useRef } from "react";

interface MyStreamWaveSalesProps {
  readonly waveId: string;
}

const getFirstSaleUrl = (
  nftLinks: { readonly url_in_text?: string | null | undefined }[] | undefined
): string | null => {
  for (const nftLink of nftLinks ?? []) {
    if (typeof nftLink.url_in_text !== "string") {
      continue;
    }

    const url = nftLink.url_in_text.trim();
    if (url.length > 0) {
      return url;
    }
  }

  return null;
};

const MyStreamWaveSales: React.FC<MyStreamWaveSalesProps> = ({ waveId }) => {
  const { salesViewStyle } = useLayout();
  const { drops, fetchNextPage, hasNextPage, isFetching, isFetchingNextPage } =
    useWaveDrops({
      waveId,
      dropType: ApiDropType.Participatory,
    });
  const salesUrls = useMemo(
    () =>
      drops.flatMap((drop) => {
        const url = getFirstSaleUrl(drop.nft_links);
        return url ? [url] : [];
      }),
    [drops]
  );
  const lastAutoPaginatedRenderableCountRef = useRef(0);

  useEffect(() => {
    lastAutoPaginatedRenderableCountRef.current = 0;
  }, [waveId]);

  useEffect(() => {
    if (salesUrls.length < lastAutoPaginatedRenderableCountRef.current) {
      lastAutoPaginatedRenderableCountRef.current = salesUrls.length;
    }
  }, [salesUrls.length]);

  const handleIntersection = useCallback(() => {
    if (!hasNextPage || isFetching || isFetchingNextPage) {
      return;
    }

    if (salesUrls.length === 0) {
      return;
    }

    if (salesUrls.length <= lastAutoPaginatedRenderableCountRef.current) {
      return;
    }

    lastAutoPaginatedRenderableCountRef.current = salesUrls.length;
    void fetchNextPage();
  }, [
    fetchNextPage,
    hasNextPage,
    isFetching,
    isFetchingNextPage,
    salesUrls.length,
  ]);
  const intersectionElementRef = useIntersectionObserver(handleIntersection);
  const isInitialLoading =
    isFetching && !isFetchingNextPage && drops.length === 0;

  let salesContent: React.ReactNode;
  if (isInitialLoading) {
    salesContent = (
      <div className="tw-flex tw-h-full tw-items-center tw-justify-center tw-p-6">
        <p className="tw-text-sm tw-font-medium tw-text-iron-200">
          Loading sales...
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
              <MarketplacePreview
                key={`${url}-${index}`}
                href={url}
                compact={true}
              />
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
