"use client";

import DropListItemContentMediaVideo from "@/components/drops/view/item/content/media/DropListItemContentMediaVideo";
import NFTImageBalance from "@/components/nft-image/NFTImageBalance";
import NFTMediaContainer from "@/components/nft-image/NFTMediaContainer";
import styles from "@/components/nft-image/NFTImage.module.scss";
import type { BaseRendererProps } from "@/components/nft-image/types/renderer-props";
import { getResolvedAnimationSrc } from "@/components/nft-image/utils/animation-source";
import { withArweaveFallback } from "@/components/nft-image/utils/gateway-fallback";
import {
  getAnimationMimeTypeFromMetadata,
  getMimeTypeFromFormat,
} from "@/helpers/nft.helpers";

const globalScope = globalThis as typeof globalThis & {
  window?: Window | undefined;
};

function getUrlExtension(url: string | null | undefined): string | null {
  if (!url) {
    return null;
  }

  const clean = url.split("?")[0]?.split("#")[0] ?? "";
  const parts = clean.split(".");
  if (parts.length < 2) {
    return null;
  }

  return parts.at(-1)?.trim() || null;
}

export default function NFTVideoRenderer(props: Readonly<BaseRendererProps>) {
  const animationSrc = getResolvedAnimationSrc(props.nft);
  const animationClassName = styles["nftAnimation"] ?? "";
  const compressedAnimationSrc =
    "metadata" in props.nft ? props.nft.compressed_animation : undefined;
  const normalizedCompressedAnimationSrc = (() => {
    if (compressedAnimationSrc === undefined || compressedAnimationSrc === "") {
      return undefined;
    }

    try {
      const baseUrl = globalScope.window.location.href;
      return new URL(compressedAnimationSrc, baseUrl).href;
    } catch {
      return undefined;
    }
  })();
  const videoSrc =
    !props.showOriginal &&
    "metadata" in props.nft &&
    props.nft.compressed_animation
      ? props.nft.compressed_animation
      : animationSrc || undefined;
  const videoMimeType =
    getMimeTypeFromFormat(getUrlExtension(videoSrc)) ??
    ("metadata" in props.nft
      ? getAnimationMimeTypeFromMetadata(props.nft.metadata)
      : null) ??
    undefined;
  const fallbackSrc =
    videoSrc !== animationSrc && animationSrc ? animationSrc : undefined;

  return (
    <NFTMediaContainer
      className={`${animationClassName} ${props.heightStyle} ${props.bgStyle}`}
    >
      {props.showBalance && (
        <NFTImageBalance
          contract={props.nft.contract}
          tokenId={props.nft.id}
          height={props.height}
        />
      )}
      {props.useDropVideoPlayer ? (
        <div className={props.imageStyle}>
          <DropListItemContentMediaVideo
            src={videoSrc ?? ""}
            mimeType={videoMimeType}
            fallbackSrc={fallbackSrc}
            fillContainer
          />
        </div>
      ) : (
        <video
          id={props.id ?? `video-${props.nft.id}`}
          autoPlay
          muted
          controls
          loop
          playsInline
          preload="auto"
          src={videoSrc}
          className={props.imageStyle}
          onError={withArweaveFallback(({ currentTarget }) => {
            if (
              "metadata" in props.nft &&
              currentTarget.src === normalizedCompressedAnimationSrc &&
              animationSrc
            ) {
              currentTarget.src = animationSrc;
            }
          })}
        ></video>
      )}
    </NFTMediaContainer>
  );
}
