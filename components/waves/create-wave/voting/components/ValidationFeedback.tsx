import { memo } from 'react';
import { MIN_MINUTES, MAX_HOURS } from '../types';

interface ValidationFeedbackProps {
  /** Error message to display, if any */
  readonly error?: string;
}

/**
 * ValidationFeedback Component
 * Displays either an error message or a description based on validation state
 */
const ValidationFeedback = memo(({
  error,
}: ValidationFeedbackProps) => (
  <div aria-live="polite">
    {error ? (
      <p
        id="averaging-interval-error"
        className="tw-text-xs tw-text-red-400 tw-mt-1"
        role="alert"
        data-testid="validation-error"
      >
        {error}
      </p>
    ) : (
      <p
        id="averaging-interval-description"
        className="tw-text-xs tw-text-iron-400 tw-mt-1"
      >
        The time period over which votes are averaged. Must be between {MIN_MINUTES} minutes 
        and {MAX_HOURS} hours. Longer intervals are more resistant to manipulation.
      </p>
    )}
  </div>
));

ValidationFeedback.displayName = "ValidationFeedback";

export default ValidationFeedback;