import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { WaveNICOutcome } from '@/components/waves/outcome/WaveNICOutcome';

jest.mock('framer-motion', () => ({
  motion: {
    svg: (props: any) => <svg {...props} />,
    div: (props: any) => <div {...props} />,
  },
  AnimatePresence: ({ children }: any) => <>{children}</>,
}));

jest.mock('@fortawesome/react-fontawesome', () => ({ FontAwesomeIcon: () => <span data-testid="icon" /> }));

describe('WaveNICOutcome', () => {
  const outcome = {
    amount: 100,
  } as any;
  const distribution = {
    items: [
      { index: 0, amount: 10 },
      { index: 1, amount: 20 },
      { index: 2, amount: 30 },
      { index: 3, amount: 40 },
    ],
    totalCount: 4,
    hasNextPage: false,
    isFetchingNextPage: false,
    fetchNextPage: jest.fn(),
    isLoading: false,
    isError: false,
  } as any;

  it('toggles list visibility and shows more items', () => {
    render(<WaveNICOutcome outcome={outcome} distribution={distribution} />);

    // collapsed initially
    expect(screen.queryByText('10 NIC')).toBeNull();

    fireEvent.click(screen.getByRole('button'));
    // first three amounts shown
    expect(screen.getByText('10 NIC')).toBeInTheDocument();
    expect(screen.queryByText('40 NIC')).toBeNull();

    // click view more
    fireEvent.click(screen.getByText(/View \d+ more/i));
    expect(screen.getByText('40 NIC')).toBeInTheDocument();
  });
});
