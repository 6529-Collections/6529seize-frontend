import React from 'react';
import { motion } from 'framer-motion';
import type { UploadAreaProps } from '../reducers/types';
import ErrorMessage from './ErrorMessage';
import FileTypeIndicator from './FileTypeIndicator';
import { UI_FORMAT_CATEGORIES } from '../utils/constants';

/**
 * Upload Area Component
 * 
 * Displays the main upload area where users can drag and drop or click to select files.
 * Shows format indicators, drag hints, and error messages.
 * 
 * @param props Component props
 * @returns JSX Element
 */
const UploadArea: React.FC<UploadAreaProps> = ({
  visualState,
  error,
  hasRecoveryOption,
  onRetry
}) => (
  <div className="tw-absolute tw-inset-0 tw-flex tw-flex-col tw-items-center tw-justify-center tw-p-6">
    {/* Subtle animated dashed border around entire area */}
    <div className="tw-absolute tw-inset-[10px] tw-border-2 tw-border-dashed tw-border-iron-700 group-hover:tw-border-primary-500/30 tw-rounded-lg tw-transition-all tw-duration-300" />
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
          <div className="tw-h-12 tw-w-12 tw-border-t-2 tw-border-b-2 tw-border-primary-500 tw-rounded-full tw-animate-spin" />
          <span className="tw-text-iron-300 tw-font-medium">Processing file...</span>
          <span className="tw-text-iron-400 tw-text-xs">This may take longer for large files (up to 100MB)</span>
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

export default UploadArea;