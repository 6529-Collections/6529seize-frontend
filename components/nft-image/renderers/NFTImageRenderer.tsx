"use client";

import artworkStyles from "@/components/drops/view/item/content/media/ArtworkFrame.module.css";
import type { CSSProperties } from "react";
import NFTImageBalance from "@/components/nft-image/NFTImageBalance";
import NFTMediaContainer from "@/components/nft-image/NFTMediaContainer";
import styles from "@/components/nft-image/NFTImage.module.css";
import type { BaseRendererProps } from "@/components/nft-image/types/renderer-props";
import { withArweaveFallback } from "@/components/nft-image/utils/gateway-fallback";
import { getNFTMediaRendererAttributes } from "@/components/nft-image/media-renderer-marker";
import Image from "next/image";

function getSrc(
  nft: BaseRendererProps["nft"],
  showThumbnail: boolean,
  showOriginal: boolean
): string {
  if (showThumbnail) {
    return nft.thumbnail;
  }

  if (!showOriginal && nft.scaled) {
    return nft.scaled;
  }

  return nft.image;
}

function getMetadataImage(nft: BaseRendererProps["nft"]): string | undefined {
  if (!("metadata" in nft)) {
    return undefined;
  }

  const metadata: unknown = nft.metadata;
  if (metadata === null || typeof metadata !== "object") {
    return undefined;
  }

  const image = (metadata as { readonly image?: unknown }).image;
  return typeof image === "string" ? image : undefined;
}

function getArtworkImageDimensions(props: Readonly<BaseRendererProps>) {
  const dimensions =
    props.artworkLayout && "metadata" in props.nft
      ? props.nft.metadata?.image_details
      : undefined;
  const width = dimensions?.width;
  const height = dimensions?.height;
  const hasDimensions =
    typeof width === "number" &&
    Number.isFinite(width) &&
    width > 0 &&
    typeof height === "number" &&
    Number.isFinite(height) &&
    height > 0;
  return hasDimensions ? { width, height } : undefined;
}

export default function NFTImageRenderer(props: Readonly<BaseRendererProps>) {
  const src = getSrc(props.nft, !!props.showThumbnail, !!props.showOriginal);
  const shouldLazyLoad = !!props.showThumbnail || props.height === 300;
  const imageWrapperClassName = styles["imageWrapper"] ?? "";
  const dimensions = getArtworkImageDimensions(props);
  const frameStyle = dimensions
    ? ({
        "--artwork-image-height": `calc(100cqw * ${dimensions.height / dimensions.width})`,
      } as CSSProperties)
    : undefined;
  const frameClass = props.artworkLayout
    ? (artworkStyles["imageFrame"] ?? "")
    : props.heightStyle;
  const imageClass = props.artworkLayout
    ? "tw-h-full tw-w-full tw-object-contain"
    : props.imageStyle;
  const fillImage =
    props.fillContainer === true || props.artworkLayout === true;
  const image = (
    <NFTMediaContainer
      artworkImageFrame={props.artworkLayout}
      textCenter
      className={`${imageWrapperClassName} ${props.fillContainer ? "tw-h-full" : frameClass} ${props.bgStyle}`}
    >
      <Image
        {...getNFTMediaRendererAttributes("image")}
        loading={shouldLazyLoad ? "lazy" : "eager"}
        priority={!shouldLazyLoad}
        width={dimensions?.width ?? 0}
        height={dimensions?.height ?? 0}
        data-artwork-image={props.artworkLayout ? true : undefined}
        fetchPriority={shouldLazyLoad ? "auto" : "high"}
        unoptimized
        className={props.fillContainer ? "tw-object-contain" : imageClass}
        style={{
          height: fillImage ? "100%" : "auto",
          width: fillImage ? "100%" : "auto",
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
          } else {
            const metadataImage = getMetadataImage(props.nft);
            if (metadataImage) {
              currentTarget.src = metadataImage;
            }
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
    </NFTMediaContainer>
  );
  if (!props.artworkLayout || props.fillContainer) return image;
  return (
    <div
      data-artwork-image-container
      className={artworkStyles["imageContainer"]}
      style={frameStyle}
    >
      {image}
    </div>
  );
}
