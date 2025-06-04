import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import ErrorMessage from '../../../../../../components/waves/memes/file-upload/components/ErrorMessage';

test('renders message and retry button', async () => {
  const onRetry = jest.fn();
  const user = userEvent.setup();
  render(<ErrorMessage error="oops" showRetry onRetry={onRetry} />);
  expect(screen.getByRole('alert')).toHaveTextContent('oops');
  await user.click(screen.getByRole('button'));
  expect(onRetry).toHaveBeenCalled();
});

test('hides retry button when not requested', () => {
  render(<ErrorMessage error="bad" showRetry={false} onRetry={jest.fn()} />);
  expect(screen.queryByRole('button')).toBeNull();
});
