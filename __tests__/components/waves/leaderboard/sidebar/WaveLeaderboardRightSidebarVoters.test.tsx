import { render, screen } from '@testing-library/react';
import { WaveLeaderboardRightSidebarVoters } from '@/components/waves/leaderboard/sidebar/WaveLeaderboardRightSidebarVoters';
import { ApiWave } from '@/generated/models/ObjectSerializer';
import { useAuth } from '@/components/auth/Auth';
import { useWaveTopVoters } from '@/hooks/useWaveTopVoters';
import { useIntersectionObserver } from '@/hooks/useIntersectionObserver';

jest.mock('@/components/auth/Auth', () => ({ useAuth: jest.fn() }));
jest.mock('@/hooks/useWaveTopVoters');
jest.mock('@/hooks/useIntersectionObserver');
jest.mock('@/components/waves/leaderboard/sidebar/WaveLeaderboardRightSidebarVoter', () => ({
  WaveLeaderboardRightSidebarVoter: (props: any) => <div data-testid="voter">{props.voter.voter.handle}</div>
}));

const mockTopVoters = useWaveTopVoters as jest.Mock;
const mockIntersection = useIntersectionObserver as jest.Mock;
(useAuth as jest.Mock).mockReturnValue({ connectedProfile: null });

let intersectionCb: any;
mockIntersection.mockImplementation((cb: any) => { intersectionCb = cb; return { current: null }; });

describe('WaveLeaderboardRightSidebarVoters', () => {
  const wave = { id: '1', voting: { credit_type: 'REP' } } as unknown as ApiWave;

  it('shows placeholder when no voters', () => {
    mockTopVoters.mockReturnValue({ voters: [], isFetchingNextPage: false, fetchNextPage: jest.fn(), hasNextPage: false, isLoading: false });
    render(<WaveLeaderboardRightSidebarVoters wave={wave} />);
    expect(screen.getByText('Be the First to Make a Vote')).toBeInTheDocument();
  });

  it('fetches next page on intersection', () => {
    const fetchNextPage = jest.fn();
    mockTopVoters.mockReturnValue({ voters: [{ voter: { handle: 'alice' } }], isFetchingNextPage: false, fetchNextPage, hasNextPage: true, isLoading: false });
    render(<WaveLeaderboardRightSidebarVoters wave={wave} />);
    expect(screen.getByTestId('voter')).toHaveTextContent('alice');
    intersectionCb();
    expect(fetchNextPage).toHaveBeenCalled();
  });
});
