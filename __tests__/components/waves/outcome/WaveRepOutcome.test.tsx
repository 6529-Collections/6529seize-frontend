import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { WaveRepOutcome } from '../../../../components/waves/outcome/WaveRepOutcome';

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
    distribution: [{ amount: 10 }, { amount: 20 }, { amount: 30 }, { amount: 40 }],
    amount: 100,
    rep_category: 'rep',
  } as any;

  it('expands list and shows more items', () => {
    render(<WaveRepOutcome outcome={outcome} />);
    expect(screen.queryByText('10 Rep')).toBeNull();

    fireEvent.click(screen.getByRole('button'));
    expect(screen.getByText('10 Rep')).toBeInTheDocument();
    expect(screen.queryByText('40 Rep')).toBeNull();

    fireEvent.click(screen.getByText(/View more/i));
    expect(screen.getByText('40 Rep')).toBeInTheDocument();
  });
});
