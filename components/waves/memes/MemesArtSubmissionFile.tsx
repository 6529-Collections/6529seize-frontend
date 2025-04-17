import React, { useCallback, useContext, useEffect, useState } from "react";
import { motion } from "framer-motion";
import { AuthContext } from "../../auth/Auth";

// Import components
import FilePreview from "./file-upload/components/FilePreview";
import UploadArea from "./file-upload/components/UploadArea";
import BrowserWarning from "./file-upload/components/BrowserWarning";

// Import hooks
import useFileUploader from "./file-upload/hooks/useFileUploader";
import useDragAndDrop from "./file-upload/hooks/useDragAndDrop";
import useAccessibility from "./file-upload/hooks/useAccessibility";

// Import types and utils
import type { MemesArtSubmissionFileProps } from "./file-upload/reducers/types";
import { isBrowserSupported } from "./file-upload/utils/browserDetection";
import { FILE_INPUT_ACCEPT } from "./file-upload/utils/constants";

/**
 * Memes Art Submission File Component
 *
 * Handles uploading, previewing, and validating artwork files for meme submissions.
 * Supports images (PNG, JPG) and videos with browser compatibility detection.
 *
 * @param props Component props
 * @returns JSX Element
 */
const MemesArtSubmissionFile: React.FC<MemesArtSubmissionFileProps> = ({
  artworkUploaded,
  artworkUrl,
  setArtworkUploaded,
  handleFileSelect,
}) => {
  // Context
  const { setToast } = useContext(AuthContext);

  // Browser compatibility state
  const [browserSupport, setBrowserSupport] = useState<{
    supported: boolean;
    reason?: string;
  }>({ supported: true });

  // Check for reduced motion preference
  const prefersReducedMotion =
    typeof window !== "undefined"
      ? window.matchMedia("(prefers-reduced-motion: reduce)").matches
      : false;

  // File uploader hook for state management and file processing
  const { state, processFile, handleRetry, handleRemoveFile, dispatch } =
    useFileUploader({
      onFileSelect: handleFileSelect,
      setUploaded: setArtworkUploaded,
      showToast: setToast,
    });

  // Helper to update visual state only
  const setVisualState = useCallback(
    (newState: "idle" | "dragging") => {
      dispatch({ type: "SET_VISUAL_STATE", payload: newState });
    },
    [dispatch]
  );

  // Create a ref for the file input
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  // Area click handler
  const handleAreaClick = useCallback((): void => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  }, []);

  // Drag and drop handlers
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

  // Accessibility handlers
  const { handleKeyDown } = useAccessibility({
    isActive: !artworkUploaded,
    onAreaClick: handleAreaClick,
    prefersReducedMotion,
  });

  // Type-safe input change handler
  const handleFileInputChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>): void => {
      if (e.target.files && e.target.files.length > 0) {
        processFile(e.target.files[0]);

        // Reset the input value to allow selecting the same file again
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
      setToast({
        type: "warning",
        message: support.reason,
      });
    }
  }, [setToast]);

  // Get state from the reducer
  const { visualState, error, objectUrl } = state;

  // Cleanup object URLs when component unmounts or when file changes
  useEffect(() => {
    return () => {
      if (objectUrl) {
        URL.revokeObjectURL(objectUrl);
      }
    };
  }, [objectUrl]);

  return (
    <motion.div
      ref={dropAreaRef}
      whileHover={
        !artworkUploaded && !prefersReducedMotion ? { scale: 1.002 } : undefined
      }
      className={`
        tw-relative tw-w-full tw-h-[400px] 
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
      data-testid="artwork-upload-area"
    >
      {/* Hidden file input with explicit accept attribute */}
      <input
        ref={fileInputRef}
        type="file"
        accept={FILE_INPUT_ACCEPT}
        className="tw-hidden"
        onChange={handleFileInputChange}
        aria-label="Upload artwork file"
        tabIndex={-1}
        data-testid="artwork-file-input"
      />

      {/* Browser compatibility warning overlay */}
      {!browserSupport.supported && browserSupport.reason && (
        <BrowserWarning reason={browserSupport.reason} />
      )}

      {/* Content with error states and loading indicators */}
      {!artworkUploaded ? (
        <UploadArea
          visualState={visualState}
          error={error}
          hasRecoveryOption={state.hasRecoveryOption}
          onRetry={handleRetry}
        />
      ) : (
        <FilePreview
          url={artworkUrl}
          file={state.currentFile}
          onRemove={handleRemoveFile}
          videoCompatibility={state.videoCompatibility}
          isCheckingCompatibility={state.isCheckingCompatibility}
        />

      )}
    </motion.div>
  );
};

// Use React.memo for performance optimization
export default React.memo(MemesArtSubmissionFile, (prevProps, nextProps) => {
  return (
    prevProps.artworkUploaded === nextProps.artworkUploaded &&
    prevProps.artworkUrl === nextProps.artworkUrl
  );
});

