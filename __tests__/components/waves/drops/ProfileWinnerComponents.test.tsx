import React from 'react';
import { render } from '@testing-library/react';
import '@testing-library/jest-dom';
import { ProfileWinnerBadge } from '@/components/waves/drops/ProfileWinnerBadge';

describe('ProfileWinnerBadge', () => {
  it('returns null when winCount is 0', () => {
    const { container } = render(
      <ProfileWinnerBadge winCount={0} />
    );
    expect(container.firstChild).toBeNull();
  });

  it('shows only trophy icon for single win', () => {
    render(<ProfileWinnerBadge winCount={1} />);
    const trophyIcon = document.querySelector('svg[data-icon="trophy"]');
    expect(trophyIcon).toBeInTheDocument();
  });

  it('shows only trophy icon for multiple wins', () => {
    render(<ProfileWinnerBadge winCount={5} />);
    const trophyIcon = document.querySelector('svg[data-icon="trophy"]');
    expect(trophyIcon).toBeInTheDocument();
  });

  it('renders correct styling and structure', () => {
    const { container } = render(<ProfileWinnerBadge winCount={3} />);
    const badge = container.firstChild;
    expect(badge).toHaveClass('tw-inline-flex', 'tw-items-center', 'tw-justify-center');
    expect(badge).toHaveClass('tw-bg-amber-400/10', 'tw-border-amber-400/20', 'tw-text-amber-300');
  });
});