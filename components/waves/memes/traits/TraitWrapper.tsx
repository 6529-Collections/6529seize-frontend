import React from 'react';
import { TraitWrapperProps } from './types';
import ValidationError from '../submission/ui/ValidationError';

export const TraitWrapper: React.FC<TraitWrapperProps> = ({
  label,
  readOnly = false,
  children,
  isBoolean = false,
  className,
  error,
  id,
  required = true,
}) => {
  // Generate unique IDs for accessibility
  const fieldId = id || `field-${label.toLowerCase().replace(/\s+/g, '-')}`;
  const errorId = error ? `${fieldId}-error` : undefined;
  
  const hasError = !!error && !readOnly;
  
  return (
    <div className={`tw-bg-iron-900/50 tw-rounded-xl tw-p-4 tw-ring-1 tw-ring-inset 
      ${isBoolean ? 'tw-ring-iron-800/40' : 'tw-ring-iron-800/5'} 
      ${hasError ? 'tw-ring-red-500/40' : ''} 
      tw-transition-colors ${className || ''}`}
    >
      <div className={`${isBoolean ? 'tw-flex tw-items-center' : 'tw-flex tw-items-center tw-gap-x-6'}`}>
        <label
          htmlFor={fieldId}
          className={`${isBoolean ? 'tw-text-sm tw-text-iron-200 tw-w-1/3 tw-font-medium' : `tw-w-1/3 tw-text-sm tw-font-medium ${
            readOnly ? "tw-text-iron-400" : hasError ? "tw-text-red-500" : "tw-text-iron-300"
          }`}`}
        >
          {label}{required && !readOnly && <span className="tw-text-red-500 tw-ml-1">*</span>}
        </label>
        
        {/* Cloning children to pass additional props if needed */}
        {React.Children.map(children, child => {
          if (React.isValidElement(child)) {
            return React.cloneElement(child, {
              id: fieldId,
              'aria-invalid': hasError,
              'aria-describedby': errorId,
              ...child.props
            });
          }
          return child;
        })}
      </div>
      
      {/* Error message */}
      <ValidationError error={error} id={errorId} className="tw-ml-[33%]" />
    </div>
  );
};