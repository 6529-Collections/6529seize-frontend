import React from 'react';
import { motion } from 'framer-motion';
import type { ErrorMessageProps } from '../reducers/types';

/**
 * Error message component with retry option
 * 
 * Displays an error message with an optional retry button.
 * The component animates in from the bottom for a smooth appearance.
 * 
 * @param props Component props
 * @returns JSX Element
 */
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

export default ErrorMessage;