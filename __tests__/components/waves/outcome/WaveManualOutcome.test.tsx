import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import React from 'react';
import { WaveManualOutcome } from '@/components/waves/outcome/WaveManualOutcome';

const outcome = {
  description: 'desc',
} as any;

const distribution = {
  items: [
    { index: 1, amount: 0, description: 'A' },
    { index: 2, amount: 150, description: 'B' },
    { index: 3, amount: 250, description: 'C' },
    { index: 4, amount: 350, description: 'D' },
  ],
  totalCount: 4,
  hasNextPage: false,
  isFetchingNextPage: false,
  fetchNextPage: jest.fn(),
} as any;

describe('WaveManualOutcome', () => {
  it('expands and shows all winners', async () => {
    const user = userEvent.setup();
    render(<WaveManualOutcome outcome={outcome} distribution={distribution} />);
    await user.click(screen.getByRole('button'));
    expect(screen.getByText('-')).toBeInTheDocument();
    expect(screen.getByText('View more')).toBeInTheDocument();
    await user.click(screen.getByText('View more'));
    expect(screen.queryByText('View more')).toBeNull();
    expect(screen.getByText('D')).toBeInTheDocument();
  });
});
