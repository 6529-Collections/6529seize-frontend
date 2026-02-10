import { render, screen } from '@testing-library/react';
import { WaveSmallLeaderboard } from '@/components/waves/small-leaderboard/WaveSmallLeaderboard';
import { AuthContext } from '@/components/auth/Auth';

const mockHook = jest.fn();
const mockDrop = jest.fn(() => <div data-testid="drop" />);
const mockIntersection = jest.fn(() => ({ current: null }));

jest.mock('@/hooks/useWaveDropsLeaderboard', () => ({
  useWaveDropsLeaderboard: (...args: any) => mockHook(...args),
}));

jest.mock('@/hooks/useIntersectionObserver', () => ({
  useIntersectionObserver: () => mockIntersection(),
}));

jest.mock('@/components/waves/small-leaderboard/WaveSmallLeaderboardDrop', () => ({
  WaveSmallLeaderboardDrop: (props: any) => mockDrop(props),
}));

const wave = { id: '1' } as any;

function renderComp(hookReturn: any) {
  mockHook.mockReturnValue(hookReturn);
  return render(
    <AuthContext.Provider value={{ connectedProfile: null } as any}>
      <WaveSmallLeaderboard wave={wave} onDropClick={jest.fn()} />
    </AuthContext.Provider>
  );
}

describe('WaveSmallLeaderboard', () => {
  it('shows placeholder when no drops', () => {
    renderComp({ drops: [], fetchNextPage: jest.fn(), hasNextPage: false, isFetching: false, isFetchingNextPage: false });
    expect(screen.getByText('No drops have been made yet in this wave')).toBeInTheDocument();
    expect(mockDrop).not.toHaveBeenCalled();
  });

  it('renders drops when available', () => {
    renderComp({ drops: [{ id: 1 }, { id: 2 }], fetchNextPage: jest.fn(), hasNextPage: false, isFetching: false, isFetchingNextPage: false });
    expect(screen.getAllByTestId('drop').length).toBe(2);
  });
});
