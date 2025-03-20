import React from 'react';
import { motion } from 'framer-motion';
import type { FilePreviewProps } from '../reducers/types';
import VideoFallbackPreview from './VideoFallbackPreview';

/**
 * File Preview Component
 * 
 * Displays a preview of the uploaded file, with specialized handling for images and videos.
 * Includes compatibility checking and fallback for non-playable videos.
 * 
 * @param props Component props
 * @returns JSX Element
 */
const FilePreview: React.FC<FilePreviewProps> = ({ 
  url, 
  file,
  onRemove,
  videoCompatibility,
  isCheckingCompatibility
}) => {
  // Determine if this is a video file
  const isVideo = file?.type.startsWith('video/') || url.startsWith('data:video/');
  
  // Check if video is compatible for playback
  const canPlayVideo = !isVideo || 
    (videoCompatibility?.canPlay ?? true);
  
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="tw-relative tw-w-full tw-h-full tw-bg-iron-950/50 tw-flex tw-items-center tw-justify-center"
    >
      {/* Container with checkerboard pattern for transparent media */}
      <div className="tw-absolute tw-inset-0 tw-opacity-5">
        <div className="tw-grid tw-grid-cols-8 tw-h-full">
          {Array(64)
            .fill(0)
            .map((_, i) => (
              <div
                key={i}
                className={`tw-border-[0.5px] ${i % 2 === 0 ? 'tw-bg-iron-400/10' : 'tw-bg-iron-600/10'}`}
              />
            ))}
        </div>
      </div>
      
      {/* Show compatibility checking indicator */}
      {isCheckingCompatibility && isVideo && (
        <div className="tw-absolute tw-inset-0 tw-flex tw-items-center tw-justify-center tw-bg-iron-950/70 tw-z-10">
          <div className="tw-flex tw-flex-col tw-items-center tw-gap-3">
            <div className="tw-h-10 tw-w-10 tw-border-t-2 tw-border-b-2 tw-border-primary-500 tw-rounded-full tw-animate-spin" />
            <span className="tw-text-iron-300">Checking video compatibility...</span>
          </div>
        </div>
      )}
      
      {/* Media container with proper padding and centering */}
      <div className="tw-relative tw-w-full tw-h-full tw-flex tw-items-center tw-justify-center tw-p-4 tw-overflow-hidden">
        {/* For images and compatible videos, render standard preview */}
        {(!isVideo || canPlayVideo) ? (
          <>
            {url.startsWith('data:image/') ? (
              <img
                src={url}
                alt="Artwork preview"
                className="tw-max-w-full tw-max-h-full tw-object-contain tw-rounded-md tw-shadow-lg"
              />
            ) : url.startsWith('data:video/') ? (
              <video 
                src={url}
                className="tw-max-w-full tw-max-h-full tw-object-contain tw-rounded-md tw-shadow-lg"
                controls
                onError={(e) => {
                  // If we get a runtime error but our checks said it should work,
                  // we might want to update the compatibility state here
                  console.error("Video playback error:", e);
                }}
              />
            ) : (
              <img
                src={url}
                alt="Artwork preview"
                className="tw-max-w-full tw-max-h-full tw-object-contain tw-rounded-md tw-shadow-lg"
              />
            )}
          </>
        ) : (
          // For incompatible videos, use fallback display
          file && <VideoFallbackPreview 
            file={file} 
            errorMessage={videoCompatibility?.errorMessage} 
          />
        )}
      </div>
      
      {/* Control buttons */}
      <div className="tw-absolute tw-top-0 tw-right-0 tw-z-20 tw-p-2 tw-flex tw-gap-2">
        <button
          onClick={onRemove}
          className="tw-p-2 tw-rounded-lg tw-bg-iron-900/80 tw-backdrop-blur hover:tw-bg-iron-800/80 tw-transition-colors tw-duration-200 tw-border-0 tw-shadow-lg"
          aria-label="Remove uploaded file"
          tabIndex={0}
          data-testid="artwork-remove-button"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            aria-hidden="true"
            viewBox="0 0 24 24"
            strokeWidth="1.5"
            stroke="currentColor"
            className="tw-w-5 tw-h-5 tw-text-iron-400"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182m0-4.991v4.99"
            />
          </svg>
        </button>
      </div>
    </motion.div>
  );
};

export default FilePreview;