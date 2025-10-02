import { render, screen } from '@testing-library/react';
import UserPageStatsBoostBreakdown from '@/components/user/stats/UserPageStatsBoostBreakdown';
import { ConsolidatedTDH } from '@/entities/ITDH';

jest.mock('@fortawesome/react-fontawesome', () => ({ FontAwesomeIcon: () => <svg data-testid="icon" /> }));

describe('UserPageStatsBoostBreakdown', () => {
  it('renders nothing when boost breakdown missing', () => {
    const { container } = render(<UserPageStatsBoostBreakdown tdh={undefined} />);
    expect(container.firstChild).toBeNull();
  });

  it('shows table when data provided', () => {
    const tdh: ConsolidatedTDH = {
      boost: 2,
      boost_breakdown: {
        memes_card_sets: { available: 1, acquired: 1, available_info: [], acquired_info: [] },
        gradients: { available: 1, acquired: 1, available_info: [], acquired_info: [] },
      },
    } as any;
    render(<UserPageStatsBoostBreakdown tdh={tdh} />);
    expect(screen.getByText('Boost Breakdown')).toBeInTheDocument();
    expect(screen.getByText('TOTAL BOOST')).toBeInTheDocument();
  });

  it('shows season rows when card sets acquired is zero', () => {
    const tdh: ConsolidatedTDH = {
      boost: 2,
      boost_breakdown: {
        memes_card_sets: { available: 1, acquired: 0, available_info: [], acquired_info: [] },
        memes_szn1: { available: 1, acquired: 1, available_info: [], acquired_info: [] },
        gradients: { available: 0, acquired: 0, available_info: [], acquired_info: [] },
      },
    } as any;
    render(<UserPageStatsBoostBreakdown tdh={tdh} />);
    expect(screen.getByText('SZN1')).toBeInTheDocument();
  });
});
