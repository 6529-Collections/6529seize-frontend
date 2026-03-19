"use client";

import InteractiveMediaLoadGate from "@/components/drops/media/InteractiveMediaLoadGate";
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
      {shouldGate && !interactiveEnabled ? (
        <InteractiveMediaLoadGate
          onLoad={() => setInteractiveEnabled(true)}
          ariaLabel="Load interactive artwork"
          className="tw-w-full"
        >
          <NFTImage
            nft={nft}
            animation={shouldAnimate}
            height={650}
            transparentBG
            showBalance={false}
          />
        </InteractiveMediaLoadGate>
      ) : (
        <div className="tw-relative tw-w-full">
          <NFTImage
            nft={nft}
            animation={shouldAnimate}
            height={650}
            transparentBG
            showBalance={false}
          />
        </div>
      )}
    </div>
  );
}
