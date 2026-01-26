"use client";

import { useEffect, useMemo, useState } from "react";
import NFTImage from "@/components/nft-image/NFTImage";
import { getMediaType } from "@/components/nft-image/utils/media-type";
import type { NFTWithMemesExtendedData } from "@/entities/INFT";
import useDeviceInfo from "@/hooks/useDeviceInfo";
import InteractiveIcon from "@/components/drops/media/InteractiveIcon";

interface NowMintingArtworkProps {
  readonly nft: NFTWithMemesExtendedData;
}

export default function NowMintingArtwork({ nft }: NowMintingArtworkProps) {
  const { hasTouchScreen } = useDeviceInfo();
  const isHtml = useMemo(() => getMediaType(nft, true) === "html", [nft]);
  const [hasMounted, setHasMounted] = useState(false);
  const shouldGate = hasTouchScreen && isHtml;
  const [interactiveEnabled, setInteractiveEnabled] = useState(false);

  useEffect(() => {
    setHasMounted(true);
  }, []);

  useEffect(() => {
    setInteractiveEnabled(false);
  }, [nft.id, shouldGate]);

  let shouldAnimate = true;
  if (isHtml) {
    shouldAnimate = hasMounted && (interactiveEnabled || !shouldGate);
  }

  return (
    <div className="tw-flex tw-w-full tw-items-start tw-justify-center">
      <div className="tw-relative tw-w-full">
        <NFTImage
          nft={nft}
          animation={shouldAnimate}
          height={650}
          showBalance={false}
        />
        {shouldGate && !interactiveEnabled && (
          <button
            type="button"
            onClick={() => setInteractiveEnabled(true)}
            className="tw-absolute tw-inset-0 tw-flex tw-items-center tw-justify-center tw-bg-transparent"
            aria-label="Load interactive artwork"
          >
            <span className="tw-inline-flex tw-items-center tw-justify-center tw-gap-2 tw-rounded-full tw-border tw-border-white/20 tw-bg-iron-950/90 tw-px-4 tw-py-2 tw-text-xs tw-font-semibold tw-text-white tw-shadow-[0_16px_40px_rgba(0,0,0,0.65)] tw-ring-1 tw-ring-white/10 tw-transition hover:tw-bg-iron-900">
              <InteractiveIcon className="tw-size-4 tw-flex-shrink-0" />
              Tap to load
            </span>
          </button>
        )}
      </div>
    </div>
  );
}
