import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { WaveNICOutcome } from '../../../../components/waves/outcome/WaveNICOutcome';

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
    distribution: [
      { amount: 10 },
      { amount: 20 },
      { amount: 30 },
      { amount: 40 },
    ],
    amount: 100,
  } as any;

  it('toggles list visibility and shows more items', () => {
    render(<WaveNICOutcome outcome={outcome} />);

    // collapsed initially
    expect(screen.queryByText('10 NIC')).toBeNull();

    fireEvent.click(screen.getByRole('button'));
    // first three amounts shown
    expect(screen.getByText('10 NIC')).toBeInTheDocument();
    expect(screen.queryByText('40 NIC')).toBeNull();

    // click view more
    fireEvent.click(screen.getByText(/View more/i));
    expect(screen.getByText('40 NIC')).toBeInTheDocument();
  });
});
