import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { SingleWaveDropVoters } from '../../../../components/waves/drop/SingleWaveDropVoters';
import { useWaveTopVoters } from '../../../../hooks/useWaveTopVoters';
import { useAuth } from '../../../../components/auth/Auth';

let intersectionCb: any;

jest.mock('../../../../hooks/useWaveTopVoters');
jest.mock('../../../../components/auth/Auth', () => ({ useAuth: jest.fn() }));
jest.mock('../../../../hooks/useIntersectionObserver', () => ({
  useIntersectionObserver: (cb: any) => {
    intersectionCb = cb;
    return { current: null };
  },
}));
jest.mock('../../../../components/waves/drop/SingleWaveDropVoter', () => ({
  SingleWaveDropVoter: (props: any) => <div data-testid="voter">{props.voter.voter.id}</div>,
}));

const useVoters = useWaveTopVoters as jest.Mock;
const useAuthMock = useAuth as jest.Mock;

const baseDrop = { id: 'd', wave: { id: 'w', voting_credit_type: 'REP' } } as any;

describe('SingleWaveDropVoters', () => {
  beforeEach(() => {
    useAuthMock.mockReturnValue({ connectedProfile: null });
  });

  it('shows placeholder when no voters', async () => {
    const user = userEvent.setup();
    useVoters.mockReturnValue({ voters: [], isFetchingNextPage: false, fetchNextPage: jest.fn(), hasNextPage: false, isLoading: false });
    render(<SingleWaveDropVoters drop={baseDrop} />);
    await user.click(screen.getByRole('button'));
    expect(screen.getByText('Be the First to Make a Vote')).toBeInTheDocument();
  });

  it('fetches next page on intersection', async () => {
    const user = userEvent.setup();
    const fetchNextPage = jest.fn();
    useVoters.mockReturnValue({ voters: [{ voter: { id: 'v1' } }], isFetchingNextPage: false, fetchNextPage, hasNextPage: true, isLoading: false });
    render(<SingleWaveDropVoters drop={baseDrop} />);
    await user.click(screen.getByRole('button'));
    expect(screen.getByTestId('voter')).toHaveTextContent('v1');
    intersectionCb();
    expect(fetchNextPage).toHaveBeenCalled();
  });
});
