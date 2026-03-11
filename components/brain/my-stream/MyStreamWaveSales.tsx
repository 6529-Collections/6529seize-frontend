"use client";

import MarketplacePreview from "@/components/waves/MarketplacePreview";
import { ApiDropType } from "@/generated/models/ApiDropType";
import { useWaveDrops } from "@/hooks/useWaveDrops";
import React, { useMemo } from "react";

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
  const { drops, isFetching } = useWaveDrops({
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

  if (isFetching) {
    return (
      <div className="tw-flex tw-h-full tw-items-center tw-justify-center tw-p-6">
        <p className="tw-text-sm tw-font-medium tw-text-iron-200">
          Loading sales...
        </p>
      </div>
    );
  }

  if (salesUrls.length === 0) {
    return (
      <div className="tw-flex tw-h-full tw-items-center tw-justify-center tw-p-6">
        <p className="tw-text-sm tw-font-medium tw-text-iron-200">
          No sales yet.
        </p>
      </div>
    );
  }

  return (
    <div className="tw-h-full tw-overflow-y-auto tw-p-2 tw-scrollbar-thin tw-scrollbar-track-iron-800 tw-scrollbar-thumb-iron-500 tw-@container hover:tw-scrollbar-thumb-iron-300 sm:tw-p-4">
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
    </div>
  );
};

export default MyStreamWaveSales;
