"use client";

import React, {
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";
import { motion } from "framer-motion";
import { AuthContext } from "@/components/auth/Auth";

import FilePreview from "./file-upload/components/FilePreview";
import UploadArea from "./file-upload/components/UploadArea";
import BrowserWarning from "./file-upload/components/BrowserWarning";

import useFileUploader from "./file-upload/hooks/useFileUploader";
import useDragAndDrop from "./file-upload/hooks/useDragAndDrop";
import useAccessibility from "./file-upload/hooks/useAccessibility";

import type { MemesArtSubmissionFileProps } from "./file-upload/reducers/types";
import { isBrowserSupported } from "./file-upload/utils/browserDetection";
import { FILE_INPUT_ACCEPT } from "./file-upload/utils/constants";

/**
 * Memes Art Submission File Component
 *
 * Handles uploading, previewing, and validating artwork files for meme submissions.
 * Supports images (PNG, JPG) and videos with browser compatibility detection.
 *
 * This version uses Blob URLs (createObjectURL) to preview any newly selected file,
 * which satisfies a CSP requiring 'blob:' rather than 'data:' for media.
 */
const MemesArtSubmissionFile: React.FC<MemesArtSubmissionFileProps> = ({
  artworkUploaded,
  artworkUrl,
  setArtworkUploaded,
  handleFileSelect,
}) => {
  const { setToast } = useContext(AuthContext);

  // Check for browser support
  const [browserSupport, setBrowserSupport] = useState<{
    supported: boolean;
    reason?: string;
  }>({ supported: true });

  // Reduced-motion preference
  const prefersReducedMotion =
    typeof window !== "undefined"
      ? window.matchMedia("(prefers-reduced-motion: reduce)").matches
      : false;

  // File uploader hook (manages local state, objectUrl, etc.)
  const { state, processFile, handleRetry, handleRemoveFile, dispatch } =
    useFileUploader({
      onFileSelect: handleFileSelect,
      setUploaded: setArtworkUploaded,
      showToast: setToast,
    });

  // For drag & drop highlighting
  const setVisualState = useCallback(
    (newState: "idle" | "dragging") => {
      dispatch({ type: "SET_VISUAL_STATE", payload: newState });
    },
    [dispatch]
  );

  // Refs, event handlers
  const fileInputRef = useRef<HTMLInputElement>(null);
  const handleAreaClick = useCallback(() => {
    fileInputRef.current?.click();
  }, []);

  const {
    dropAreaRef,
    handleDragEnter,
    handleDragOver,
    handleDragLeave,
    handleDrop,
  } = useDragAndDrop({
    enabled: !artworkUploaded,
    onFileDrop: processFile,
    setVisualState,
  });

  const { handleKeyDown } = useAccessibility({
    isActive: !artworkUploaded,
    onAreaClick: handleAreaClick,
    prefersReducedMotion,
  });

  const handleFileInputChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) {
        processFile(file);
        e.target.value = "";
      }
    },
    [processFile]
  );

  // Check browser compatibility on mount
  useEffect(() => {
    const support = isBrowserSupported();
    setBrowserSupport(support);
    if (!support.supported && support.reason) {
      setToast({ type: "warning", message: support.reason });
    }
  }, [setToast]);

  // Destructure from our uploader state
  const {
    visualState,
    error,
    currentFile,
    objectUrl, // may or may not be used
    videoCompatibility,
    isCheckingCompatibility,
  } = state;

  /**
   * The final URL we actually pass to <FilePreview>.
   * If there's a new file, we create a blob URL. Otherwise we use
   * the existing objectUrl from state or the server-provided artworkUrl.
   */
  const [previewUrl, setPreviewUrl] = useState<string>(artworkUrl);

  useEffect(() => {
    // If we have a newly selected file, create a blob: URL from it:
    if (currentFile) {
      const blobUrl = URL.createObjectURL(currentFile);
      setPreviewUrl(blobUrl);

      // Cleanup the new blob: URL on unmount or when file changes
      return () => {
        URL.revokeObjectURL(blobUrl);
      };
    }
    // Otherwise fallback to:
    // - existing objectUrl (if your useFileUploader logic set it)
    // - or the original "artworkUrl" prop from the server
    setPreviewUrl(objectUrl ?? artworkUrl);
  }, [currentFile, objectUrl, artworkUrl]);

  return (
    <motion.div
      ref={dropAreaRef}
      whileHover={
        !artworkUploaded && !prefersReducedMotion ? { scale: 1.002 } : undefined
      }
      className={`
        tw-relative tw-w-full tw-h-full
        tw-bg-gradient-to-br tw-from-iron-900 tw-to-iron-950
        tw-rounded-xl tw-overflow-hidden tw-group
        ${
          visualState === "dragging"
            ? "tw-border-2 tw-border-primary-500/60"
            : ""
        }
        ${visualState === "invalid" ? "tw-border-2 tw-border-red/60" : ""}
        ${
          visualState === "idle" && !artworkUploaded
            ? "hover:tw-border hover:tw-border-iron-700/80"
            : ""
        }
        tw-transition-all tw-duration-300
        ${artworkUploaded ? "" : "tw-cursor-pointer"}
      `}
      onDragEnter={handleDragEnter}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      onClick={!artworkUploaded ? handleAreaClick : undefined}
      role={artworkUploaded ? undefined : "button"}
      tabIndex={artworkUploaded ? -1 : 0}
      aria-label="Upload artwork"
      onKeyDown={handleKeyDown}
      aria-describedby={error ? "file-upload-error" : undefined}
      data-testid="artwork-upload-area">
      {/* Hidden <input> for selecting the file */}
      <input
        ref={fileInputRef}
        type="file"
        accept={FILE_INPUT_ACCEPT}
        className="tw-hidden"
        onChange={handleFileInputChange}
        data-testid="artwork-file-input"
      />

      {/* Show a warning overlay if the user's browser lacks necessary features */}
      {!browserSupport.supported && browserSupport.reason && (
        <BrowserWarning reason={browserSupport.reason} />
      )}

      {/* If not uploaded yet, show the upload area UI, else show the preview */}
      {!artworkUploaded ? (
        <UploadArea
          visualState={visualState}
          error={error}
          hasRecoveryOption={state.hasRecoveryOption}
          onRetry={handleRetry}
        />
      ) : (
        <FilePreview
          url={previewUrl}
          file={currentFile}
          onRemove={handleRemoveFile}
          videoCompatibility={videoCompatibility}
          isCheckingCompatibility={isCheckingCompatibility}
        />
      )}
    </motion.div>
  );
};

export default React.memo(
  MemesArtSubmissionFile,
  (prev, next) =>
    prev.artworkUploaded === next.artworkUploaded &&
    prev.artworkUrl === next.artworkUrl
);
