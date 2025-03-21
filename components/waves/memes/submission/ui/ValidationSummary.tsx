import React from 'react';
import { TraitsData } from '../types/TraitsData';

interface ValidationSummaryProps {
  errors: Record<keyof TraitsData, string | null>;
  show: boolean;
  onErrorClick?: ((field: keyof TraitsData) => void) | (() => void);
  className?: string;
}

/**
 * Component for displaying a summary of all validation errors
 * Useful for showing at the top of the form or near submit button
 */
const ValidationSummary: React.FC<ValidationSummaryProps> = ({
  errors,
  show,
  onErrorClick,
  className = ''
}) => {
  if (!show) return null;
  
  // Filter out null/undefined errors and get error entries
  const errorEntries = Object.entries(errors)
    .filter(([_, error]) => error !== null && error !== undefined) as [keyof TraitsData, string][];
  
  if (errorEntries.length === 0) return null;
  
  return (
    <div 
      className={`tw-bg-red-500/10 tw-border tw-border-red-500/30 tw-rounded-lg tw-p-4 tw-mb-4 ${className}`}
      role="alert"
      aria-labelledby="validation-summary-heading"
    >
      <h3 
        id="validation-summary-heading"
        className="tw-text-red-500 tw-font-semibold tw-mb-2"
      >
        Please fix the following issues:
      </h3>
      
      <ul className="tw-list-disc tw-pl-5">
        {errorEntries.map(([field, error]) => (
          <li key={String(field)} className="tw-text-sm tw-text-red-500 tw-mb-1">
            {onErrorClick ? (
              <button
                type="button"
                className="tw-text-left tw-underline hover:tw-no-underline focus:tw-outline-none"
                onClick={() => {
                  // Check if the handler expects a field argument
                  const handler = onErrorClick as any;
                  if (handler.length === 1) {
                    handler(field);
                  } else {
                    handler();
                  }
                }}
              >
                {error}
              </button>
            ) : (
              <span>{error}</span>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
};

export default React.memo(ValidationSummary);