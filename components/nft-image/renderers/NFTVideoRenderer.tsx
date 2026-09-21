"use client";

import SeizeVideoPlayer from "@/components/drops/view/item/content/media/SeizeVideoPlayer";
import { getVideoRatio } from "@/components/drops/view/item/content/media/SeizeVideoPlayer.config";
import NFTImageBalance from "@/components/nft-image/NFTImageBalance";
import NFTMediaContainer from "@/components/nft-image/NFTMediaContainer";
import styles from "@/components/nft-image/NFTImage.module.css";
import type { BaseRendererProps } from "@/components/nft-image/types/renderer-props";
import { getResolvedAnimationSrc } from "@/components/nft-image/utils/animation-source";
import { getResolvedImageSrc } from "@/components/nft-image/utils/image-source";
import { getVideoPosterSrc } from "@/components/nft-image/utils/video-poster";
import { getNFTMediaRendererAttributes } from "@/components/nft-image/media-renderer-marker";

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
  const poster = getVideoPosterSrc([
    props.showThumbnail ? props.nft.thumbnail : undefined,
    props.showOriginal ? undefined : props.nft.scaled,
    props.nft.image,
    getResolvedImageSrc(props.nft),
    props.nft.scaled,
    props.nft.thumbnail,
  ]);

  const dimensions =
    "metadata" in props.nft ? props.nft.metadata?.animation_details : undefined;
  const aspectRatioHint = getVideoRatio(dimensions?.width, dimensions?.height);

  const frameClass = props.artworkLayout ? "tw-h-auto" : props.heightStyle;
  const videoLayout = props.artworkLayout ? "artwork" : "prominent";
  const useFrame = props.fillContainer === true || props.artworkLayout === true;
  return (
    <NFTMediaContainer
      className={`${animationClassName} ${props.fillContainer ? "tw-h-full" : frameClass} ${props.bgStyle}`}
    >
      {props.showBalance && (
        <NFTImageBalance
          contract={props.nft.contract}
          tokenId={props.nft.id}
          height={props.height}
        />
      )}
      <SeizeVideoPlayer
        {...getNFTMediaRendererAttributes("video")}
        id={props.id ?? `video-${props.nft.id}`}
        template="ambient-media"
        src={primarySrc}
        fallbackSources={fallbackSources}
        poster={poster}
        aspectRatioHint={aspectRatioHint}
        autoPlay
        muted
        loop
        preload="auto"
        layout={props.fillContainer ? "fill" : videoLayout}
        align="center"
        className={`${animationClassName} ${useFrame ? "" : props.heightStyle} ${props.bgStyle} tw-flex tw-items-center tw-justify-center`}
        videoClassName={useFrame ? undefined : props.imageStyle}
      />
    </NFTMediaContainer>
  );
}
