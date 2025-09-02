"use client"

import React from "react";

type FallbackImageProps = React.ImgHTMLAttributes<HTMLImageElement> & {
  primarySrc: string;   // try first (your downscaled gif)
  fallbackSrc: string;  // use if primary fails (your original gif)
};

export const FallbackImage = React.forwardRef<HTMLImageElement, FallbackImageProps>(
  ({ primarySrc, fallbackSrc, alt = "", onError, ...rest }, ref) => {
    const [src, setSrc] = React.useState(primarySrc);
    const [usedFallback, setUsedFallback] = React.useState(false);

    // Reset state when primarySrc changes (for retries)
    React.useEffect(() => {
      setSrc(primarySrc);
      setUsedFallback(false);
    }, [primarySrc]);

    const handleError = (e: React.SyntheticEvent<HTMLImageElement, Event>) => {
      if (!usedFallback) {
        console.log(`[FallbackImage] Primary failed: ${primarySrc}, falling back to: ${fallbackSrc}`);
        setSrc(fallbackSrc);
        setUsedFallback(true);
      } else {
        // If fallback also fails, call the external onError handler
        onError?.(e);
      }
    };

    return (
      <img
        ref={ref}
        src={src}
        alt={alt}
        onError={handleError}
        loading="lazy"
        {...rest}
      />
    );
  }
);

FallbackImage.displayName = "FallbackImage";