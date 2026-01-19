"use client";

import { useEffect, useMemo, useState } from "react";
import NFTImage from "@/components/nft-image/NFTImage";
import { getMediaType } from "@/components/nft-image/utils/media-type";
import type { NFTWithMemesExtendedData } from "@/entities/INFT";
import useDeviceInfo from "@/hooks/useDeviceInfo";

interface NowMintingArtworkProps {
  readonly nft: NFTWithMemesExtendedData;
}

export default function NowMintingArtwork({ nft }: NowMintingArtworkProps) {
  const { hasTouchScreen } = useDeviceInfo();
  const isHtml = useMemo(() => getMediaType(nft, true) === "html", [nft]);
  const shouldGate = hasTouchScreen && isHtml;
  const [interactiveEnabled, setInteractiveEnabled] = useState(!shouldGate);

  useEffect(() => {
    if (shouldGate) {
      setInteractiveEnabled(false);
      return;
    }
    setInteractiveEnabled(true);
  }, [nft.id, shouldGate]);

  return (
    <div className="tw-flex tw-w-full tw-items-start tw-justify-center">
      <div className="tw-relative tw-w-full">
        <NFTImage
          nft={nft}
          animation={!shouldGate || interactiveEnabled}
          height={650}
          showBalance={true}
        />
        {shouldGate && !interactiveEnabled && (
          <button
            type="button"
            onClick={() => setInteractiveEnabled(true)}
            className="tw-absolute tw-inset-0 tw-flex tw-items-center tw-justify-center tw-bg-iron-950/50"
            aria-label="Load interactive artwork"
          >
            <span className="tw-inline-flex tw-items-center tw-justify-center tw-rounded-md tw-border tw-border-iron-700 tw-bg-iron-900/80 tw-px-3 tw-py-1.5 tw-text-xs tw-font-medium tw-text-iron-200 tw-transition hover:tw-bg-iron-800">
              Tap to load
            </span>
          </button>
        )}
      </div>
    </div>
  );
}
