import React, { useEffect, useRef, useState } from 'react';
import CircleLoader, { CircleLoaderSize } from '../../../../distribution-plan-tool/common/CircleLoader';

interface ImageComponentProps {
  readonly src: string;
  readonly altText?: string;
  readonly width?: number;
  readonly height?: number;
}

export default function ImageComponent({ src, altText, width, height }: ImageComponentProps): JSX.Element {
  const imageRef = useRef<HTMLImageElement>(null);
  const [dimensions, setDimensions] = useState({ width: width || 0, height: height || 0 });

  useEffect(() => {
    const img = new Image();
    img.src = src;
    img.onload = () => {
      const aspectRatio = img.width / img.height;
      let newWidth = width || img.width;
      let newHeight = height || img.height;

      if (!width && !height) {
        newWidth = Math.min(img.width, 800); // Max width of 800px
        newHeight = newWidth / aspectRatio;
      } else if (width && !height) {
        newHeight = newWidth / aspectRatio;
      } else if (!width && height) {
        newWidth = newHeight * aspectRatio;
      }

      setDimensions({ width: newWidth, height: newHeight });
    };
  }, [src, width, height]);

  if (src === "loading") {
    return <CircleLoader size={CircleLoaderSize.MEDIUM} />;
  }

  return (
    <img
      ref={imageRef}
      src={src}
      alt={altText || ''}
      width={dimensions.width}
      height={dimensions.height}
      className="max-w-full h-auto object-contain"
    />
  );
}
