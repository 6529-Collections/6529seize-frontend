import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import React from 'react';
import { WaveManualOutcome } from '@/components/waves/outcome/WaveManualOutcome';

const outcome = {
  description: 'desc',
  distribution: [
    { amount: 1, description: 'A' },
    { amount: 2, description: 'B' },
    { amount: 3, description: 'C' },
    { amount: 4, description: 'D' },
  ],
} as any;

describe('WaveManualOutcome', () => {
  it('expands and shows all winners', async () => {
    const user = userEvent.setup();
    render(<WaveManualOutcome outcome={outcome} />);
    await user.click(screen.getByRole('button'));
    expect(screen.getByText('View more')).toBeInTheDocument();
    await user.click(screen.getByText('View more'));
    expect(screen.queryByText('View more')).toBeNull();
    expect(screen.getByText('D')).toBeInTheDocument();
  });
});
