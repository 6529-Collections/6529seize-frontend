import React, { useState, useRef, useCallback } from "react";

function DropListItemContentMediaImage({
  src,
  onImageLoaded,
}: {
  readonly src: string;
  readonly onImageLoaded: () => void;
}) {
  const [isLoading, setIsLoading] = useState(true);
  const imgRef = useRef<HTMLImageElement>(null);

  const handleImageLoad = useCallback(() => {
    setIsLoading(false);
    onImageLoaded();
  }, [onImageLoaded]);

  const handleImageClick = useCallback((event: React.MouseEvent<HTMLImageElement>) => {
    event.stopPropagation();
    window.open(src, '_blank');
  }, [src]);

  const loadingPlaceholderStyle: React.CSSProperties = {
    width: "100%",
    height: "100%",
    maxWidth: "100%",
    maxHeight: "100%",
    position: "absolute" as const,
    top: "50%",
    left: "50%",
    transform: "translate(-50%, -50%)",
  };

  return (
    <div className="tw-w-full tw-h-full tw-max-w-lg tw-relative">
      {isLoading && (
        <div
          className="tw-bg-iron-800 tw-animate-pulse tw-rounded-xl"
          style={loadingPlaceholderStyle}
        />
      )}
      <img
        ref={imgRef}
        src={src}
        alt="Drop media"
        className={`tw-w-full tw-h-full tw-object-center tw-object-contain ${
          isLoading ? "tw-opacity-0" : "tw-opacity-100"
        } tw-cursor-pointer`}
        onLoad={handleImageLoad}
        onClick={handleImageClick}
      />
    </div>
  );
}

export default React.memo(DropListItemContentMediaImage);
