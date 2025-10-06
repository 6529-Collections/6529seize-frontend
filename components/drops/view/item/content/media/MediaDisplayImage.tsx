"use client";

import React, { useState, useCallback } from "react";
import {
  getScaledImageUri,
  ImageScale,
} from "@/helpers/image.helpers";
import { useInView } from "@/hooks/useInView";

interface Props {
  readonly src: string;
}

function MediaDisplayImage({ src }: Props) {
  const [ref, inView] = useInView<HTMLDivElement>();
  const [isLoading, setIsLoading] = useState(true);

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
      className="tw-w-full tw-h-full tw-flex tw-items-center tw-justify-center tw-relative tw-mx-[1px]">
      {isLoading && (
        <div
          className="tw-bg-iron-800 tw-animate-pulse tw-rounded-xl"
          style={loadingPlaceholderStyle}
        />
      )}
      {inView && (
        <img
          src={getScaledImageUri(src, ImageScale.AUTOx450)}
          alt="Media content"
          loading="lazy"
          decoding="async"
          className={`tw-object-contain tw-max-w-full ${
            isLoading ? "tw-opacity-0" : "tw-opacity-100"
          }`}
          style={{
            maxWidth: "100%",
            maxHeight: "100%",
          }}
          onLoad={handleImageLoad}
        />
      )}
    </div>
  );
}

export default React.memo(MediaDisplayImage);
