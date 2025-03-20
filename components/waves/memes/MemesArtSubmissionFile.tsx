import React, { useContext, useEffect, useRef, useState } from 'react';
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

// File validation constants - matches the UI indicators in the original component
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

const MemesArtSubmissionFile: React.FC<MemesArtSubmissionFileProps> = ({
  artworkUploaded,
  artworkUrl,
  setArtworkUploaded,
  handleFileSelect,
}) => {
  // State management
  const [visualState, setVisualState] = useState<VisualState>('idle');
  const [error, setError] = useState<string | null>(null);
  const [objectUrl, setObjectUrl] = useState<string | null>(null);
  
  // Refs
  const fileInputRef = useRef<HTMLInputElement>(null);
  const dropAreaRef = useRef<HTMLDivElement>(null);
  
  // Context
  const { setToast } = useContext(AuthContext);

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

  // Comprehensive file validation with proper typing
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

  // Process file with better type safety and error coordination
  const processFile = (file: File): void => {
    setVisualState('processing');
    
    // Validate file
    const result = validateFile(file);
    
    if (result.valid) {
      // Clean up any existing object URL
      if (objectUrl) {
        URL.revokeObjectURL(objectUrl);
      }
      
      // Reset error state
      setError(null);
      
      // Create a new object URL for local preview if needed
      const newObjectUrl = URL.createObjectURL(file);
      setObjectUrl(newObjectUrl);
      
      // Handle file selection (delegated to parent)
      handleFileSelect(file);
      
      // Reset visual state after a short delay
      setTimeout(() => {
        setVisualState('idle');
      }, 300);
    } else {
      // Set error state
      setError(result.error || 'Invalid file');
      
      // Show toast for better user feedback
      setToast({
        type: 'error',
        message: result.error || 'Invalid file'
      });
      
      // Set visual state to invalid
      setVisualState('invalid');
      
      // Reset visual state after delay
      setTimeout(() => {
        setVisualState('idle');
      }, 2000);
    }
  };

  // Properly typed drag event handlers
  const handleDragEnter = (e: React.DragEvent<HTMLDivElement>): void => {
    e.preventDefault();
    e.stopPropagation();
    setVisualState('dragging');
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>): void => {
    e.preventDefault();
    e.stopPropagation();
    // Keep the dragging state active
    if (visualState !== 'dragging') {
      setVisualState('dragging');
    }
  };

  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>): void => {
    e.preventDefault();
    e.stopPropagation();
    
    // Only reset if leaving the component (not entering child elements)
    if (dropAreaRef.current && !dropAreaRef.current.contains(e.relatedTarget as Node)) {
      setVisualState('idle');
    }
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>): void => {
    e.preventDefault();
    e.stopPropagation();
    
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      processFile(e.dataTransfer.files[0]);
    } else {
      // Reset if no files were dropped
      setVisualState('idle');
    }
  };

  // Type-safe input change handler
  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>): void => {
    if (e.target.files && e.target.files.length > 0) {
      processFile(e.target.files[0]);
      
      // Reset the input value to allow selecting the same file again
      e.target.value = '';
    }
  };

  // Area click with focus management
  const handleAreaClick = (): void => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  // Remove file with proper event handling
  const handleRemoveFile = (e: React.MouseEvent<HTMLButtonElement>): void => {
    e.stopPropagation(); // Prevent triggering file selection
    e.preventDefault();
    
    // Clean up object URL
    if (objectUrl) {
      URL.revokeObjectURL(objectUrl);
      setObjectUrl(null);
    }
    
    // Reset artwork state
    setArtworkUploaded(false);
    
    // Reset error state
    setError(null);
    
    // Reset visual state
    setVisualState('idle');
  };

  // Add touch event handlers for mobile devices
  useEffect(() => {
    const element = dropAreaRef.current;
    if (!element) return;
    
    // Touch events handling for mobile
    const handleTouchStart = (): void => {
      // Optional visual feedback for touch
    };
    
    const handleTouchEnd = (): void => {
      // Reset visual feedback
    };
    
    element.addEventListener('touchstart', handleTouchStart, { passive: true });
    element.addEventListener('touchend', handleTouchEnd, { passive: true });
    
    return () => {
      element.removeEventListener('touchstart', handleTouchStart);
      element.removeEventListener('touchend', handleTouchEnd);
    };
  }, [dropAreaRef.current]);

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
      onKeyDown={(e) => {
        if ((e.key === 'Enter' || e.key === ' ') && !artworkUploaded) {
          e.preventDefault();
          handleAreaClick();
        }
      }}
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
      
      {/* Content with error states and loading indicators */}
      {!artworkUploaded ? (
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
                <span 
                  key={format}
                  className="tw-px-3 tw-py-1.5 tw-rounded-full tw-bg-iron-900/50 tw-backdrop-blur tw-border tw-border-iron-800/50"
                >
                  {format}
                </span>
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
            <motion.div 
              id="file-upload-error"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="tw-absolute tw-bottom-14 tw-px-4 tw-py-2 tw-bg-red/10 tw-border tw-border-red/30 tw-rounded-lg tw-text-red tw-text-sm"
              role="alert"
              aria-live="assertive"
            >
              {error}
            </motion.div>
          )}
        </div>
      ) : (
        // Preview state with better accessibility and keyboard support
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="tw-relative tw-w-full tw-h-full"
        >
          {/* Render appropriate preview based on file type */}
          {artworkUrl.startsWith('data:image/') ? (
            <img
              src={artworkUrl}
              alt="Artwork preview"
              className="tw-w-full tw-h-full tw-object-cover"
            />
          ) : artworkUrl.startsWith('data:video/') ? (
            <video 
              src={artworkUrl}
              className="tw-w-full tw-h-full tw-object-contain"
              controls
            />
          ) : (
            <img
              src={artworkUrl}
              alt="Artwork preview"
              className="tw-w-full tw-h-full tw-object-cover"
            />
          )}
          
          <button
            onClick={handleRemoveFile}
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
      )}
    </motion.div>
  );
};

// Use React.memo for performance optimization
export default React.memo(MemesArtSubmissionFile, (prevProps, nextProps) => {
  return prevProps.artworkUploaded === nextProps.artworkUploaded &&
         prevProps.artworkUrl === nextProps.artworkUrl;
});
