import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import WavesListWrapper from '../../../../components/waves/list/WavesListWrapper';
import { AuthContext } from '../../../../components/auth/Auth';
import { ApiWavesOverviewType } from '../../../../generated/models/ApiWavesOverviewType';

jest.mock('../../../../components/waves/list/WaveItem', () => (props: any) => <div data-testid="wave">{props.wave.id}</div>);
jest.mock('../../../../components/distribution-plan-tool/common/CircleLoader', () => ({ CircleLoaderSize: { XXLARGE: 'xx' }, default: () => <div data-testid="loader" /> }));
jest.mock('../../../../components/utils/CommonIntersectionElement', () => (props: any) => <div data-testid="intersect" onClick={() => props.onIntersection(true)} />);

const defaultQuery = { data: { pages: [[{ id: 'w1' }, { id: 'w2' }, { id: 'w3' }]] }, fetchNextPage: jest.fn(), hasNextPage: false, isFetching: false, isFetchingNextPage: false, status: 'success' };
const useInfiniteQueryMock = jest.fn().mockReturnValue(defaultQuery);
jest.mock('@tanstack/react-query', () => {
  const actual = jest.requireActual('@tanstack/react-query');
  return { ...actual, useInfiniteQuery: (...args: any[]) => useInfiniteQueryMock(...args) };
});

const auth = { connectedProfile: { handle: 'alice' }, activeProfileProxy: null } as any;

describe('WavesListWrapper', () => {
  beforeEach(() => {
    useInfiniteQueryMock.mockReset();
    useInfiniteQueryMock.mockReturnValue(defaultQuery);
  });

  it('toggles show all button', async () => {
    const setShowAll = jest.fn();
    render(
      <AuthContext.Provider value={auth}>
        <WavesListWrapper overviewType={ApiWavesOverviewType.Latest} showAllType={null} setShowAllType={setShowAll} />
      </AuthContext.Provider>
    );
    const btn = screen.getByRole('button');
    expect(btn).toHaveTextContent('Show all');
    await userEvent.click(btn);
    expect(setShowAll).toHaveBeenCalledWith(ApiWavesOverviewType.Latest);
  });

  it('fetches next page on intersection when conditions met', async () => {
    const waves = Array.from({length:12}, (_,i)=>({id:`w${i}`}));
    const query = { data:{pages:[waves]}, fetchNextPage: jest.fn(), hasNextPage: true, isFetching:false, isFetchingNextPage:false, status:'success' };
    useInfiniteQueryMock.mockReturnValue(query);
    render(
      <AuthContext.Provider value={auth}>
        <WavesListWrapper overviewType={ApiWavesOverviewType.Latest} showAllType={ApiWavesOverviewType.Latest} setShowAllType={() => {}} />
      </AuthContext.Provider>
    );
    await userEvent.click(screen.getByTestId('intersect'));
    expect(query.fetchNextPage).toHaveBeenCalled();
  });
});
