import { render, screen } from '@testing-library/react';
import UserPageStatsActivityTDHHistory from '../../../../../../components/user/stats/activity/tdh-history/UserPageStatsActivityTDHHistory';
import { useQuery } from '@tanstack/react-query';

jest.mock('@tanstack/react-query');

jest.mock('../../../../../../components/user/stats/activity/tdh-history/UserPageStatsActivityTDHHistoryCharts', () => ({ __esModule: true, default: () => <div data-testid="charts" /> }));
jest.mock('../../../../../../components/utils/animation/CommonCardSkeleton', () => ({ __esModule: true, default: () => <div data-testid="skeleton" /> }));

describe('UserPageStatsActivityTDHHistory', () => {
  const mockUseQuery = useQuery as jest.Mock;
  const profile = { consolidation_key: 'key' } as any;

  it('shows skeleton while fetching', () => {
    mockUseQuery.mockReturnValue({ isFetching: true, data: undefined });
    render(<UserPageStatsActivityTDHHistory profile={profile} />);
    expect(screen.getByTestId('skeleton')).toBeInTheDocument();
  });

  it('renders charts when data available', () => {
    mockUseQuery.mockReturnValue({ isFetching: false, data: [{}] });
    render(<UserPageStatsActivityTDHHistory profile={profile} />);
    expect(screen.getByTestId('charts')).toBeInTheDocument();
  });

  it('renders fallback when no data', () => {
    mockUseQuery.mockReturnValue({ isFetching: false, data: [] });
    render(<UserPageStatsActivityTDHHistory profile={profile} />);
    expect(screen.getByText('No TDH history found')).toBeInTheDocument();
  });
});
