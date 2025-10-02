import { render, screen } from '@testing-library/react';
import { WaveLeaderboardRightSidebarActivityLogs } from '@/components/waves/leaderboard/sidebar/WaveLeaderboardRightSidebarActivityLogs';
import { ApiWave } from '@/generated/models/ApiWave';
import { useAuth } from '@/components/auth/Auth';

const hook = jest.fn();
let intersectionCb: any;

jest.mock('@/hooks/useWaveActivityLogs', () => ({
  useWaveActivityLogs: (...args: any[]) => hook(...args),
}));

jest.mock('@/hooks/useIntersectionObserver', () => ({
  useIntersectionObserver: (cb: any) => {
    intersectionCb = cb;
    return { current: null };
  },
}));

jest.mock('@/components/waves/leaderboard/sidebar/WaveLeaderboardRightSidebarActivityLog', () => ({
  WaveLeaderboardRightSidebarActivityLog: (props: any) => <div data-testid="log" >{props.log.id}</div>,
}));

jest.mock('@/components/auth/Auth', () => ({
  useAuth: jest.fn(),
}));

(useAuth as jest.Mock).mockReturnValue({ connectedProfile: null });

describe('WaveLeaderboardRightSidebarActivityLogs', () => {
  const wave = { id: '1', voting: { credit_type: 'REP' } } as unknown as ApiWave;

  it('shows placeholder when no logs', () => {
    hook.mockReturnValue({ logs: [], isFetchingNextPage: false, fetchNextPage: jest.fn(), hasNextPage: false, isLoading: false });
    render(<WaveLeaderboardRightSidebarActivityLogs wave={wave} onDropClick={jest.fn()} />);
    expect(screen.getByText('Be the First to Make a Vote')).toBeInTheDocument();
  });

  it('fetches next page on intersection', () => {
    const fetchNextPage = jest.fn();
    hook.mockReturnValue({ logs: [{ id: 'a' }], isFetchingNextPage: false, fetchNextPage, hasNextPage: true, isLoading: false });
    render(<WaveLeaderboardRightSidebarActivityLogs wave={wave} onDropClick={jest.fn()} />);
    expect(screen.getByTestId('log')).toHaveTextContent('a');
    intersectionCb();
    expect(fetchNextPage).toHaveBeenCalled();
  });
});
