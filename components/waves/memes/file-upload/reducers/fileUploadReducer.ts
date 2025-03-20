/**
 * File Uploader Reducer
 * 
 * Handles state transitions for the file upload component.
 */

import { MAX_PROCESSING_ATTEMPTS } from '../utils/constants';
import type { FileUploaderAction, FileUploaderState } from './types';

/**
 * Initial state for the reducer
 */
export const initialFileUploaderState: FileUploaderState = {
  visualState: 'idle',
  error: null,
  objectUrl: null,
  processingAttempts: 0,
  processingFile: null,
  processingTimeout: null,
  hasRecoveryOption: false,
  
  // Enhanced properties
  currentFile: null,
  videoCompatibility: null,
  isCheckingCompatibility: false
};

/**
 * Reducer function for managing file uploader state
 * 
 * @param state Current state
 * @param action Action to perform
 * @returns New state
 */
export const fileUploaderReducer = (
  state: FileUploaderState, 
  action: FileUploaderAction
): FileUploaderState => {
  switch (action.type) {
    case 'SET_VISUAL_STATE':
      return { ...state, visualState: action.payload };
      
    case 'SET_ERROR':
      return { ...state, error: action.payload };
      
    case 'SET_OBJECT_URL':
      return { ...state, objectUrl: action.payload };
      
    case 'RESET_STATE':
      // Clean up resources before resetting state
      if (state.processingTimeout) {
        window.clearTimeout(state.processingTimeout);
      }
      if (state.objectUrl) {
        URL.revokeObjectURL(state.objectUrl);
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
        hasRecoveryOption: false,
        // Reset compatibility results when starting a new process
        videoCompatibility: null,
        isCheckingCompatibility: false
      };
      
    case 'PROCESSING_SUCCESS':
      // Store file and object URL on success
      return { 
        ...state, 
        visualState: 'idle', 
        error: null, 
        objectUrl: action.payload.objectUrl,
        currentFile: action.payload.file,
        processingAttempts: 0,
        processingFile: null,
        processingTimeout: null,
        hasRecoveryOption: false,
        // Start compatibility check if it's a video
        isCheckingCompatibility: action.payload.file.type.startsWith('video/')
      };
      
    case 'PROCESSING_ERROR':
      // Show retry option if under max attempts
      const hasRetryOption = state.processingAttempts < MAX_PROCESSING_ATTEMPTS;
      return { 
        ...state, 
        visualState: 'invalid', 
        error: action.payload,
        hasRecoveryOption: hasRetryOption,
        isCheckingCompatibility: false
      };
      
    case 'PROCESSING_RETRY':
      // Reset visual state but keep processingFile for retry
      return {
        ...state,
        visualState: 'processing',
        error: null,
        hasRecoveryOption: false,
        videoCompatibility: null
      };
      
    case 'PROCESSING_TIMEOUT':
      // Handle timeout case
      return {
        ...state,
        visualState: 'invalid',
        error: 'File processing timed out. Please try again.',
        processingTimeout: null,
        hasRecoveryOption: true,
        isCheckingCompatibility: false
      };
      
    case 'START_COMPATIBILITY_CHECK':
      return {
        ...state,
        isCheckingCompatibility: true,
        processingFile: action.payload
      };
      
    case 'SET_COMPATIBILITY_RESULT':
      return {
        ...state,
        videoCompatibility: action.payload,
        isCheckingCompatibility: false
      };
      
    default:
      return state;
  }
};