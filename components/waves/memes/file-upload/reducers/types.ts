import type {
  InteractiveMediaMimeType,
  InteractiveMediaProvider,
} from "../../submission/constants/media";

/**
 * Type definitions for the file upload system
 * 
 * This file contains all types and interfaces used throughout the file upload components.
 */

/**
 * Result of file validation check
 */
export interface FileValidationResult {
  valid: boolean;
  error?: string;
}

/**
 * Visual state for the upload area
 */
type VisualState = 'idle' | 'dragging' | 'invalid' | 'processing';

/**
 * Main state interface for the file uploader reducer
 */
export interface FileUploaderState {
  /** Current visual state of the uploader */
  visualState: VisualState;
  /** Error message if any */
  error: string | null;
  /** Object URL for the uploaded file */
  objectUrl: string | null;
  /** Number of processing attempts made */
  processingAttempts: number;
  /** File being processed */
  processingFile: File | null;
  /** Timeout ID for processing */
  processingTimeout: number | null;
  /** Whether recovery option is available */
  hasRecoveryOption: boolean;
  
  /** Currently uploaded file */
  currentFile: File | null;
  /** Video compatibility check result */
  videoCompatibility: VideoCompatibilityResult | null;
  /** Whether compatibility check is in progress */
  isCheckingCompatibility: boolean;
}

/**
 * Actions for the file uploader reducer
 */
export type FileUploaderAction =
  | { type: 'SET_VISUAL_STATE'; payload: VisualState }
  | { type: 'SET_ERROR'; payload: string | null }
  | { type: 'SET_OBJECT_URL'; payload: string | null }
  | { type: 'RESET_STATE' }
  | { type: 'START_PROCESSING'; payload: File }
  | { type: 'PROCESSING_SUCCESS'; payload: { objectUrl: string; file: File } }
  | { type: 'PROCESSING_ERROR'; payload: string }
  | { type: 'PROCESSING_RETRY' }
  | { type: 'PROCESSING_TIMEOUT' }
  | { type: 'START_COMPATIBILITY_CHECK'; payload: File }
  | { type: 'SET_COMPATIBILITY_RESULT'; payload: VideoCompatibilityResult };

/**
 * Props for the MemesArtSubmissionFile component
 */
export interface MemesArtSubmissionFileProps {
  /** Whether artwork has been uploaded */
  readonly artworkUploaded: boolean;
  /** URL of the uploaded artwork */
  readonly artworkUrl: string;
  /** Callback to update artwork upload state */
  readonly setArtworkUploaded: (uploaded: boolean) => void;
  /** Callback for handling file selection */
  readonly handleFileSelect: (file: File) => void;
  /** Current media source mode */
  readonly mediaSource: "upload" | "url";
  /** Update media source mode */
  readonly setMediaSource: (mode: "upload" | "url") => void;
  /** Raw hash or CID when using hosted interactive content */
  readonly externalHash: string;
  /** Selected decentralized hosting provider */
  readonly externalProvider: InteractiveMediaProvider;
  /** Fully constructed URL from the hash */
  readonly externalConstructedUrl: string;
  /** URL used for previewing inside the modal */
  readonly externalPreviewUrl: string;
  /** External media MIME type */
  readonly externalMimeType: InteractiveMediaMimeType;
  /** Validation error for external media */
  readonly externalError: string | null;
  /** Current validation status for external media */
  readonly externalValidationStatus: "idle" | "pending" | "valid" | "invalid";
  /** Whether external media input is valid */
  readonly isExternalMediaValid: boolean;
  /** Handler for changing the interactive hash input */
  readonly onExternalHashChange: (value: string) => void;
  /** Handler for changing the hosting provider */
  readonly onExternalProviderChange: (
    value: InteractiveMediaProvider
  ) => void;
  /** Handler for changing the external media MIME type */
  readonly onExternalMimeTypeChange: (
    value: InteractiveMediaMimeType
  ) => void;
  /** Reset external media selection */
  readonly onClearExternalMedia: () => void;
}

/**
 * Result of video compatibility testing
 */
export interface VideoCompatibilityResult {
  /** Whether the video can be played */
  canPlay: boolean;
  /** Whether testing was completed */
  tested: boolean;
  /** User-friendly error message if not compatible */
  errorMessage?: string;
  /** Technical reason for debugging */
  technicalReason?: string;
  /** Detected codec information if available */
  codecInfo?: string;
  /** Whether the video can be streamed */
  isStreamable?: boolean;
}

/**
 * Props for the browser compatibility warning component
 */
export interface BrowserWarningProps {
  /** Reason for compatibility issue */
  readonly reason: string;
}

/**
 * Props for the video fallback preview component
 */
export interface VideoFallbackPreviewProps {
  /** File that couldn't be previewed */
  readonly file: File;
  /** Optional error message */
  readonly errorMessage?: string;
}

/**
 * Props for the file preview component
 */
export interface FilePreviewProps {
  /** URL of the file to preview */
  readonly url: string;
  /** File object */
  readonly file: File | null;
  /** Handler for removing the file */
  readonly onRemove: (e: React.MouseEvent<HTMLButtonElement>) => void;
  /** Video compatibility information */
  readonly videoCompatibility: VideoCompatibilityResult | null;
  /** Whether compatibility check is in progress */
  readonly isCheckingCompatibility: boolean;
}

/**
 * Props for the upload area component
 */
export interface UploadAreaProps {
  /** Current visual state */
  readonly visualState: VisualState;
  /** Error message if any */
  readonly error: string | null;
  /** Whether recovery option is available */
  readonly hasRecoveryOption: boolean;
  /** Handler for retry action */
  readonly onRetry: (e: React.MouseEvent) => void;
}

/**
 * Props for the error message component
 */
export interface ErrorMessageProps {
  /** Error message to display */
  readonly error: string;
  /** Whether to show retry option */
  readonly showRetry: boolean;
  /** Handler for retry action */
  readonly onRetry: (e: React.MouseEvent) => void;
}
