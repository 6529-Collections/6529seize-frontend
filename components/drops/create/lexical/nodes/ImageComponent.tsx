"use client";

import React, { useState, type JSX } from "react";
import CircleLoader, {
  CircleLoaderSize,
} from "@/components/distribution-plan-tool/common/CircleLoader";
import {
  CHAT_GIF_PREVIEW_HEIGHT_PX,
  isTenorGifUrl,
} from "@/components/waves/drops/gifPreview";
import { URL_PREVIEW_IMAGE_ALT_TEXT } from "./urlPreviewImage.constants";

interface ImageComponentProps {
  readonly src: string;
  readonly altText?: string | undefined;
  readonly width?: number | undefined;
  readonly height?: number | undefined;
}

export default function ImageComponent({
  src,
  altText,
  width,
  height,
}: ImageComponentProps): JSX.Element {
  const isUrlPreviewGif =
    altText === URL_PREVIEW_IMAGE_ALT_TEXT && isTenorGifUrl(src);
  const displayAltText =
    altText === URL_PREVIEW_IMAGE_ALT_TEXT ? "" : (altText ?? "");
  const [dimensions, setDimensions] = useState({
    width: width ?? 0,
    height: height ?? 0,
  });

  const handleImageLoad = (
    event: React.SyntheticEvent<HTMLImageElement, Event>
  ) => {
    const img = event.currentTarget;
    const aspectRatio = img.naturalWidth / img.naturalHeight;

    let newWidth = width ?? img.naturalWidth;
    let newHeight = height ?? img.naturalHeight;

    if (!width && !height) {
      newWidth = Math.min(img.naturalWidth, 800); // Max width of 800px
      newHeight = newWidth / aspectRatio;
    } else if (width && !height) {
      newHeight = newWidth / aspectRatio;
    } else if (!width && height) {
      newWidth = newHeight * aspectRatio;
    }

    setDimensions({ width: newWidth, height: newHeight });
  };

  if (src === "loading") {
    return <CircleLoader size={CircleLoaderSize.MEDIUM} />;
  }

  return (
    <img
      src={src}
      alt={displayAltText}
      width={dimensions.width}
      height={dimensions.height}
      onLoad={handleImageLoad}
      style={
        isUrlPreviewGif
          ? {
              maxWidth: "100%",
              width: "auto",
              height: `${CHAT_GIF_PREVIEW_HEIGHT_PX}px`,
              objectFit: "contain",
            }
          : { maxWidth: "100%", height: "auto" }
      }
    />
  );
}
