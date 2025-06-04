import { render } from '@testing-library/react';
import UserPageFollowers from '../../../../components/user/followers/UserPageFollowers';
import { ApiIdentity } from '../../../../generated/models/ApiIdentity';

let wrapperProps: any;
const fetchNextPage = jest.fn();

jest.mock('@tanstack/react-query', () => ({
  useInfiniteQuery: jest.fn(),
}));

jest.mock('../../../../components/utils/followers/FollowersListWrapper', () => (props: any) => { wrapperProps = props; return <div data-testid="wrapper" />; });

const { useInfiniteQuery } = require('@tanstack/react-query');

describe('UserPageFollowers', () => {
  beforeEach(() => {
    wrapperProps = null;
    fetchNextPage.mockReset();
  });

  function renderComponent(count: number) {
    (useInfiniteQuery as jest.Mock).mockReturnValue({
      data: { pages: [{ data: Array.from({ length: count }) }] },
      fetchNextPage,
      hasNextPage: true,
      isFetching: false,
      isFetchingNextPage: false,
      status: 'success',
    });
    render(<UserPageFollowers profile={{ id: '1' } as ApiIdentity} />);
  }

  it('fetches next page when bottom reached with enough followers', () => {
    renderComponent(100);
    wrapperProps.onBottomIntersection(true);
    expect(fetchNextPage).toHaveBeenCalled();
  });

  it('does not fetch next page when not enough followers', () => {
    renderComponent(1);
    wrapperProps.onBottomIntersection(true);
    expect(fetchNextPage).not.toHaveBeenCalled();
  });
});
