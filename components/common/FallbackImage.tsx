"use client"

import React from "react";

type FallbackImageProps = React.ImgHTMLAttributes<HTMLImageElement> & {
  primarySrc: string; // try first (your downscaled gif)
  fallbackSrc: string; // use if primary fails (your original gif)
  onPrimaryError?: (event: React.SyntheticEvent<HTMLImageElement, Event>) => void;
};

export const FallbackImage = React.forwardRef<HTMLImageElement, FallbackImageProps>(
  ({ primarySrc, fallbackSrc, alt = "", onError, onPrimaryError, ...rest }, ref) => {
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
