"use client";

import {
  DropImagePreview,
  getDropImagePreviewSources,
} from "./DropImagePreview";
import { ImageScale } from "@/helpers/image.helpers";
import useDeviceInfo from "@/hooks/useDeviceInfo";
import { useInView } from "@/hooks/useInView";
import React, { useCallback, useState } from "react";
import type { MediaLoadStrategy } from "./mediaLoadStrategy";
import { isGifImageUrl } from "@/helpers/gif-preview.helpers";
import {
  GifPreviewLoadingIndicator,
  type GifPreviewLoadingLayout,
} from "./GifPreviewLoadingIndicator";

interface Props {
  readonly src: string;
  readonly imageScale?: ImageScale | undefined;
  readonly loadStrategy?: MediaLoadStrategy | undefined;
  readonly imageLoadingLayout?: GifPreviewLoadingLayout | undefined;
}

function MediaDisplayImage({
  src,
  imageScale = ImageScale.AUTOx1080,
  loadStrategy = "in-view",
  imageLoadingLayout = "inline",
}: Props) {
  const [ref, inView] = useInView<HTMLDivElement>();
  const [isLoading, setIsLoading] = useState(true);
  const { hasTouchScreen } = useDeviceInfo();
  const shouldLoadImage = loadStrategy === "eager" || inView;
  const showArtworkGifLoader =
    imageLoadingLayout === "artwork" && isGifImageUrl(src);

  const handleImageLoad = useCallback(() => {
    setIsLoading(false);
  }, []);

  const loadingPlaceholderStyle: React.CSSProperties = {
    width: "100%",
    height: "100%",
    maxWidth: "100%",
    maxHeight: "100%",
    position: "absolute",
    top: "50%",
    left: "50%",
    transform: "translate(-50%, -50%)",
  };

  return (
    <div
      ref={ref}
      className="tw-relative tw-flex tw-h-full tw-w-full tw-items-center tw-justify-center"
    >
      {isLoading &&
        getDropImagePreviewSources(src, imageScale).length > 0 &&
        (showArtworkGifLoader ? (
          <GifPreviewLoadingIndicator layout="artwork" />
        ) : (
          <div
            className={`tw-rounded-xl tw-bg-iron-800 ${
              hasTouchScreen ? "" : "tw-animate-pulse"
            }`}
            style={loadingPlaceholderStyle}
          />
        ))}
      {shouldLoadImage && (
        <DropImagePreview
          originalSrc={src}
          imageScale={imageScale}
          alt="Media content"
          fill
          loading={loadStrategy === "eager" ? "eager" : undefined}
          sizes="(max-width: 768px) 100vw, 600px"
          className={`tw-max-w-full tw-object-contain ${
            isLoading ? "tw-opacity-0" : "tw-opacity-100"
          }`}
          onLoad={handleImageLoad}
          onError={handleImageLoad}
        />
      )}
    </div>
  );
}

export default React.memo(MediaDisplayImage);
