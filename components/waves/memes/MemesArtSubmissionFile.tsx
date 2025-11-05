"use client";

import React, {
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { motion } from "framer-motion";
import { AuthContext } from "@/components/auth/Auth";
import { TabToggle } from "@/components/common/TabToggle";
import SandboxedExternalIframe from "@/components/common/SandboxedExternalIframe";

import FilePreview from "./file-upload/components/FilePreview";
import UploadArea from "./file-upload/components/UploadArea";
import BrowserWarning from "./file-upload/components/BrowserWarning";

import useFileUploader from "./file-upload/hooks/useFileUploader";
import useDragAndDrop from "./file-upload/hooks/useDragAndDrop";
import useAccessibility from "./file-upload/hooks/useAccessibility";

import type { MemesArtSubmissionFileProps } from "./file-upload/reducers/types";
import { isBrowserSupported } from "./file-upload/utils/browserDetection";
import { FILE_INPUT_ACCEPT } from "./file-upload/utils/constants";
import {
  ALLOWED_INTERACTIVE_MEDIA_MIME_TYPES,
  DEFAULT_INTERACTIVE_MEDIA_MIME_TYPE,
  INTERACTIVE_MEDIA_PROVIDERS,
} from "./submission/constants/media";

const renderPreviewMessage = (primary: string, secondary: string) => (
  <div className="tw-h-full tw-flex tw-flex-col tw-items-center tw-justify-center tw-gap-3 tw-text-center tw-text-sm tw-text-iron-400 tw-px-4">
    <span>{primary}</span>
    <span className="tw-text-iron-500">{secondary}</span>
  </div>
);

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
  mediaSource,
  setMediaSource,
  externalHash,
  externalProvider,
  externalConstructedUrl,
  externalPreviewUrl,
  externalMimeType,
  externalError,
  externalValidationStatus,
  isExternalMediaValid,
  onExternalHashChange,
  onExternalProviderChange,
  onExternalMimeTypeChange,
  onClearExternalMedia,
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
    if (mediaSource !== "upload") {
      return;
    }
    fileInputRef.current?.click();
  }, [mediaSource]);

  const {
    dropAreaRef,
    handleDragEnter,
    handleDragOver,
    handleDragLeave,
    handleDrop,
  } = useDragAndDrop({
    enabled: mediaSource === "upload" && !artworkUploaded,
    onFileDrop: processFile,
    setVisualState,
  });

  const { handleKeyDown } = useAccessibility({
    isActive: mediaSource === "upload" && !artworkUploaded,
    onAreaClick: handleAreaClick,
    prefersReducedMotion,
  });

  const handleFileInputChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) {
        if (mediaSource === "upload") {
          processFile(file);
        }
        e.target.value = "";
      }
    },
    [processFile, mediaSource]
  );

  const tabOptions = [
    {
      key: "upload",
      label: "Upload File",
      panelId: "memes-art-submission-upload-panel",
    },
    {
      key: "url",
      label: "Interactive HTML",
      panelId: "memes-art-submission-interactive-panel",
    },
  ] as const;

  const handleTabSelect = useCallback(
    (key: string) => {
      if (key === "upload") {
        setMediaSource("upload");
        return;
      }

      if (key === "url") {
        onExternalMimeTypeChange(DEFAULT_INTERACTIVE_MEDIA_MIME_TYPE);
        setMediaSource("url");
      }
    },
    [setMediaSource, onExternalMimeTypeChange],
  );

  const providerOptions = useMemo(
    () =>
      INTERACTIVE_MEDIA_PROVIDERS.map((provider) => ({
        key: provider.key,
        label: provider.label,
        panelId: `memes-art-submission-provider-${provider.key}`,
      })),
    [],
  );

  const handleProviderSelect = useCallback(
    (key: string) => {
      if (key === externalProvider) {
        return;
      }

      if (key === "ipfs" || key === "arweave") {
        onExternalProviderChange(key);
      }
    },
    [externalProvider, onExternalProviderChange],
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

  const showUploadUi = mediaSource === "upload";

  const previewFallback = useMemo(() => {
    if (externalValidationStatus === "pending") {
      return renderPreviewMessage(
        "Validating preview...",
        "We're verifying the gateway serves an HTML document.",
      );
    }

    if (externalValidationStatus === "invalid" && externalError) {
      return renderPreviewMessage(
        externalError,
        "Only ipfs.io or arweave.net HTML documents can be embedded.",
      );
    }

    return renderPreviewMessage(
      "Provide a valid hash or CID to enable the preview.",
      "The final artwork is rendered securely inside a sandboxed iframe.",
    );
  }, [externalValidationStatus, externalError]);

  const mediaTypeLabel = useMemo(() => {
    const match = ALLOWED_INTERACTIVE_MEDIA_MIME_TYPES.find(
      (type) => type.value === externalMimeType,
    );
    return match?.label ?? externalMimeType;
  }, [externalMimeType]);

  return (
    <div className="tw-flex tw-flex-col tw-gap-4 tw-h-full">
      <div className="tw-bg-iron-950 tw-border tw-border-iron-800 tw-rounded-lg tw-p-1 tw-w-full tw-max-w-md">
        <TabToggle
          options={tabOptions}
          activeKey={mediaSource}
          onSelect={handleTabSelect}
          fullWidth
        />
      </div>

      {showUploadUi ? (
        <motion.div
          id="memes-art-submission-upload-panel"
          ref={dropAreaRef}
          whileHover={
            !artworkUploaded && !prefersReducedMotion
              ? { scale: 1.002 }
              : undefined
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
          <input
            ref={fileInputRef}
            type="file"
            accept={FILE_INPUT_ACCEPT}
            className="tw-hidden"
            onChange={handleFileInputChange}
            data-testid="artwork-file-input"
          />

          {!browserSupport.supported && browserSupport.reason && (
            <BrowserWarning reason={browserSupport.reason} />
          )}

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
      ) : (
        <div
          id="memes-art-submission-interactive-panel"
          className={`
            tw-flex tw-flex-col tw-gap-4 tw-flex-1
            tw-bg-gradient-to-br tw-from-iron-900 tw-to-iron-950
            tw-rounded-xl tw-border tw-border-iron-800 tw-p-4
          `}>
          <div className="tw-flex tw-flex-col tw-gap-2">
            <span className="tw-text-sm tw-font-medium tw-text-iron-200">
              Hosting Network
            </span>
            <div className="tw-inline-flex tw-bg-iron-900 tw-border tw-border-iron-800 tw-rounded-lg tw-p-1">
              <TabToggle
                options={providerOptions}
                activeKey={externalProvider}
                onSelect={handleProviderSelect}
              />
            </div>
          </div>

          <div className="tw-flex tw-flex-col tw-gap-2">
            <label
              htmlFor="memes-interactive-media-hash"
              className="tw-text-sm tw-font-medium tw-text-iron-200">
              Content Hash or Path
            </label>
            <input
              id="memes-interactive-media-hash"
              type="text"
              autoComplete="off"
              className="tw-w-full tw-rounded-lg tw-border tw-border-iron-700 tw-bg-iron-900 tw-px-3 tw-py-2 tw-text-sm tw-text-iron-100 focus:tw-outline-none focus:tw-ring-2 focus:tw-ring-primary-600"
              placeholder="bafy.../index.html"
              value={externalHash}
              onChange={(event) => onExternalHashChange(event.target.value)}
              aria-invalid={Boolean(externalError)}
            />
            {externalError && (
              <p className="tw-text-xs tw-text-red-400">{externalError}</p>
            )}
            {externalConstructedUrl && !externalError && (
              <p className="tw-text-xs tw-text-iron-400">
                Resulting URL{" "}
                <span className="tw-text-iron-100">{externalConstructedUrl}</span>
              </p>
            )}
          </div>

          <div className="tw-flex tw-flex-col tw-gap-2">
            <span className="tw-text-sm tw-font-medium tw-text-iron-200">
              Media Type
            </span>
            <div className="tw-w-full tw-rounded-lg tw-border tw-border-iron-700 tw-bg-iron-900 tw-px-3 tw-py-2 tw-text-sm tw-text-iron-200 tw-flex tw-items-center tw-justify-between">
              <span>{mediaTypeLabel}</span>
              <span className="tw-text-xs tw-text-iron-500">
                Fixed to interactive HTML (text/html)
              </span>
            </div>
          </div>

          <div className="tw-flex tw-items-center">
            <button
              type="button"
              onClick={onClearExternalMedia}
              className="tw-text-xs tw-font-medium tw-text-iron-200 tw-rounded-md tw-border tw-border-iron-700 tw-bg-iron-900 tw-px-3 tw-py-1.5 hover:tw-bg-iron-800 tw-transition disabled:tw-opacity-40 disabled:tw-cursor-not-allowed"
              disabled={!externalHash}>
              Clear Hash
            </button>
          </div>

          <div className="tw-flex-1 tw-rounded-lg tw-border tw-border-iron-800 tw-bg-iron-950 tw-overflow-hidden tw-flex tw-flex-col tw-min-h-[360px]">
            {isExternalMediaValid ? (
              <SandboxedExternalIframe
                key={externalPreviewUrl}
                src={externalPreviewUrl}
                title="Interactive artwork preview"
                className="tw-bg-transparent"
                containerClassName="tw-flex-1 tw-flex tw-flex-col"
                fallback={renderPreviewMessage(
                  "Preview unavailable for unapproved domains or file types.",
                  "Only ipfs.io or arweave.net HTML documents can be embedded.",
                )}
              />
            ) : (
              <div className="tw-flex-1 tw-flex tw-flex-col">{previewFallback}</div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default React.memo(MemesArtSubmissionFile);
