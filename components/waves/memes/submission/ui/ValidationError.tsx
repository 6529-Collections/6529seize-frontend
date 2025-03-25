import React from 'react';

interface ValidationErrorProps {
  error?: string | null;
  id?: string;
  className?: string;
}

/**
 * Component for displaying a validation error message with proper styling and accessibility
 */
const ValidationError: React.FC<ValidationErrorProps> = ({ 
  error, 
  id, 
  className = '' 
}) => {
  if (!error) return null;
  
  return (
    <div 
      id={id}
      className={`tw-text-red tw-text-sm tw-mt-1 tw-font-normal ${className}`}
      role="alert"
      aria-live="polite"
    >
      {error}
    </div>
  );
};

export default React.memo(ValidationError);