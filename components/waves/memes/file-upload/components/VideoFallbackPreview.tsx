import React from "react";
import type { VideoFallbackPreviewProps } from "../reducers/types";
import {
  getFileExtension,
  formatFileSize,
  getBrowserSpecificMessage,
} from "../utils/formatHelpers";

/**
 * Video Fallback Preview Component
 *
 * Displays a fallback UI for video files that can't be played in the current browser.
 * Shows file information, size, format, and a friendly message about compatibility.
 *
 * @param props Component props
 * @returns JSX Element
 */
const VideoFallbackPreview: React.FC<VideoFallbackPreviewProps> = ({
  file,
  errorMessage,
}) => (
  <div className="tw-flex tw-items-center tw-justify-center tw-w-full tw-h-full">
    <div className="tw-flex tw-flex-col tw-items-center tw-justify-center tw-w-full tw-h-full">
      <div className="tw-mb-4 tw-text-iron-400">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 24 24"
          fill="currentColor"
          className="tw-w-16 tw-h-16"
        >
          <path
            fillRule="evenodd"
            d="M4.5 5.653c0-1.426 1.529-2.33 2.779-1.643l11.54 6.348c1.295.712 1.295 2.573 0 3.285L7.28 19.991c-1.25.687-2.779-.217-2.779-1.643V5.653z"
            clipRule="evenodd"
            className="tw-text-iron-500"
          />
          <circle cx="19" cy="12" r="2" className="tw-fill-amber-500" />
        </svg>
      </div>

      <h3
        className="tw-text-iron-100 tw-text-lg tw-font-medium tw-mb-2 tw-truncate tw-max-w-xs"
        title={file.name}
      >
        {file.name}
      </h3>

      <div className="tw-flex tw-gap-2 tw-mb-3">
        <span className="tw-text-xs tw-font-mono tw-bg-iron-800 tw-px-2 tw-py-1 tw-rounded">
          {getFileExtension(file)}
        </span>
        <span className="tw-text-xs tw-bg-iron-800 tw-px-2 tw-py-1 tw-rounded">
          {formatFileSize(file.size)}
        </span>
      </div>

      <div className="tw-text-center tw-text-iron-400 tw-text-sm tw-px-4 tw-mt-4">
        <p className="tw-mb-2">
          {errorMessage ?? getBrowserSpecificMessage(file)}
        </p>
        <p className="tw-text-amber-400 tw-text-xs tw-mt-1">
          Your file will still be uploaded successfully.
        </p>
      </div>
    </div>
  </div>
);

export default VideoFallbackPreview;
