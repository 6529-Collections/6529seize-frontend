/**
 * File Upload System
 * 
 * A comprehensive system for handling file uploads with robust validation,
 * error handling, and compatibility checking for various media types.
 */

// Components
export { default as ErrorMessage } from './components/ErrorMessage';
export { default as VideoFallbackPreview } from './components/VideoFallbackPreview';
export { default as BrowserWarning } from './components/BrowserWarning';
export { default as FileTypeIndicator } from './components/FileTypeIndicator';
export { default as FilePreview } from './components/FilePreview';
export { default as UploadArea } from './components/UploadArea';

// Hooks
export { default as useFileUploader } from './hooks/useFileUploader';
export { default as useDragAndDrop } from './hooks/useDragAndDrop';
export { default as useAccessibility } from './hooks/useAccessibility';

// Utils
export { testVideoCompatibility, validateFile } from './utils/fileValidation';
export { detectBrowser, isBrowserSupported } from './utils/browserDetection';
export { 
  getFileExtension, 
  formatFileSize, 
  getBrowserSpecificMessage 
} from './utils/formatHelpers';

// Constants
export {
  ACCEPTED_FORMATS,
  UI_FORMAT_CATEGORIES,
  FILE_SIZE_LIMIT,
  FILE_INPUT_ACCEPT,
  MAX_PROCESSING_ATTEMPTS,
  PROCESSING_TIMEOUT_MS,
  COMPATIBILITY_CHECK_TIMEOUT_MS
} from './utils/constants';

// Types
export type {
  FileValidationResult,
  VisualState,
  FileUploaderState,
  FileUploaderAction,
  MemesArtSubmissionFileProps,
  VideoCompatibilityResult,
  BrowserWarningProps,
  VideoFallbackPreviewProps,
  FilePreviewProps,
  UploadAreaProps,
  ErrorMessageProps
} from './reducers/types';