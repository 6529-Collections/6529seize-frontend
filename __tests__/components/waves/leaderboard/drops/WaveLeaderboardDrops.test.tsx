import { render, screen } from '@testing-library/react';
import React from 'react';
import { WaveLeaderboardDrops } from '@/components/waves/leaderboard/drops/WaveLeaderboardDrops';
import { AuthContext } from '@/components/auth/Auth';
import { ApiWave } from '@/generated/models/ApiWave';
import { WaveDropsLeaderboardSort } from '@/hooks/useWaveDropsLeaderboard';

const hook = jest.fn();
let intersectionCb: any;

jest.mock('@/hooks/useWaveDropsLeaderboard', () => {
  const actual = jest.requireActual('../../../../../hooks/useWaveDropsLeaderboard');
  return { __esModule: true, ...actual, useWaveDropsLeaderboard: (...args: any[]) => hook(...args) };
});

jest.mock('@/hooks/useIntersectionObserver', () => ({
  useIntersectionObserver: (cb: any) => { intersectionCb = cb; return { current: null }; }
}));

jest.mock('@/components/waves/leaderboard/drops/WaveLeaderboardDrop', () => ({ WaveLeaderboardDrop: (props: any) => <div data-testid="drop">{props.drop.id}</div> }));
jest.mock('@/components/waves/leaderboard/drops/WaveLeaderboardEmptyState', () => ({ WaveLeaderboardEmptyState: (props: any) => <div data-testid="empty" onClick={props.onCreateDrop} /> }));
jest.mock('@/components/waves/leaderboard/drops/WaveLeaderboardLoading', () => ({ WaveLeaderboardLoading: () => <div data-testid="loading" /> }));
jest.mock('@/components/waves/leaderboard/drops/WaveLeaderboardLoadingBar', () => ({ WaveLeaderboardLoadingBar: () => <div data-testid="bar" /> }));
jest.mock('next/navigation', () => ({
  useRouter: () => ({ push: jest.fn() }),
  usePathname: () => '/p',
  useSearchParams: () => ({ toString: () => '', get: () => null }),
}));

const wave = { id: 'w1' } as ApiWave;

const renderComp = (hookReturn: any) => {
  hook.mockReturnValue(hookReturn);
  return render(
    <AuthContext.Provider value={{ connectedProfile: null } as any}>
      <WaveLeaderboardDrops wave={wave} sort={WaveDropsLeaderboardSort.RANK} onCreateDrop={jest.fn()} />
    </AuthContext.Provider>
  );
};

describe('WaveLeaderboardDrops', () => {
  it('shows loading when fetching and empty', () => {
    renderComp({ drops: [], isFetching: true, isFetchingNextPage: false, fetchNextPage: jest.fn(), hasNextPage: false });
    expect(screen.getByTestId('loading')).toBeInTheDocument();
  });

  it('shows empty state when no drops', () => {
    renderComp({ drops: [], isFetching: false, isFetchingNextPage: false, fetchNextPage: jest.fn(), hasNextPage: false });
    expect(screen.getByTestId('empty')).toBeInTheDocument();
  });

  it('renders drops and loads next page on intersection', () => {
    const fetchNextPage = jest.fn();
    renderComp({ drops: [{ id: 'd1' }], isFetching: false, isFetchingNextPage: false, fetchNextPage, hasNextPage: true });
    expect(screen.getByText('d1')).toBeInTheDocument();
    intersectionCb();
    expect(fetchNextPage).toHaveBeenCalled();
  });
});

