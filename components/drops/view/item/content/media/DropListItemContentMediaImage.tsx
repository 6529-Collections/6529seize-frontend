import { useState, useRef, useEffect } from 'react';

export default function DropListItemContentMediaImage({
  src,
  onImageLoaded,
}: {
  readonly src: string;
  readonly onImageLoaded: () => void;
}) {
  const [isLoading, setIsLoading] = useState(true);
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 });
  const imgRef = useRef<HTMLImageElement>(null);

  useEffect(() => {
    const img = new Image();
    img.src = src;
    img.onload = () => {
      setDimensions({ width: img.width, height: img.height });
    };
  }, [src]);

  const handleImageLoad = () => {
    setIsLoading(false);
    onImageLoaded();
  };

  return (
    <div className="tw-w-full tw-h-full tw-max-w-lg tw-relative">
      {isLoading && (
        <div 
          className="tw-bg-iron-800 tw-animate-pulse tw-rounded-xl"
          style={{
            width: dimensions.width > 0 ? `${dimensions.width}px` : '100%',
            height: dimensions.height > 0 ? `${dimensions.height}px` : '100%',
            maxWidth: '100%',
            maxHeight: '100%',
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)'
          }}
        ></div>
      )}
      <img
        ref={imgRef}
        src={src}
        alt="Drop media"
        className={`tw-w-full tw-h-full tw-object-center tw-object-contain ${isLoading ? 'tw-opacity-0' : 'tw-opacity-100'}`}
        onLoad={handleImageLoad}
      />
    </div>
  );
}
