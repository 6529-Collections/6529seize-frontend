"use client";

import Image, { type ImageProps } from "next/image";
import React, { useMemo } from "react";

type FallbackImageProps = Omit<ImageProps, "src" | "alt"> & {
  readonly primarySrc: string;
  readonly fallbackSrc: string;
  readonly alt?: string | undefined;
  readonly onPrimaryError?: (
    event: React.SyntheticEvent<HTMLImageElement, Event>
  ) => void | undefined;
  readonly optimize?: boolean | undefined;
};

export const FallbackImage = React.forwardRef<
  HTMLImageElement,
  FallbackImageProps
>(
  (
    {
      primarySrc,
      fallbackSrc,
      alt = "",
      onError,
      onPrimaryError,
      optimize,
      ...imageProps
    },
    ref
  ) => {
    const [src, setSrc] = React.useState(primarySrc);
    const [usedFallback, setUsedFallback] = React.useState(false);

    // Reset state when primarySrc changes (for retries)
    React.useEffect(() => {
      setSrc(primarySrc);
      setUsedFallback(false);
    }, [primarySrc]);

    const handleError = (e: React.SyntheticEvent<HTMLImageElement, Event>) => {
      if (!usedFallback) {
        onPrimaryError?.(e);
        setSrc(fallbackSrc);
        setUsedFallback(true);
      } else {
        // If fallback also fails, call the external onError handler
        onError?.(e);
      }
    };

    const skipOptimization = useMemo(() => {
      if (optimize === false) {
        return true;
      }

      const targetSrc = src ?? primarySrc;

      const isAnimatedGif =
        /\.gif(?:$|\?)/i.test(primarySrc) || /\.gif(?:$|\?)/i.test(fallbackSrc);
      if (isAnimatedGif) {
        return true;
      }

      if (optimize === true) {
        return false;
      }

      try {
        const parsed = new URL(targetSrc);
        const hostname = parsed.hostname.toLowerCase();
        const isCloudfrontHost = hostname.endsWith(".cloudfront.net");
        return !isCloudfrontHost;
      } catch {
        return true;
      }
    }, [fallbackSrc, optimize, primarySrc, src]);

    return (
      <Image
        ref={ref}
        src={src}
        alt={alt}
        onError={handleError}
        unoptimized={skipOptimization}
        {...imageProps}
      />
    );
  }
);

FallbackImage.displayName = "FallbackImage";
