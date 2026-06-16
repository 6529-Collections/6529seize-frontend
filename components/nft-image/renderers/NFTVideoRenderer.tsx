"use client";

import DropListItemContentMediaVideo from "@/components/drops/view/item/content/media/DropListItemContentMediaVideo";
import NFTImageBalance from "@/components/nft-image/NFTImageBalance";
import NFTMediaContainer from "@/components/nft-image/NFTMediaContainer";
import styles from "@/components/nft-image/NFTImage.module.scss";
import type { BaseRendererProps } from "@/components/nft-image/types/renderer-props";
import { getResolvedAnimationSrc } from "@/components/nft-image/utils/animation-source";
import { withArweaveFallback } from "@/components/nft-image/utils/gateway-fallback";

const globalScope = globalThis as typeof globalThis & {
  window?: Window | undefined;
};

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
            mimeType="video/mp4"
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
