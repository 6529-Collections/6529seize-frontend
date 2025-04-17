import React, { useCallback, useReducer } from 'react';
import { fileUploaderReducer, initialFileUploaderState } from '../reducers/fileUploadReducer';
import { validateFile, testVideoCompatibility } from '../utils/fileValidation';
import { PROCESSING_TIMEOUT_MS } from '../utils/constants';
import type { FileUploaderState } from '../reducers/types';

// Helper function to generate video thumbnail
const generateVideoThumbnail = (file: File): Promise<string | null> => {
  return new Promise((resolve, reject) => {
    const video = document.createElement('video');
    const canvas = document.createElement('canvas');
    const context = canvas.getContext('2d');
    const fileURL = URL.createObjectURL(file);

    if (!context) {
      URL.revokeObjectURL(fileURL);
      return reject(new Error('Could not get 2D context from canvas'));
    }

    video.src = fileURL;
    video.crossOrigin = 'anonymous';
    video.preload = 'metadata'; // Only load metadata initially

    let seeked = false;

    const onLoadedMetadata = () => {
      // Set canvas dimensions
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      // Seek to a small offset (e.g., 0.1s) to capture a frame
      // Use requestAnimationFrame to ensure rendering cycle allows seek
      requestAnimationFrame(() => {
        video.currentTime = 0.1; 
      });
    };

    const onSeeked = () => {
      if (seeked) return; // Prevent multiple captures
      seeked = true;

      // Draw the frame onto the canvas
      context.drawImage(video, 0, 0, canvas.width, canvas.height);
      // Get the Data URL (JPEG is generally smaller for photos/thumbnails)
      const thumbnailUrl = canvas.toDataURL('image/jpeg', 0.8); 
      
      // Clean up the object URL
      URL.revokeObjectURL(fileURL);
      
      // Remove listeners to prevent memory leaks
      video.removeEventListener('loadedmetadata', onLoadedMetadata);
      video.removeEventListener('seeked', onSeeked);
      video.removeEventListener('error', onError);

      resolve(thumbnailUrl);
    };

    const onError = (e: Event | string) => {
      // Clean up the object URL
      URL.revokeObjectURL(fileURL);
      console.error('Error processing video for thumbnail:', e);
      // Remove listeners
      video.removeEventListener('loadedmetadata', onLoadedMetadata);
      video.removeEventListener('seeked', onSeeked);
      video.removeEventListener('error', onError);
      reject(new Error('Failed to load video for thumbnail generation'));
    };

    video.addEventListener('loadedmetadata', onLoadedMetadata);
    video.addEventListener('seeked', onSeeked);
    video.addEventListener('error', onError);

    // Some browsers might need load() called explicitly
    video.load();
  });
};

/**
 * Interface for the return value of the useFileUploader hook
 */
interface FileUploaderHook {
  /** Current state of the file uploader */
  state: FileUploaderState;
  /** Process a file for upload */
  processFile: (file: File) => void;
  /** Retry processing the current file */
  handleRetry: () => void;
  /** Reset the file uploader state */
  resetState: () => void;
  /** Handle file removal */
  handleRemoveFile: (e: React.MouseEvent<HTMLButtonElement>) => void;
  /** Direct access to the dispatch function for custom actions */
  dispatch: React.Dispatch<import('../reducers/types').FileUploaderAction>;
}

/**
 * Props for the useFileUploader hook
 */
interface UseFileUploaderProps {
  /** Callback to be called when a file is selected */
  onFileSelect: (file: File) => void;
  /** Callback to be called when a file is uploaded */
  setUploaded: (uploaded: boolean) => void;
  /** Callback to show toast notifications */
  showToast?: (toast: { type: any; message: string | React.ReactNode }) => void;
}

/**
 * Hook for managing file upload state and logic
 * 
 * Handles file processing, validation, compatibility checking,
 * error handling, and state management.
 * 
 * @param props Hook props
 * @returns Object with state and handlers
 */
export const useFileUploader = ({
  onFileSelect,
  setUploaded,
  showToast
}: UseFileUploaderProps): FileUploaderHook => {
  // State management with reducer
  const [state, dispatch] = useReducer(fileUploaderReducer, initialFileUploaderState);
  
  // Process file with error handling and validation
  const processFile = useCallback((file: File): void => {
    // Start processing and store the file for potential retries
    dispatch({ type: 'START_PROCESSING', payload: file });
    
    // Validate file
    const result = validateFile(file);
    
    if (result.valid) {
      try {
        // Clean up any existing object URL
        if (state.objectUrl) {
          URL.revokeObjectURL(state.objectUrl);
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
        dispatch({ 
          type: 'PROCESSING_SUCCESS', 
          payload: {
            objectUrl: newObjectUrl,
            file: file
          }
        });
        
        // Start compatibility check and thumbnail generation for video files
        if (file.type.startsWith('video/')) {
          // Compatibility Check (async)
          testVideoCompatibility(file).then(result => {
            dispatch({ 
              type: 'SET_COMPATIBILITY_RESULT', 
              payload: result 
            });
          });
          
          // Thumbnail Generation (async)
          generateVideoThumbnail(file)
            .then(thumbnailUrl => {
              dispatch({ type: 'SET_THUMBNAIL_URL', payload: thumbnailUrl });
            })
            .catch(error => {
              console.error('Thumbnail generation failed:', error);
              // Optionally dispatch an error or show a toast
              if (showToast) {
                showToast({
                  type: 'warning' as any,
                  message: 'Could not generate video thumbnail.'
                });
              }
            });
        }
        
        // Handle file selection (delegated to parent)
        onFileSelect(file);
      } catch (e) {
        // Handle any unexpected errors during processing
        console.error('Error processing file:', e);
        const errorMessage = e instanceof Error ? e.message : 'Unexpected error processing file';
        
        dispatch({ type: 'PROCESSING_ERROR', payload: errorMessage });
        
        if (showToast) {
          showToast({
            type: 'error' as any, // Cast to any to avoid TypeScript errors
            message: errorMessage
          });
        }
      }
    } else {
      const errorMessage = result.error ?? 'Invalid file';
      
      // Dispatch error state
      dispatch({ type: 'PROCESSING_ERROR', payload: errorMessage });
      
      // Show toast for better user feedback
      if (showToast) {
        showToast({
          type: 'error' as any, // Cast to any to avoid TypeScript errors
          message: errorMessage
        });
      }
    }
  }, [state.objectUrl, onFileSelect, showToast]);
  
  // Add retry handler for recovery
  const handleRetry = useCallback((): void => {
    if (state.processingFile) {
      dispatch({ type: 'PROCESSING_RETRY' });
      processFile(state.processingFile);
    }
  }, [state.processingFile, processFile]);
  
  // Reset state
  const resetState = useCallback(() => {
    dispatch({ type: 'RESET_STATE' });
  }, []);
  
  // Remove file handler
  const handleRemoveFile = useCallback((e: React.MouseEvent<HTMLButtonElement>): void => {
    e.stopPropagation(); // Prevent triggering file selection
    e.preventDefault();
    
    // Clean up object URL
    if (state.objectUrl) {
      URL.revokeObjectURL(state.objectUrl);
    }
    
    // Reset artwork state
    setUploaded(false);
    
    // Reset all state with the reducer (this will clear thumbnailUrl too)
    dispatch({ type: 'RESET_STATE' });
  }, [state.objectUrl, setUploaded]);
  
  return {
    state,
    processFile,
    handleRetry,
    resetState,
    handleRemoveFile,
    dispatch
  };
};

export default useFileUploader;
