import React, { useCallback, useContext, useEffect, useReducer, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { AuthContext } from '../../auth/Auth';


// Define interfaces and types
interface FileValidationResult {
  valid: boolean;
  error?: string;
}

interface MemesArtSubmissionFileProps {
  readonly artworkUploaded: boolean;
  readonly artworkUrl: string;
  readonly setArtworkUploaded: (uploaded: boolean) => void;
  readonly handleFileSelect: (file: File) => void;
}

// Visual state type
type VisualState = 'idle' | 'dragging' | 'invalid' | 'processing';

// State interface for the reducer
interface FileUploaderState {
  visualState: VisualState;
  error: string | null;
  objectUrl: string | null;
  processingAttempts: number;
  processingFile: File | null;
  processingTimeout: number | null;
  hasRecoveryOption: boolean;
}

// Action types for the reducer
type FileUploaderAction =
  | { type: 'SET_VISUAL_STATE'; payload: VisualState }
  | { type: 'SET_ERROR'; payload: string | null }
  | { type: 'SET_OBJECT_URL'; payload: string | null }
  | { type: 'RESET_STATE' }
  | { type: 'START_PROCESSING'; payload: File }
  | { type: 'PROCESSING_SUCCESS'; payload: string }
  | { type: 'PROCESSING_ERROR'; payload: string }
  | { type: 'PROCESSING_RETRY' }
  | { type: 'PROCESSING_TIMEOUT' };

// File validation constants and file type components

// File type constants
const ACCEPTED_FORMATS: readonly string[] = [
  'image/png',
  'image/jpeg', 
  'image/jpg',
  'video/mp4',
  'video/webm',
  'video/ogg',
  'video/quicktime'
] as const;

// Simplified format categories for UI display
const UI_FORMAT_CATEGORIES = ['PNG', 'JPG', 'VIDEO'];

// Create extensions list from formats for validation messages
const ACCEPTED_EXTENSIONS: readonly string[] = 
  ACCEPTED_FORMATS.map(format => {
    const parts = format.split('/');
    return parts[1].toUpperCase();
  });
  
const FILE_SIZE_LIMIT: number = 10 * 1024 * 1024; // 10MB

// Create accept string for file input including all video formats
const FILE_INPUT_ACCEPT: string = 'image/png,image/jpeg,image/jpg,video/*';

// File Type Indicator Component for reuse
interface FileTypeIndicatorProps {
  readonly format: string;
}

const FileTypeIndicator: React.FC<FileTypeIndicatorProps> = ({ format }) => (
  <span 
    className="tw-px-3 tw-py-1.5 tw-rounded-full tw-bg-iron-900/50 tw-backdrop-blur tw-border tw-border-iron-800/50"
  >
    {format}
  </span>
);

// Error message component with retry option
interface ErrorMessageProps {
  readonly error: string;
  readonly showRetry: boolean;
  readonly onRetry: (e: React.MouseEvent) => void;
}

const ErrorMessage: React.FC<ErrorMessageProps> = ({ 
  error, 
  showRetry, 
  onRetry 
}) => (
  <motion.div 
    id="file-upload-error"
    initial={{ opacity: 0, y: 10 }}
    animate={{ opacity: 1, y: 0 }}
    className="tw-absolute tw-bottom-14 tw-px-4 tw-py-2 tw-bg-red/10 tw-border tw-border-red/30 tw-rounded-lg tw-text-red tw-text-sm"
    role="alert"
    aria-live="assertive"
  >
    <div className="tw-flex tw-flex-col tw-gap-2">
      <span>{error}</span>
      {showRetry && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            onRetry(e);
          }}
          className="tw-px-3 tw-py-1 tw-bg-primary-500/20 tw-text-primary-300 tw-text-xs tw-rounded-md hover:tw-bg-primary-500/30 tw-transition-colors tw-duration-200"
          type="button"
        >
          Try Again
        </button>
      )}
    </div>
  </motion.div>
);

// Upload area component
interface UploadAreaProps {
  readonly visualState: VisualState;
  readonly error: string | null;
  readonly hasRecoveryOption: boolean;
  readonly onRetry: (e: React.MouseEvent) => void;
}

const UploadArea: React.FC<UploadAreaProps> = ({
  visualState,
  error,
  hasRecoveryOption,
  onRetry
}) => (
  <div className="tw-absolute tw-inset-0 tw-flex tw-flex-col tw-items-center tw-justify-center tw-p-6">
    {/* Subtle animated dashed border around entire area */}
    <div className="tw-absolute tw-inset-[10px] tw-border-2 tw-border-dashed tw-border-iron-700/40 group-hover:tw-border-primary-500/30 tw-rounded-lg tw-transition-all tw-duration-300" />
    <div className="tw-absolute tw-inset-[10px] tw-border tw-border-dashed tw-border-iron-600/20 group-hover:tw-border-iron-500/30 tw-rounded-lg tw-animate-pulse tw-transition-all tw-duration-300" />

    {/* Pattern background suggesting droppable area */}
    <div className="tw-absolute tw-inset-0 tw-pointer-events-none tw-opacity-5">
      <div className="tw-grid tw-grid-cols-8 tw-h-full">
        {Array(32)
          .fill(0)
          .map((_, i) => (
            <div
              key={i}
              className="tw-border-[0.5px] tw-border-iron-400/40"
            />
          ))}
      </div>
    </div>

    {/* Abstract art-themed upload indicator */}
    <div className="tw-relative tw-mb-2">
      <div className="tw-w-32 tw-h-32 tw-relative">
        <div className="tw-absolute tw-inset-0 tw-bg-gradient-to-tr tw-from-primary-500/20 tw-to-transparent tw-rounded-full tw-animate-pulse" />
        <div
          className="tw-absolute tw-inset-0 tw-border-2 tw-border-dashed tw-border-iron-700 tw-rounded-full tw-animate-spin"
          style={{ animationDuration: "10s" }}
        />
        <div className="tw-absolute tw-inset-4 tw-border tw-border-iron-600 tw-rounded-full" />
        <div className="tw-absolute tw-inset-0 tw-flex tw-items-center tw-justify-center">
          <span className="tw-text-iron-400 tw-text-sm tw-font-medium group-hover:tw-text-primary-300 tw-transition-colors tw-duration-300">
            Select Art
          </span>
        </div>
      </div>
    </div>

    {/* Drag and drop text hint */}
    <div className="tw-flex tw-items-center tw-justify-center tw-mb-8 tw-transition-all tw-duration-300">
      <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 24 24"
        fill="currentColor"
        className="tw-w-4 tw-h-4 tw-mr-1.5 tw-text-iron-500 group-hover:tw-text-primary-400 tw-transition-colors tw-duration-300"
        aria-hidden="true"
      >
        <path
          fillRule="evenodd"
          d="M2.25 12c0-5.385 4.365-9.75 9.75-9.75s9.75 4.365 9.75 9.75-4.365 9.75-9.75 9.75S2.25 17.385 2.25 12zm13.36-1.814a.75.75 0 10-1.22-.872l-3.236 4.53L9.53 12.22a.75.75 0 00-1.06 1.06l2.25 2.25a.75.75 0 001.14-.094l3.75-5.25z"
          clipRule="evenodd"
        />
      </svg>
      <span className="tw-text-iron-500 tw-text-xs group-hover:tw-text-iron-300 tw-transition-colors tw-duration-300">
        Drag and drop file here
      </span>
    </div>

    {/* File type indicators */}
    <div className="tw-absolute tw-bottom-6 tw-left-6 tw-right-6">
      <div className="tw-flex tw-justify-center tw-gap-3 tw-text-xs tw-text-iron-500">
        {UI_FORMAT_CATEGORIES.map((format) => (
          <FileTypeIndicator key={format} format={format} />
        ))}
      </div>
    </div>
    
    {/* Processing indicator */}
    {visualState === 'processing' && (
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="tw-absolute tw-inset-0 tw-flex tw-items-center tw-justify-center tw-bg-iron-950/70"
        aria-live="polite"
      >
        <div className="tw-flex tw-flex-col tw-items-center tw-gap-3">
          <div className="tw-h-10 tw-w-10 tw-border-t-2 tw-border-b-2 tw-border-primary-500 tw-rounded-full tw-animate-spin" />
          <span className="tw-text-iron-300">Processing file...</span>
        </div>
      </motion.div>
    )}
    
    {/* Error message with accessibility */}
    {error && (
      <ErrorMessage 
        error={error} 
        showRetry={hasRecoveryOption} 
        onRetry={onRetry} 
      />
    )}
  </div>
);

// Browser compatibility warning component
interface BrowserWarningProps {
  readonly reason: string;
}

const BrowserWarning: React.FC<BrowserWarningProps> = ({ reason }) => (
  <div className="tw-absolute tw-inset-0 tw-bg-iron-950/90 tw-flex tw-items-center tw-justify-center tw-p-6 tw-z-10">
    <div className="tw-max-w-lg tw-bg-iron-900 tw-p-6 tw-rounded-xl tw-border tw-border-iron-800">
      <div className="tw-flex tw-items-center tw-mb-4 tw-text-yellow-500">
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="tw-w-6 tw-h-6 tw-mr-2">
          <path fillRule="evenodd" d="M9.401 3.003c1.155-2 4.043-2 5.197 0l7.355 12.748c1.154 2-.29 4.5-2.599 4.5H4.645c-2.309 0-3.752-2.5-2.598-4.5L9.4 3.003zM12 8.25a.75.75 0 01.75.75v3.75a.75.75 0 01-1.5 0V9a.75.75 0 01.75-.75zm0 8.25a.75.75 0 100-1.5.75.75 0 000 1.5z" clipRule="evenodd" />
        </svg>
        <h3 className="tw-text-lg tw-font-semibold">Browser Compatibility Issue</h3>
      </div>
      <p className="tw-text-iron-300 tw-mb-4">
        {reason}
      </p>
      <p className="tw-text-iron-400 tw-text-sm">
        We recommend using a modern browser like Chrome, Firefox, Edge, or Safari for the best experience.
      </p>
    </div>
  </div>
);

// File preview component
interface FilePreviewProps {
  readonly url: string;
  readonly onRemove: (e: React.MouseEvent<HTMLButtonElement>) => void;
}

const FilePreview: React.FC<FilePreviewProps> = ({ url, onRemove }) => (
  <motion.div
    initial={{ opacity: 0 }}
    animate={{ opacity: 1 }}
    className="tw-relative tw-w-full tw-h-full"
  >
    {/* Render appropriate preview based on file type */}
    {url.startsWith('data:image/') ? (
      <img
        src={url}
        alt="Artwork preview"
        className="tw-w-full tw-h-full tw-object-cover"
      />
    ) : url.startsWith('data:video/') ? (
      <video 
        src={url}
        className="tw-w-full tw-h-full tw-object-contain"
        controls
      />
    ) : (
      <img
        src={url}
        alt="Artwork preview"
        className="tw-w-full tw-h-full tw-object-cover"
      />
    )}
    
    <button
      onClick={onRemove}
      className="tw-absolute tw-top-4 tw-right-4 tw-p-2 tw-rounded-lg tw-bg-iron-900/80 tw-backdrop-blur hover:tw-bg-iron-800/80 tw-transition-colors tw-duration-200 tw-border-0"
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
  </motion.div>
);

// Max processing attempts before giving up
const MAX_PROCESSING_ATTEMPTS = 3;
// Processing timeout in milliseconds (10 seconds)
const PROCESSING_TIMEOUT_MS = 10000;

// Browser compatibility detection helpers
const isBrowserSupported = (): { supported: boolean; reason?: string } => {
  if (typeof window === 'undefined') {
    return { supported: true }; // Server-side rendering
  }
  
  // Check for File API support
  if (!window.File || !window.FileReader || !window.FileList || !window.Blob) {
    return { 
      supported: false, 
      reason: 'Your browser does not support the File API necessary for file uploads.' 
    };
  }
  
  // Check for URL.createObjectURL support
  if (!window.URL || typeof window.URL.createObjectURL !== 'function') {
    return { 
      supported: false, 
      reason: 'Your browser does not support the URL API necessary for file previews.' 
    };
  }
  
  // Check for drag and drop support
  const div = document.createElement('div');
  const hasDragDrop = ('draggable' in div) || 
                      ('ondragstart' in div && 'ondrop' in div);
  
  if (!hasDragDrop) {
    return { 
      supported: true, // Still functional but with limited features
      reason: 'Your browser has limited support for drag and drop. You can still click to select files.'
    };
  }
  
  return { supported: true };
};

// Initial state for the reducer
const initialFileUploaderState: FileUploaderState = {
  visualState: 'idle',
  error: null,
  objectUrl: null,
  processingAttempts: 0,
  processingFile: null,
  processingTimeout: null,
  hasRecoveryOption: false
};

// Reducer function for managing file uploader state
const fileUploaderReducer = (state: FileUploaderState, action: FileUploaderAction): FileUploaderState => {
  switch (action.type) {
    case 'SET_VISUAL_STATE':
      return { ...state, visualState: action.payload };
    case 'SET_ERROR':
      return { ...state, error: action.payload };
    case 'SET_OBJECT_URL':
      return { ...state, objectUrl: action.payload };
    case 'RESET_STATE':
      // Clear any running timeouts
      if (state.processingTimeout) {
        window.clearTimeout(state.processingTimeout);
      }
      return { ...initialFileUploaderState };
      
    case 'START_PROCESSING':
      // Increment processing attempts when starting and store the file
      return { 
        ...state, 
        visualState: 'processing', 
        error: null,
        processingAttempts: state.processingAttempts + 1,
        processingFile: action.payload,
        hasRecoveryOption: false
      };
      
    case 'PROCESSING_SUCCESS':
      // Clear attempt counter on success
      return { 
        ...state, 
        visualState: 'idle', 
        error: null, 
        objectUrl: action.payload,
        processingAttempts: 0,
        processingFile: null,
        processingTimeout: null,
        hasRecoveryOption: false
      };
      
    case 'PROCESSING_ERROR':
      // Show retry option if under max attempts
      const hasRetryOption = state.processingAttempts < MAX_PROCESSING_ATTEMPTS;
      return { 
        ...state, 
        visualState: 'invalid', 
        error: action.payload,
        hasRecoveryOption: hasRetryOption
      };
      
    case 'PROCESSING_RETRY':
      // Reset visual state but keep processingFile for retry
      return {
        ...state,
        visualState: 'processing',
        error: null,
        hasRecoveryOption: false
      };
      
    case 'PROCESSING_TIMEOUT':
      // Handle timeout case
      return {
        ...state,
        visualState: 'invalid',
        error: 'File processing timed out. Please try again.',
        processingTimeout: null,
        hasRecoveryOption: true
      };
      
    default:
      return state;
  }
};

const MemesArtSubmissionFile: React.FC<MemesArtSubmissionFileProps> = ({
  artworkUploaded,
  artworkUrl,
  setArtworkUploaded,
  handleFileSelect,
}) => {
  // State management with reducer
  const [state, dispatch] = useReducer(fileUploaderReducer, initialFileUploaderState);
  const { visualState, error, objectUrl } = state;
  
  // Browser compatibility state
  const [browserSupport, setBrowserSupport] = useState<{ 
    supported: boolean; 
    reason?: string 
  }>({ supported: true });
  
  // Refs
  const fileInputRef = useRef<HTMLInputElement>(null);
  const dropAreaRef = useRef<HTMLDivElement>(null);
  
  // Context
  const { setToast } = useContext(AuthContext);

  // Check browser compatibility on mount
  useEffect(() => {
    const support = isBrowserSupported();
    setBrowserSupport(support);
    
    if (!support.supported && support.reason) {
      setToast({
        type: 'warning',
        message: support.reason
      });
    }
  }, [setToast]);

  // Cleanup object URLs when component unmounts or when file changes
  useEffect(() => {
    return () => {
      if (objectUrl) {
        URL.revokeObjectURL(objectUrl);
      }
    };
  }, [objectUrl]);

  // Check for reduced motion preference
  const prefersReducedMotion = 
    typeof window !== 'undefined' ? 
      window.matchMedia('(prefers-reduced-motion: reduce)').matches : 
      false;

  // Comprehensive file validation with proper typing - no need for useCallback here
  // as it's only used internally and doesn't depend on state/props
  const validateFile = (file: File): FileValidationResult => {
    // Check if file exists
    if (!file) {
      return {
        valid: false,
        error: 'No file selected.'
      };
    }
    
    // Check file type with support for generic video types
    const isImageType = file.type.startsWith('image/') && 
      (file.type === 'image/png' || file.type === 'image/jpeg' || file.type === 'image/jpg');
    
    const isVideoType = file.type.startsWith('video/');
    
    if (!isImageType && !isVideoType) {
      return {
        valid: false,
        error: `File type not supported. Please upload PNG, JPG or video files.`
      };
    }
    
    // Check file size
    if (file.size > FILE_SIZE_LIMIT) {
      const sizeMB = Math.round(FILE_SIZE_LIMIT / (1024 * 1024));
      return {
        valid: false,
        error: `File size exceeds ${sizeMB}MB limit.`
      };
    }
    
    return { valid: true };
  };

  // Process file with better type safety, error coordination, and recovery
  // useCallback with dependencies that it needs to access
  const processFile = useCallback((file: File): void => {
    // Store the file for potential retries
    dispatch({ type: 'START_PROCESSING', payload: file });
    
    // Validate file
    const result = validateFile(file);
    
    if (result.valid) {
      try {
        // Clean up any existing object URL
        if (objectUrl) {
          URL.revokeObjectURL(objectUrl);
        }
        
        // Set a timeout to prevent indefinite processing
        const timeoutId = window.setTimeout(() => {
          dispatch({ type: 'PROCESSING_TIMEOUT' });
        }, PROCESSING_TIMEOUT_MS);
        
        // Create a new object URL for local preview if needed
        const newObjectUrl = URL.createObjectURL(file);
        
        // Clear the timeout since processing completed
        window.clearTimeout(timeoutId);
        
        // Update state with success
        dispatch({ type: 'PROCESSING_SUCCESS', payload: newObjectUrl });
        
        // Handle file selection (delegated to parent)
        handleFileSelect(file);
      } catch (e) {
        // Handle any unexpected errors during processing
        console.error('Error processing file:', e);
        const errorMessage = e instanceof Error ? e.message : 'Unexpected error processing file';
        
        dispatch({ type: 'PROCESSING_ERROR', payload: errorMessage });
        
        setToast({
          type: 'error',
          message: errorMessage
        });
      }
    } else {
      const errorMessage = result.error || 'Invalid file';
      
      // Dispatch error state
      dispatch({ type: 'PROCESSING_ERROR', payload: errorMessage });
      
      // Show toast for better user feedback
      setToast({
        type: 'error',
        message: errorMessage
      });
    }
  }, [objectUrl, handleFileSelect, setToast, dispatch]);
  
  // Add retry handler for recovery
  const handleRetry = useCallback((): void => {
    if (state.processingFile) {
      dispatch({ type: 'PROCESSING_RETRY' });
      processFile(state.processingFile);
    }
  }, [state.processingFile, processFile, dispatch]);

  // Properly typed drag event handlers with useCallback
  const handleDragEnter = useCallback((e: React.DragEvent<HTMLDivElement>): void => {
    e.preventDefault();
    e.stopPropagation();
    dispatch({ type: 'SET_VISUAL_STATE', payload: 'dragging' });
  }, [dispatch]);

  const handleDragOver = useCallback((e: React.DragEvent<HTMLDivElement>): void => {
    e.preventDefault();
    e.stopPropagation();
    // Keep the dragging state active
    if (visualState !== 'dragging') {
      dispatch({ type: 'SET_VISUAL_STATE', payload: 'dragging' });
    }
  }, [visualState, dispatch]);

  const handleDragLeave = useCallback((e: React.DragEvent<HTMLDivElement>): void => {
    e.preventDefault();
    e.stopPropagation();
    
    // Only reset if leaving the component (not entering child elements)
    if (dropAreaRef.current && !dropAreaRef.current.contains(e.relatedTarget as Node)) {
      dispatch({ type: 'SET_VISUAL_STATE', payload: 'idle' });
    }
  }, [dropAreaRef, dispatch]);

  const handleDrop = useCallback((e: React.DragEvent<HTMLDivElement>): void => {
    e.preventDefault();
    e.stopPropagation();
    
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      processFile(e.dataTransfer.files[0]);
    } else {
      // Reset if no files were dropped
      dispatch({ type: 'SET_VISUAL_STATE', payload: 'idle' });
    }
  }, [processFile, dispatch]);

  // Type-safe input change handler with useCallback
  const handleFileInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>): void => {
    if (e.target.files && e.target.files.length > 0) {
      processFile(e.target.files[0]);
      
      // Reset the input value to allow selecting the same file again
      e.target.value = '';
    }
  }, [processFile]);

  // Area click with focus management
  const handleAreaClick = useCallback((): void => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  }, [fileInputRef]);

  // Remove file with proper event handling
  const handleRemoveFile = useCallback((e: React.MouseEvent<HTMLButtonElement>): void => {
    e.stopPropagation(); // Prevent triggering file selection
    e.preventDefault();
    
    // Clean up object URL
    if (objectUrl) {
      URL.revokeObjectURL(objectUrl);
    }
    
    // Reset artwork state
    setArtworkUploaded(false);
    
    // Reset all state with the reducer
    dispatch({ type: 'RESET_STATE' });
  }, [objectUrl, setArtworkUploaded, dispatch]);

  // Define touch event handlers with useCallback for consistent references
  const handleTouchStart = useCallback((): void => {
    // Optional visual feedback for touch
    if (!artworkUploaded) {
      dispatch({ type: 'SET_VISUAL_STATE', payload: 'dragging' });
    }
  }, [artworkUploaded, dispatch]);
  
  const handleTouchEnd = useCallback((): void => {
    // Reset visual feedback
    if (!artworkUploaded) {
      dispatch({ type: 'SET_VISUAL_STATE', payload: 'idle' });
    }
  }, [artworkUploaded, dispatch]);
  
  // Keyboard event handler for accessibility
  const handleKeyDown = useCallback((e: React.KeyboardEvent<HTMLDivElement>): void => {
    if ((e.key === 'Enter' || e.key === ' ') && !artworkUploaded) {
      e.preventDefault();
      handleAreaClick();
    }
  }, [artworkUploaded, handleAreaClick]);

  // Add touch event handlers for mobile devices
  useEffect(() => {
    const element = dropAreaRef.current;
    if (!element) return;
    
    // Only add listeners if not in uploaded state
    if (!artworkUploaded) {
      element.addEventListener('touchstart', handleTouchStart, { passive: true });
      element.addEventListener('touchend', handleTouchEnd, { passive: true });
      
      return () => {
        element.removeEventListener('touchstart', handleTouchStart);
        element.removeEventListener('touchend', handleTouchEnd);
      };
    }
  }, [dropAreaRef, artworkUploaded, handleTouchStart, handleTouchEnd]);

  return (
    <motion.div
      ref={dropAreaRef}
      whileHover={!artworkUploaded && !prefersReducedMotion ? { scale: 1.002 } : undefined}
      className={`
        tw-relative tw-w-full tw-h-[400px] 
        tw-bg-gradient-to-br tw-from-iron-900 tw-to-iron-950 
        tw-rounded-xl tw-overflow-hidden tw-group 
        ${visualState === 'dragging' ? 'tw-border-2 tw-border-primary-500/60' : ''} 
        ${visualState === 'invalid' ? 'tw-border-2 tw-border-red/60' : ''}
        ${visualState === 'idle' && !artworkUploaded ? 'hover:tw-border hover:tw-border-iron-700/80' : ''}
        tw-transition-all tw-duration-300
        ${artworkUploaded ? '' : 'tw-cursor-pointer'}
      `}
      onDragEnter={!artworkUploaded ? handleDragEnter : undefined}
      onDragOver={!artworkUploaded ? handleDragOver : undefined}
      onDragLeave={!artworkUploaded ? handleDragLeave : undefined}
      onDrop={!artworkUploaded ? handleDrop : undefined}
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
          onRemove={handleRemoveFile} 
        />
      )}
    </motion.div>
  );
};

// Use React.memo for performance optimization
export default React.memo(MemesArtSubmissionFile, (prevProps, nextProps) => {
  return prevProps.artworkUploaded === nextProps.artworkUploaded &&
         prevProps.artworkUrl === nextProps.artworkUrl;
});
