import { render, screen } from '@testing-library/react';
import React from 'react';
import MyStreamWaveMyVotesResetProgress from '@/components/brain/my-stream/votes/MyStreamWaveMyVotesResetProgress';

describe('MyStreamWaveMyVotesResetProgress', () => {
  it('returns null when not resetting', () => {
    const { container } = render(<MyStreamWaveMyVotesResetProgress isResetting={false} resetProgress={0} totalCount={10} />);
    expect(container.firstChild).toBeNull();
  });

  it('shows progress bar with correct width', () => {
    const { container } = render(<MyStreamWaveMyVotesResetProgress isResetting={true} resetProgress={2} totalCount={4} />);
    expect(screen.getByText('Resetting votes...')).toBeInTheDocument();
    const bar = container.querySelector('div.tw-bg-primary-500') as HTMLDivElement;
    expect(bar.style.width).toBe('50%');
  });
});
