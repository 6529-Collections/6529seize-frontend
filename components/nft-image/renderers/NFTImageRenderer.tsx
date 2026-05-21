"use client";

import NFTImageBalance from "@/components/nft-image/NFTImageBalance";
import NFTMediaContainer from "@/components/nft-image/NFTMediaContainer";
import styles from "@/components/nft-image/NFTImage.module.scss";
import type { BaseRendererProps } from "@/components/nft-image/types/renderer-props";
import { withArweaveFallback } from "@/components/nft-image/utils/gateway-fallback";
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

export default function NFTImageRenderer(props: Readonly<BaseRendererProps>) {
  const src = getSrc(props.nft, !!props.showThumbnail, !!props.showOriginal);
  const shouldLazyLoad = !!props.showThumbnail || props.height === 300;
  const imageWrapperClassName = styles["imageWrapper"] ?? "";

  return (
    <NFTMediaContainer
      textCenter
      className={`${imageWrapperClassName} ${props.heightStyle} ${props.bgStyle}`}
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
}
