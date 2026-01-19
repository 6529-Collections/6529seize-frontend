"use client";

import { FallbackImage } from "@/components/common/FallbackImage";
import { getScaledImageUri, ImageScale } from "@/helpers/image.helpers";
import { useInView } from "@/hooks/useInView";
import React, { useCallback, useState } from "react";

interface Props {
  readonly src: string;
  readonly imageScale?: ImageScale | undefined;
}

function MediaDisplayImage({ src, imageScale = ImageScale.AUTOx1080 }: Props) {
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
      className="tw-relative tw-mx-[1px] tw-flex tw-h-full tw-w-full tw-items-center tw-justify-center"
    >
      {isLoading && (
        <div
          className="tw-animate-pulse tw-rounded-xl tw-bg-iron-800"
          style={loadingPlaceholderStyle}
        />
      )}
      {inView && (
        <FallbackImage
          primarySrc={getScaledImageUri(src, imageScale)}
          fallbackSrc={src}
          alt="Media content"
          optimize={false}
          fill
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
