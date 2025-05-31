import React from 'react';
import { render, screen } from '@testing-library/react';
import { UnifiedWavesListLoader } from '../../../../../components/brain/left-sidebar/waves/UnifiedWavesListLoader';

test('returns null when not fetching', () => {
  const { container } = render(<UnifiedWavesListLoader isFetchingNextPage={false} />);
  expect(container.firstChild).toBeNull();
});

test('shows loader when fetching', () => {
  render(<UnifiedWavesListLoader isFetchingNextPage={true} />);
  expect(screen.getByTestId('loader')).toBeInTheDocument();
});
