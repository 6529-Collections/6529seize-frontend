import React from "react";

interface ValidationErrorProps {
  error?: string | null | undefined;
  id?: string | undefined;
  className?: string | undefined;
}

/**
 * Component for displaying a validation error message with proper styling and accessibility
 */
const ValidationError: React.FC<ValidationErrorProps> = ({
  error,
  id,
  className = "tw-mt-1.5",
}) => {
  if (!error) return null;

  return (
    <div
      id={id}
      className={`tw-text-xs tw-font-normal tw-text-red ${className}`}
      role="alert"
      aria-live="polite"
    >
      {error}
    </div>
  );
};

export default React.memo(ValidationError);
