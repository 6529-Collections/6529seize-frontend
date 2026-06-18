"use client";

import SeizeVideoPlayer from "@/components/drops/view/item/content/media/SeizeVideoPlayer";
import NFTImageBalance from "@/components/nft-image/NFTImageBalance";
import NFTMediaContainer from "@/components/nft-image/NFTMediaContainer";
import styles from "@/components/nft-image/NFTImage.module.scss";
import type { BaseRendererProps } from "@/components/nft-image/types/renderer-props";
import { getResolvedAnimationSrc } from "@/components/nft-image/utils/animation-source";

export default function NFTVideoRenderer(props: Readonly<BaseRendererProps>) {
  const animationSrc = getResolvedAnimationSrc(props.nft);
  const animationClassName = styles["nftAnimation"] ?? "";
  const compressedAnimationSrc =
    "metadata" in props.nft ? props.nft.compressed_animation : undefined;
  const primarySrc =
    !props.showOriginal &&
    "metadata" in props.nft &&
    props.nft.compressed_animation
      ? props.nft.compressed_animation
      : animationSrc;
  const fallbackSources =
    compressedAnimationSrc && animationSrc ? [animationSrc] : [];

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
      <SeizeVideoPlayer
        id={props.id ?? `video-${props.nft.id}`}
        template="ambient-media"
        src={primarySrc}
        fallbackSources={fallbackSources}
        autoPlay
        muted
        loop
        preload="auto"
        layout="prominent"
        align="center"
        className={`${animationClassName} ${props.heightStyle} ${props.bgStyle} tw-flex tw-items-center tw-justify-center`}
        videoClassName={props.imageStyle}
      />
    </NFTMediaContainer>
  );
}
