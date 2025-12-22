import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { WaveRepOutcome } from '@/components/waves/outcome/WaveRepOutcome';

jest.mock('framer-motion', () => ({
  motion: {
    svg: (p: any) => <svg {...p} />,
    div: (p: any) => <div {...p} />,
  },
  AnimatePresence: ({ children }: any) => <>{children}</>,
}));

jest.mock('@fortawesome/react-fontawesome', () => ({ FontAwesomeIcon: () => <span data-testid="icon" /> }));

describe('WaveRepOutcome', () => {
  const outcome = {
    amount: 100,
    rep_category: 'rep',
  } as any;

  const distribution = {
    items: [
      { index: 1, amount: 10 },
      { index: 2, amount: 20 },
      { index: 3, amount: 30 },
      { index: 4, amount: 40 },
    ],
    totalCount: 4,
    hasNextPage: false,
    isFetchingNextPage: false,
    fetchNextPage: jest.fn(),
  } as any;

  it('expands list and shows more items', () => {
    render(<WaveRepOutcome outcome={outcome} distribution={distribution} />);
    expect(screen.queryByText('10 Rep')).toBeNull();

    fireEvent.click(screen.getByRole('button'));
    expect(screen.getByText('10 Rep')).toBeInTheDocument();
    expect(screen.queryByText('40 Rep')).toBeNull();

    fireEvent.click(screen.getByText(/View more/i));
    expect(screen.getByText('40 Rep')).toBeInTheDocument();
  });

  it('shows loading state when fetching next page', () => {
    const loadingDistribution = {
      ...distribution,
      hasNextPage: true,
      isFetchingNextPage: true,
    };
    render(<WaveRepOutcome outcome={outcome} distribution={loadingDistribution} />);

    fireEvent.click(screen.getByRole('button')); // Expand accordion

    const viewMoreBtn = screen.getByRole('button', { name: /loading\.\.\./i });
    expect(viewMoreBtn).toBeInTheDocument();
    expect(viewMoreBtn).toBeDisabled();
    expect(screen.getByText(/1 more/i)).toBeInTheDocument();
  });
});
