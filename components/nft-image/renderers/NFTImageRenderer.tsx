"use client";

import Image from "next/image";
import { Col } from "react-bootstrap";
import styles from "../NFTImage.module.scss";
import NFTImageBalance from "../NFTImageBalance";
import { BaseRendererProps } from "../types/renderer-props";

function getNumericDimension(value: unknown): number | undefined {
  const numericValue = Number(value);
  if (Number.isFinite(numericValue) && numericValue > 0) {
    return numericValue;
  }

  return undefined;
}

function getDimensionsFromMetadata(
  nft: BaseRendererProps["nft"]
): { width: number; height: number } | undefined {
  if ("metadata" in nft) {
    const metadata = nft.metadata;
    const preferredDimensions =
      metadata?.animation_details ?? metadata?.image_details;

    const rawWidth = preferredDimensions?.width ?? metadata?.image_details?.width;
    const rawHeight = preferredDimensions?.height ?? metadata?.image_details?.height;

    const width = getNumericDimension(rawWidth);
    const height = getNumericDimension(rawHeight);

    if (width && height) {
      return { width, height };
    }

    const dimensionString =
      metadata?.dimensions || metadata?.dimension || metadata?.size;

    if (typeof dimensionString === "string") {
      const match = dimensionString.match(/(\d+)\D+(\d+)/);
      if (match) {
        const [, widthMatch, heightMatch] = match;
        const parsedWidth = getNumericDimension(widthMatch);
        const parsedHeight = getNumericDimension(heightMatch);

        if (parsedWidth && parsedHeight) {
          return { width: parsedWidth, height: parsedHeight };
        }
      }
    }
  }

  return undefined;
}

function getFallbackDimensions(height: BaseRendererProps["height"]): {
  width: number;
  height: number;
} {
  if (typeof height === "number") {
    return { width: height, height };
  }

  return { width: 1024, height: 1024 };
}

function getSrc(
  nft: BaseRendererProps["nft"],
  showThumbnail: boolean,
  showOriginal: boolean
): string {
  if (showThumbnail) {
    return nft.thumbnail;
  } else if (nft.scaled && !showOriginal) {
    return nft.scaled;
  } else {
    return nft.image;
  }
}

export default function NFTImageRenderer(props: Readonly<BaseRendererProps>) {
  const src = getSrc(props.nft, !!props.showThumbnail, !!props.showOriginal);
  const dimensions =
    getDimensionsFromMetadata(props.nft) ?? getFallbackDimensions(props.height);

  return (
    <Col
      xs={12}
      className={`mb-2 text-center d-flex align-items-center justify-content-center ${styles.imageWrapper} ${props.heightStyle} ${props.bgStyle}`.trim()}
    >
      <Image
        priority={props.priority}
        width={dimensions.width}
        height={dimensions.height}
        sizes={props.sizes}
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
        onError={({ currentTarget }) => {
          if (currentTarget.src === props.nft.thumbnail) {
            currentTarget.src = props.nft.scaled
              ? props.nft.scaled
              : props.nft.image;
          } else if (currentTarget.src === props.nft.scaled) {
            currentTarget.src = props.nft.image;
          } else if ("metadata" in props.nft) {
            currentTarget.src = props.nft.metadata.image;
          }
        }}
      />
      <NFTImageBalance
        showOwnedIfLoggedIn={props.showOwnedIfLoggedIn}
        showUnseizedIfLoggedIn={props.showUnseizedIfLoggedIn}
        contract={props.nft.contract}
        tokenId={props.nft.id}
        height={props.height}
      />
    </Col>
  );
}
