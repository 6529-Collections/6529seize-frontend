import React from 'react';
import { render } from '@testing-library/react';
import GroupsList from '@/components/groups/page/list/GroupsList';
import { ApiGroupFull } from '@/generated/models/ApiGroupFull';

let wrapperProps: any = null;
let searchProps: any = null;
let cardProps: any[] = [];
const fetchNextPage = jest.fn();

jest.mock('@tanstack/react-query', () => ({
  useInfiniteQuery: jest.fn(),
  keepPreviousData: 'keepPreviousData'
}));

jest.mock('react-use', () => ({
  useDebounce: (fn: any, _delay: number, deps: any[]) => React.useEffect(fn, deps),
}));

jest.mock('@/components/utils/infinite-scroll/CommonInfiniteScrollWrapper', () => (props: any) => { wrapperProps = props; return <div data-testid="wrapper">{props.children}</div>; });

jest.mock('@/components/groups/page/list/search/GroupsListSearch', () => (props: any) => { searchProps = props; return <div data-testid="search"/>; });

jest.mock('@/components/groups/page/list/card/GroupCard', () => (props: any) => { cardProps.push(props); return <div data-testid={`card-${props.group.id}`}/>; });

const { useInfiniteQuery } = jest.requireMock('@tanstack/react-query');

describe('GroupsList', () => {
  beforeEach(() => {
    wrapperProps = null;
    searchProps = null;
    cardProps = [];
    fetchNextPage.mockReset();
  });

  function renderComponent(groups: ApiGroupFull[]) {
    (useInfiniteQuery as jest.Mock).mockReturnValue({
      data: { pages: [groups] },
      fetchNextPage,
      hasNextPage: true,
      isFetching: false,
      isFetchingNextPage: false,
      status: 'success',
    });
    render(
      <GroupsList
        filters={{ group_name: null, author_identity: null }}
        showIdentitySearch={true}
        showCreateNewGroupButton={false}
        showMyGroupsButton={false}
        onCreateNewGroup={jest.fn()}
        setGroupName={jest.fn()}
        setAuthorIdentity={jest.fn()}
        onMyGroups={jest.fn()}
      />
    );
  }

  it('fetches next page when bottom reached with enough groups', () => {
    const groups = Array.from({ length: 21 }, (_, i) => ({ id: `${i}`, created_at: i } as ApiGroupFull));
    renderComponent(groups);
    expect(cardProps).toHaveLength(21);
    wrapperProps.onBottomIntersection(true);
    expect(fetchNextPage).toHaveBeenCalled();
  });

  it('does not fetch next page when not enough groups', () => {
    const groups = [{ id: '1', created_at: 1 } as ApiGroupFull];
    renderComponent(groups);
    wrapperProps.onBottomIntersection(true);
    expect(fetchNextPage).not.toHaveBeenCalled();
  });
});
