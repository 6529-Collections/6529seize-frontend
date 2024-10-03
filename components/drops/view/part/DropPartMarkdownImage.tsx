import React, { useState, useRef, useEffect, useCallback } from "react";

interface DropPartMarkdownImageProps {
  readonly src: string;
  readonly alt?: string;
  readonly onImageLoaded: () => void;
}

const DropPartMarkdownImage: React.FC<DropPartMarkdownImageProps> = ({
  src,
  alt = "Seize",
  onImageLoaded,
  ...props
}) => {
  const [isLoading, setIsLoading] = useState(true);
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 });
  const imgRef = useRef<HTMLImageElement>(null);

  const updateDimensions = useCallback(() => {
    if (imgRef.current) {
      const { naturalWidth, naturalHeight } = imgRef.current;
      if (naturalWidth && naturalHeight) {
        setDimensions({ width: naturalWidth, height: naturalHeight });
        return true;
      }
    }
    return false;
  }, []);

  useEffect(() => {
    if (imgRef.current?.complete) {
      handleImageLoad();
    } else {
      const checkDimensions = () => {
        if (updateDimensions()) {
          clearInterval(intervalId);
        }
      };
      const intervalId = setInterval(checkDimensions, 100);
      return () => clearInterval(intervalId);
    }
  }, [updateDimensions]);

  const handleImageLoad = useCallback(() => {
    setIsLoading(false);
    onImageLoaded();
    updateDimensions();
  }, [onImageLoaded, updateDimensions]);

  const handleImageClick = useCallback((e: React.MouseEvent<HTMLImageElement>) => {
    e.stopPropagation();
    window.open(src, '_blank');
  }, [src]);

  const aspectRatio = dimensions.height
    ? dimensions.width / dimensions.height
    : 0;

  const imageStyle = {
    maxHeight: '70vh',
    width: 'auto',
    maxWidth: '100%',
    objectFit: 'contain' as const,
    cursor: 'pointer',
  };

  const placeholderStyle = aspectRatio
    ? {
        paddingBottom: `${Math.min((1 / aspectRatio) * 100, 70)}%`,
        maxHeight: '70vh',
      }
    : undefined;

  return (
    <div className="tw-relative tw-w-full tw-max-w-lg tw-mt-3 tw-flex">
      {isLoading && (
        <div
          className="tw-absolute tw-inset-0 tw-bg-iron-800 tw-animate-pulse tw-rounded-xl"
          style={placeholderStyle}
        ></div>
      )}
      <img
        ref={imgRef}
        src={src}
        alt={alt}
        onLoad={handleImageLoad}
        onClick={handleImageClick}
        className={`${isLoading ? "tw-opacity-0" : "tw-opacity-100"}`}
        style={imageStyle}
        {...props}
      />
    </div>
  );
};

export default React.memo(DropPartMarkdownImage);
