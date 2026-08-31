import React from 'react';
import { motion } from 'framer-motion';
import Button from '@/components/utils/button/Button';
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
    className="tw-max-w-full tw-rounded-lg tw-border tw-border-red/30 tw-bg-red/10 tw-px-4 tw-py-2 tw-text-center tw-text-xs tw-text-red"
    role="alert"
    aria-live="assertive"
  >
    <div className="tw-flex tw-flex-col tw-gap-2">
      <span>{error}</span>
      {showRetry && (
        <Button
          onClick={(e) => {
            e.stopPropagation();
            onRetry(e);
          }}
          type="button"
          variant="action"
          size="xs"
        >
          Try Again
        </Button>
      )}
    </div>
  </motion.div>
);

export default ErrorMessage;
