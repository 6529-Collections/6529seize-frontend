import React, { useState, useRef, useEffect } from 'react';

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

  const updateDimensions = () => {
    if (imgRef.current) {
      const { naturalWidth, naturalHeight } = imgRef.current;
      if (naturalWidth && naturalHeight) {
        setDimensions({ width: naturalWidth, height: naturalHeight });
      }
    }
  };

  useEffect(() => {
    const img = imgRef.current;
    if (img) {
      img.addEventListener('loadstart', updateDimensions);
      const interval = setInterval(updateDimensions, 100);
      return () => {
        img.removeEventListener('loadstart', updateDimensions);
        clearInterval(interval);
      };
    }
  }, []);

  const handleImageLoad = () => {
    setIsLoading(false);
    onImageLoaded();
    updateDimensions();
  };

  const aspectRatio = dimensions.height ? dimensions.width / dimensions.height : 0;
  const placeholderStyle = aspectRatio ? { paddingBottom: `${(1 / aspectRatio) * 100}%` } : undefined;

  return (
    <div className="tw-relative tw-w-full">
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
        className={`tw-w-full ${isLoading ? 'tw-opacity-0' : 'tw-opacity-100'}`}
        {...props}
      />
    </div>
  );
};

export default DropPartMarkdownImage;