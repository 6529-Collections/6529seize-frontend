import { render, screen } from '@testing-library/react';
import LeaderboardInteractionsComponent from '@/components/leaderboard/LeaderboardInteractions';
import { Content, Collector } from '@/components/leaderboard/Leaderboard';

jest.mock('@/components/leaderboard/leaderboard_helpers', () => {
  const original = jest.requireActual('../../../components/leaderboard/leaderboard_helpers');
  return {
    ...original,
    useFetchLeaderboard: jest.fn(),
  };
});

const useFetchLeaderboard = require('@/components/leaderboard/leaderboard_helpers').useFetchLeaderboard as jest.Mock;

const baseProps = {
  block: 1,
  content: Content.ALL,
  collector: Collector.ALL,
  selectedSeason: 1,
  searchWallets: [],
  seasons: [],
  isLoading: false,
  setIsLoading: jest.fn(),
};

function renderComponent(data: any, loading = false) {
  useFetchLeaderboard.mockReturnValue({
    myFetchUrl: '/api',
    totalResults: data ? data.length : 0,
    leaderboard: data,
  });
  render(
    <LeaderboardInteractionsComponent
      {...baseProps}
      isLoading={loading}
    />
  );
}

describe('LeaderboardInteractionsComponent', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('exports a function', () => {
    expect(typeof LeaderboardInteractionsComponent).toBe('function');
  });

  it('renders nothing when leaderboard undefined', () => {
    renderComponent(undefined);
    expect(screen.queryByRole('table')).toBeNull();
  });

  it('shows message when no results and not loading', () => {
    renderComponent([], false);
    expect(screen.getByText('No results found. Change filters and try again.')).toBeInTheDocument();
  });

  it('renders rows for leaderboard data', () => {
    const leaderboard = [
      {
        consolidation_key: '1',
        handle: 'alice',
        consolidation_display: 'Alice',
        pfp_url: '',
        rep_score: 0,
        cic_score: 0,
        primary_wallet: '0x',
        boosted_tdh: 0,
        day_change: 0,
        level: 1,
        primary_purchases_count: 1,
        primary_purchases_value: 1,
        secondary_purchases_count: 2,
        secondary_purchases_value: 3,
        sales_count: 4,
        sales_value: 5,
        transfers_in: 6,
        transfers_out: 7,
        airdrops: 8,
        burns: 9,
      },
    ];
    renderComponent(leaderboard);
    const rows = screen.getAllByRole('row');
    // two header rows plus one data row
    expect(rows).toHaveLength(3);
  });
});
