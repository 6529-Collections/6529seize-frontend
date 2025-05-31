import { render, screen } from '@testing-library/react';
import ValidationFeedback from '../../../../../../components/waves/create-wave/voting/components/ValidationFeedback';
import { MIN_MINUTES, MAX_HOURS } from '../../../../../../components/waves/create-wave/voting/types';

describe('ValidationFeedback', () => {
  it('shows error message when provided', () => {
    render(<ValidationFeedback error="Too low" />);
    expect(screen.getByTestId('validation-error')).toHaveTextContent('Too low');
  });

  it('shows description when no error', () => {
    render(<ValidationFeedback />);
    expect(screen.getByText(`The time period over which votes are averaged. Must be between ${MIN_MINUTES} minutes and ${MAX_HOURS} hours. Longer intervals are more resistant to manipulation.`)).toBeInTheDocument();
  });
});
