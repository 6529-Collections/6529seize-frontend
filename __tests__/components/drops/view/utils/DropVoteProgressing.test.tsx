import { render, screen } from '@testing-library/react';
import DropVoteProgressing from '../../../../../components/drops/view/utils/DropVoteProgressing';
import React from 'react';

// Mock ResizeObserver
global.ResizeObserver = jest.fn().mockImplementation(() => ({
  observe: jest.fn(),
  unobserve: jest.fn(),
  disconnect: jest.fn(),
}));

// Mock react-tooltip
jest.mock('react-tooltip', () => ({
  Tooltip: ({ children, id }: any) => (
    <div data-testid={`tooltip-${id}`} role="tooltip">
      {children}
    </div>
  ),
}));
jest.mock('@fortawesome/react-fontawesome', () => ({ FontAwesomeIcon: () => <svg data-testid="icon" /> }));
jest.mock('../../../../../helpers/Helpers', () => ({ formatNumberWithCommas: (n: number) => String(n) }));

describe('DropVoteProgressing', () => {
  it('returns null when invalid values', () => {
    const { container } = render(<DropVoteProgressing current={null as any} projected={5} />);
    expect(container.firstChild).toBeNull();
  });

  it('shows projection with positive change', () => {
    render(<DropVoteProgressing current={1} projected={2} />);
    const span = screen.getByText('2');
    expect(span.parentElement?.className).toContain('tw-text-emerald-400');
    expect(screen.getByTestId('icon')).toBeInTheDocument();
  });

  it('uses subtle styling when subtle prop set', () => {
    render(<DropVoteProgressing current={2} projected={1} subtle />);
    const span = screen.getByText('1');
    expect(span.parentElement?.className).toContain('tw-text-iron-400');
  });
});
