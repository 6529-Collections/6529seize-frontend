import React, { useState, useEffect } from "react";
import useVideoThumbnail from "../../../../../../hooks/useVideoThumbnail";

/**
 * Component to display a static thumbnail instead of a video or animated GIF
 * Used primarily on mobile devices to avoid autoplay and save bandwidth
 */
function MediaDisplayThumbnail({
  src,
  mimeType,
  className = "",
  onClick,
}: {
  readonly src: string;
  readonly mimeType: string;
  readonly className?: string;
  readonly onClick?: () => void;
}) {
  const isVideo = mimeType.includes("video");
  const isAnimatedGif = mimeType === "image/gif";
  
  // Generate thumbnail for videos
  const { thumbnail, isLoading, error } = useVideoThumbnail(
    isVideo ? src : null,
    0.1
  );

  // For GIFs, use the same URL but as a static image
  const [gifThumbnail, setGifThumbnail] = useState<string | null>(null);
  
  useEffect(() => {
    if (isAnimatedGif) {
      setGifThumbnail(src);
    }
  }, [isAnimatedGif, src]);

  // Loading state
  if (isVideo && isLoading) {
    return (
      <div className={`tw-flex tw-items-center tw-justify-center tw-w-full tw-h-full ${className}`}>
        <div className="tw-animate-pulse tw-bg-iron-700 tw-rounded-lg tw-w-full tw-h-full">
          <div className="tw-flex tw-items-center tw-justify-center tw-h-full">
            <span className="tw-text-sm tw-text-iron-300">Generating thumbnail...</span>
          </div>
        </div>
      </div>
    );
  }

  // Error state
  if (isVideo && error) {
    return (
      <div className={`tw-flex tw-items-center tw-justify-center tw-w-full tw-h-full ${className}`}>
        <span className="tw-text-iron-400 tw-text-sm">Media Preview</span>
      </div>
    );
  }

  // Video thumbnail
  if (isVideo && thumbnail) {
    return (
      <div 
        className={`tw-relative tw-w-full tw-h-full ${className} ${onClick ? 'tw-cursor-pointer' : ''}`}
        onClick={onClick}
        role={onClick ? "button" : undefined}
        tabIndex={onClick ? 0 : undefined}
        onKeyDown={onClick ? (e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            onClick();
          }
        } : undefined}
      >
        <img
          src={thumbnail}
          alt="Video thumbnail"
          className="tw-w-full tw-h-full tw-object-contain"
        />
        
        {/* Play button overlay */}
        <div className="tw-absolute tw-inset-0 tw-flex tw-items-center tw-justify-center">
          <div className="tw-bg-iron-900/70 tw-rounded-full tw-p-2 tw-backdrop-blur-sm">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="currentColor"
              className="tw-size-8 tw-text-white"
            >
              <path
                fillRule="evenodd"
                d="M4.5 5.653c0-1.426 1.529-2.33 2.779-1.643l11.54 6.348c1.295.712 1.295 2.573 0 3.285L7.28 19.991c-1.25.687-2.779-.217-2.779-1.643V5.653Z"
                clipRule="evenodd"
              />
            </svg>
          </div>
        </div>
      </div>
    );
  }

  // GIF static image
  if (isAnimatedGif && gifThumbnail) {
    return (
      <div 
        className={`tw-relative tw-w-full tw-h-full ${className} ${onClick ? 'tw-cursor-pointer' : ''}`}
        onClick={onClick}
        role={onClick ? "button" : undefined}
        tabIndex={onClick ? 0 : undefined}
        onKeyDown={onClick ? (e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            onClick();
          }
        } : undefined}
      >
        <img
          src={gifThumbnail}
          alt="GIF preview"
          className="tw-w-full tw-h-full tw-object-contain"
        />
        
        {/* Play icon */}
        <div className="tw-absolute tw-inset-0 tw-flex tw-items-center tw-justify-center">
          <div className="tw-bg-iron-900/70 tw-rounded-full tw-p-2 tw-backdrop-blur-sm">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="currentColor"
              className="tw-size-8 tw-text-white"
            >
              <path
                fillRule="evenodd"
                d="M4.5 5.653c0-1.426 1.529-2.33 2.779-1.643l11.54 6.348c1.295.712 1.295 2.573 0 3.285L7.28 19.991c-1.25.687-2.779-.217-2.779-1.643V5.653Z"
                clipRule="evenodd"
              />
            </svg>
          </div>
        </div>
      </div>
    );
  }

  // Default fallback
  return (
    <div className={`tw-flex tw-items-center tw-justify-center tw-w-full tw-h-full ${className}`}>
      <span className="tw-text-iron-400 tw-text-sm">Media Preview</span>
    </div>
  );
}

export default React.memo(MediaDisplayThumbnail);