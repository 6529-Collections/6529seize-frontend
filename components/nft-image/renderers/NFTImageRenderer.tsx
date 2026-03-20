"use client";

import Image from "next/image";
import { Col } from "react-bootstrap";
import styles from "../NFTImage.module.scss";
import NFTImageBalance from "../NFTImageBalance";
import type { BaseRendererProps } from "../types/renderer-props";
import { withArweaveFallback } from "../utils/arweave-fallback";

function getSrc(
  nft: BaseRendererProps["nft"],
  showThumbnail: boolean,
  showOriginal: boolean
): string {
  if (showThumbnail) {
    return nft.thumbnail;
  }

  if (showOriginal || !nft.scaled) {
    return nft.image;
  }

  return nft.scaled;
}

export default function NFTImageRenderer(props: Readonly<BaseRendererProps>) {
  const src = getSrc(props.nft, !!props.showThumbnail, !!props.showOriginal);
  const shouldLazyLoad = !!props.showThumbnail || props.height === 300;

  return (
    <Col
      xs={12}
      className={`${props.height !== "full" ? "mb-2" : ""}text-center d-flex align-items-center justify-content-center ${styles["imageWrapper"]} ${props.heightStyle} ${props.bgStyle}`}
    >
      <Image
        loading={shouldLazyLoad ? "lazy" : "eager"}
        priority={!shouldLazyLoad}
        width="0"
        height="0"
        fetchPriority={shouldLazyLoad ? "auto" : "high"}
        unoptimized
        className={props.imageStyle}
        style={{
          height: "auto",
          width: "auto",
          maxWidth: "100%",
          maxHeight: "100%",
        }}
        id={props.id ?? `image-${props.nft.id}`}
        src={src}
        alt={props.nft.name}
        onError={withArweaveFallback(({ currentTarget }) => {
          if (currentTarget.src === props.nft.thumbnail) {
            currentTarget.src = props.nft.scaled
              ? props.nft.scaled
              : props.nft.image;
          } else if (currentTarget.src === props.nft.scaled) {
            currentTarget.src = props.nft.image;
          } else if ("metadata" in props.nft) {
            currentTarget.src = props.nft.metadata.image;
          }
        })}
      />
      {props.showBalance && (
        <NFTImageBalance
          contract={props.nft.contract}
          tokenId={props.nft.id}
          height={props.height}
        />
      )}
    </Col>
  );
}
