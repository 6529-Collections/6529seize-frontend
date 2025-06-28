"use client";

import React, { useState, type JSX } from "react";
import CircleLoader, {
  CircleLoaderSize,
} from "../../../../distribution-plan-tool/common/CircleLoader";

interface ImageComponentProps {
  readonly src: string;
  readonly altText?: string;
  readonly width?: number;
  readonly height?: number;
}

export default function ImageComponent({
  src,
  altText,
  width,
  height,
}: ImageComponentProps): JSX.Element {
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
      alt={altText}
      width={dimensions.width}
      height={dimensions.height}
      onLoad={handleImageLoad}
      style={{ maxWidth: "100%", height: "auto" }}
    />
  );
}
