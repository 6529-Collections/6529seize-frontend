import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import { ProfileWinnerRing } from '../../../../components/waves/drops/ProfileWinnerRing';
import { ProfileWinnerBadge } from '../../../../components/waves/drops/ProfileWinnerBadge';

describe('ProfileWinnerRing', () => {
  it('renders children without ring when winCount is 0', () => {
    render(
      <ProfileWinnerRing winCount={0}>
        <div data-testid="child">Child content</div>
      </ProfileWinnerRing>
    );
    expect(screen.getByTestId('child')).toBeInTheDocument();
  });

  it('renders ring for multiple wins without count indicator', () => {
    render(
      <ProfileWinnerRing winCount={3} bestRank={1}>
        <div data-testid="child">Child content</div>
      </ProfileWinnerRing>
    );
    expect(screen.getByTestId('child')).toBeInTheDocument();
    expect(screen.queryByText('3')).not.toBeInTheDocument();
  });

  it('renders ring for high win counts without count indicator', () => {
    render(
      <ProfileWinnerRing winCount={15} bestRank={1}>
        <div data-testid="child">Child content</div>
      </ProfileWinnerRing>
    );
    expect(screen.queryByText('9+')).not.toBeInTheDocument();
  });
});

describe('ProfileWinnerBadge', () => {
  it('returns null when winCount is 0', () => {
    const { container } = render(
      <ProfileWinnerBadge winCount={0} />
    );
    expect(container.firstChild).toBeNull();
  });

  it('shows only trophy icon for single win', () => {
    render(<ProfileWinnerBadge winCount={1} bestRank={1} />);
    const trophyIcon = document.querySelector('[data-icon="trophy"]');
    expect(trophyIcon).toBeInTheDocument();
    expect(screen.queryByText('Winner')).not.toBeInTheDocument();
  });

  it('shows only trophy icon for multiple wins', () => {
    render(<ProfileWinnerBadge winCount={5} bestRank={1} />);
    const trophyIcon = document.querySelector('[data-icon="trophy"]');
    expect(trophyIcon).toBeInTheDocument();
    expect(screen.queryByText('5x Winner')).not.toBeInTheDocument();
  });

  it('shows only icon regardless of showCount prop', () => {
    render(
      <ProfileWinnerBadge winCount={3} bestRank={1} showCount={false} />
    );
    const trophyIcon = document.querySelector('[data-icon="trophy"]');
    expect(trophyIcon).toBeInTheDocument();
    expect(screen.queryByText('Winner')).not.toBeInTheDocument();
    expect(screen.queryByText('3x Winner')).not.toBeInTheDocument();
  });

  it('handles different trophy variants', () => {
    render(<ProfileWinnerBadge winCount={1} bestRank={1} variant="crown" />);
    const crownIcon = document.querySelector('[data-icon="crown"]');
    expect(crownIcon).toBeInTheDocument();
  });
});