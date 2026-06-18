import React from "react";
import { motion } from "framer-motion";
import dynamic from "next/dynamic";
import type { FilePreviewProps } from "../reducers/types";
import VideoFallbackPreview from "./VideoFallbackPreview";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faArrowsRotate, faCube } from "@fortawesome/free-solid-svg-icons";
import SeizeVideoPlayer from "@/components/drops/view/item/content/media/SeizeVideoPlayer";

// Dynamically import GLB viewer to avoid SSR issues
const MediaDisplayGLB = dynamic(
  () => import("../../../../drops/view/item/content/media/MediaDisplayGLB"),
  {
    ssr: false,
    loading: () => (
      <div className="tw-flex tw-h-full tw-items-center tw-justify-center tw-text-iron-400">
        <div className="tw-flex tw-flex-col tw-items-center tw-gap-3">
          <FontAwesomeIcon
            icon={faCube}
            className="tw-h-8 tw-w-8 tw-flex-shrink-0"
          />
          <span>Loading 3D model...</span>
        </div>
      </div>
    ),
  }
);

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
  mimeType,
  onRemove,
  videoCompatibility,
  isCheckingCompatibility,
}) => {
  const effectiveMimeType = file?.type ?? mimeType ?? "";

  // Determine file type
  const isVideo =
    effectiveMimeType.startsWith("video/") || url.startsWith("data:video/");

  const isGLB =
    effectiveMimeType === "model/gltf-binary" ||
    effectiveMimeType === "model/gltf+json" ||
    file?.name.toLowerCase().endsWith(".glb") ||
    file?.name.toLowerCase().endsWith(".gltf");
  const isHtml = effectiveMimeType === "text/html";

  // Check if video is compatible for playback
  const canPlayVideo = !isVideo || (videoCompatibility?.canPlay ?? true);

  const renderImagePreview = () => (
    <img
      src={url}
      alt="Artwork preview"
      className="tw-absolute tw-max-h-full tw-max-w-full tw-object-contain tw-shadow-lg"
    />
  );

  const renderVideoPreview = () => (
    <SeizeVideoPlayer
      src={url}
      template="watch-media"
      className="tw-max-h-full tw-max-w-full tw-shadow-lg"
      preload="metadata"
      layout="prominent"
      align="center"
      showActions={false}
      onError={(e) => {
        console.error("Video playback error:", e);
      }}
    />
  );

  const renderHtmlPreview = () => (
    <div className="tw-flex tw-h-full tw-w-full tw-flex-col tw-items-center tw-justify-center tw-p-6 tw-text-center">
      <span className="tw-mb-2 tw-text-sm tw-font-semibold tw-text-iron-200">
        Interactive artwork ready
      </span>
      <span className="tw-max-w-sm tw-text-xs tw-font-medium tw-text-iron-500">
        The existing interactive media will be reused unless you change it.
      </span>
    </div>
  );

  const renderStandardPreview = () => {
    if (isHtml) {
      return renderHtmlPreview();
    }
    if (url.startsWith("data:image/")) {
      return renderImagePreview();
    }
    if (isVideo) {
      return renderVideoPreview();
    }
    return renderImagePreview();
  };

  const renderMediaContent = () => {
    if (isGLB) {
      return (
        <div className="tw-h-full tw-min-h-[300px] tw-w-full">
          <MediaDisplayGLB src={url} />
        </div>
      );
    }

    const shouldShowStandardPreview = !isVideo || canPlayVideo;
    if (shouldShowStandardPreview) {
      return <>{renderStandardPreview()}</>;
    }

    if (file) {
      return (
        <VideoFallbackPreview
          file={file}
          errorMessage={videoCompatibility?.errorMessage}
        />
      );
    }

    return null;
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="tw-relative tw-flex tw-h-full tw-w-full tw-items-center tw-justify-center tw-bg-iron-900"
    >
      {/* Container with checkerboard pattern for transparent media */}
      <div className="tw-absolute tw-inset-0 tw-opacity-5">
        <div className="tw-grid tw-h-full tw-grid-cols-8">
          {Array(64)
            .fill(0)
            .map((_, i) => (
              <div
                key={i}
                className={`tw-border-[0.5px] ${
                  i % 2 === 0 ? "tw-bg-iron-400/10" : "tw-bg-iron-600/10"
                }`}
              />
            ))}
        </div>
      </div>

      {/* Show compatibility checking indicator */}
      {isCheckingCompatibility && isVideo && (
        <div className="tw-absolute tw-inset-0 tw-z-10 tw-flex tw-items-center tw-justify-center tw-bg-iron-950/70">
          <div className="tw-flex tw-flex-col tw-items-center tw-gap-3">
            <div className="tw-h-10 tw-w-10 tw-animate-spin tw-rounded-full tw-border-b-2 tw-border-t-2 tw-border-primary-500" />
            <span className="tw-text-iron-300">
              Checking video compatibility...
            </span>
          </div>
        </div>
      )}

      {/* Media container with proper padding and centering */}
      <div className="tw-relative tw-flex tw-h-full tw-w-full tw-items-center tw-justify-center tw-overflow-hidden tw-p-4">
        {renderMediaContent()}
      </div>

      {/* Control buttons */}
      <div className="tw-absolute tw-right-3 tw-top-3 tw-z-30 tw-flex tw-gap-2">
        <button
          onClick={onRemove}
          className="tw-flex tw-items-center tw-justify-center tw-gap-x-2 tw-rounded-lg tw-border tw-border-solid tw-border-iron-800 tw-bg-iron-800 tw-px-2.5 tw-py-1.5 tw-text-xs tw-font-semibold tw-text-iron-300 tw-shadow-sm tw-ring-1 tw-ring-iron-700 tw-transition tw-duration-300 tw-ease-out hover:tw-border-iron-700 hover:tw-bg-iron-700 hover:tw-ring-iron-650 focus-visible:tw-outline focus-visible:tw-outline-2 focus-visible:tw-outline-offset-2 focus-visible:tw-outline-iron-700"
          aria-label="Change uploaded file"
          tabIndex={0}
          data-testid="artwork-replace-button"
        >
          <FontAwesomeIcon
            icon={faArrowsRotate}
            className="tw-h-3.5 tw-w-3.5 tw-flex-shrink-0"
          />
          Change
        </button>
      </div>
    </motion.div>
  );
};

export default FilePreview;
