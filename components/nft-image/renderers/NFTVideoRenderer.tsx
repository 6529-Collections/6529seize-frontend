"use client";

import { Col } from "react-bootstrap";
import styles from "../NFTImage.module.scss";
import NFTImageBalance from "../NFTImageBalance";
import type { BaseRendererProps } from "../types/renderer-props";
import { getResolvedAnimationSrc } from "../utils/animation-source";
import { withArweaveFallback } from "../utils/arweave-fallback";

const globalScope = globalThis as typeof globalThis & {
  window?: Window | undefined;
};

export default function NFTVideoRenderer(props: Readonly<BaseRendererProps>) {
  const animationSrc = getResolvedAnimationSrc(props.nft);
  const animationClassName = styles["nftAnimation"] ?? "";
  const compressedAnimationSrc =
    "metadata" in props.nft ? props.nft.compressed_animation : undefined;
  const normalizedCompressedAnimationSrc = (() => {
    if (compressedAnimationSrc == null || compressedAnimationSrc === "") {
      return undefined;
    }

    try {
      const baseUrl = globalScope.window.location.href;
      return new URL(compressedAnimationSrc, baseUrl).href;
    } catch {
      return undefined;
    }
  })();

  return (
    <Col
      className={`${animationClassName} ${props.heightStyle} ${props.bgStyle} d-flex justify-content-center align-items-center`}
    >
      {props.showBalance && (
        <NFTImageBalance
          contract={props.nft.contract}
          tokenId={props.nft.id}
          height={props.height}
        />
      )}
      <video
        id={props.id ?? `video-${props.nft.id}`}
        autoPlay
        muted
        controls
        loop
        playsInline
        preload="auto"
        src={
          !props.showOriginal &&
          "metadata" in props.nft &&
          props.nft.compressed_animation
            ? props.nft.compressed_animation
            : animationSrc
        }
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
    </Col>
  );
}
