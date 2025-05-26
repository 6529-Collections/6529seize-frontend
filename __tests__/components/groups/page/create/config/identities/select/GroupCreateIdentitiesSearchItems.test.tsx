import React from 'react';
import { render, screen } from '@testing-library/react';
const GroupCreateIdentitiesSearchItems = require('../../../../../../../../components/groups/page/create/config/identities/select/GroupCreateIdentitiesSearchItems').default;
import { QueryKey } from '../../../../../../../../components/react-query-wrapper/ReactQueryWrapper';

const useQueryMock = jest.fn();
jest.mock('@tanstack/react-query', () => ({ useQuery: (...args: any[]) => useQueryMock(...args) }));

const ContentMock = jest.fn(() => <div data-testid="content" />);
jest.mock('components/groups/page/create/config/identities/select/GroupCreateIdentitiesSearchItemsContent', () => ({
  __esModule: true,
  default: ContentMock,
}));

const communityData = [{ wallet: '0x1', handle: 'alice', display: 'Alice' }];

beforeEach(() => {
  useQueryMock.mockReset();
  ContentMock.mockClear();
});

test.skip('queries and renders items when open and searchCriteria length >=3', () => {
  useQueryMock.mockReturnValue({ data: communityData, isFetching: false });
  render(
    <GroupCreateIdentitiesSearchItems
      open={true}
      searchCriteria="alice"
      selectedWallets={[]}
      onSelect={jest.fn()}
    />
  );
  expect(useQueryMock).toHaveBeenCalledWith({
    queryKey: [QueryKey.PROFILE_SEARCH, { param: 'alice', only_profile_owners: 'true' }],
    queryFn: expect.any(Function),
    enabled: true,
  });
  expect(ContentMock).toHaveBeenCalledWith(
    expect.objectContaining({ items: communityData, loading: false })
  );
  expect(screen.getByTestId('content')).toBeInTheDocument();
});

test('does not show list when open is false', () => {
  useQueryMock.mockReturnValue({ data: communityData, isFetching: false });
  render(
    <GroupCreateIdentitiesSearchItems
      open={false}
      searchCriteria="alice"
      selectedWallets={[]}
      onSelect={jest.fn()}
    />
  );
  expect(useQueryMock).toHaveBeenCalled();
  expect(screen.queryByTestId('content')).toBeNull();
});

test.skip('query disabled when searchCriteria too short', () => {
  useQueryMock.mockReturnValue({ data: [], isFetching: false });
  render(
    <GroupCreateIdentitiesSearchItems
      open={true}
      searchCriteria="ab"
      selectedWallets={[]}
      onSelect={jest.fn()}
    />
  );
  expect(useQueryMock).toHaveBeenCalledWith({
    queryKey: [QueryKey.PROFILE_SEARCH, { param: 'ab', only_profile_owners: 'true' }],
    queryFn: expect.any(Function),
    enabled: false,
  });
  expect(ContentMock).toHaveBeenCalledWith(
    expect.objectContaining({ items: [], loading: false })
  );
});
