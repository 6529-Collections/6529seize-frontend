import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import GroupsSelectActiveGroup from '../../../../components/groups/select/GroupsSelectActiveGroup';
import { useQuery } from '@tanstack/react-query';
import { useDispatch } from 'react-redux';
import { QueryKey } from '../../../../components/react-query-wrapper/ReactQueryWrapper';

jest.mock('@tanstack/react-query', () => ({
  useQuery: jest.fn(),
  keepPreviousData: 'keepPreviousData'
}));

jest.mock('react-redux', () => ({
  useDispatch: jest.fn()
}));

let capturedProps: any = null;
jest.mock('../../../../components/groups/select/item/GroupItem', () => (props: any) => {
  capturedProps = props;
  return <div data-testid="group-item" onClick={() => props.onActiveGroupId('new-id')} />;
});

const { useQuery: useQueryMock } = jest.requireMock('@tanstack/react-query');
const { useDispatch: useDispatchMock } = jest.requireMock('react-redux');

function renderComponent(activeId: string) {
  capturedProps = null;
  const dispatch = jest.fn();
  useDispatchMock.mockReturnValue(dispatch);
  return { dispatch, ...render(<GroupsSelectActiveGroup activeGroupId={activeId} />) };
}

describe('GroupsSelectActiveGroup', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('shows loading text when group data is not loaded', () => {
    (useQueryMock as jest.Mock).mockImplementation(() => ({ data: null }));

    renderComponent('1');

    expect(screen.getByText('Loading...')).toBeInTheDocument();
    expect(capturedProps).toBeNull();
  });

  it('renders members count and dispatches on item click', async () => {
    const groupData = { id: '1', name: 'Group', created_at: 0, created_by: { handle: 'bob' }, group: {}, visible: true, is_private: false } as any;
    (useQueryMock as jest.Mock).mockImplementation(({ queryKey }) => {
      if (queryKey[0] === QueryKey.GROUP) {
        return { data: groupData };
      }
      if (queryKey[0] === QueryKey.COMMUNITY_MEMBERS_TOP) {
        return { data: { count: 3 } };
      }
      return { data: null };
    });

    const { dispatch } = renderComponent('1');

    await waitFor(() => expect(screen.getByText(/Members:/)).toBeInTheDocument());
    expect(capturedProps.group).toEqual(groupData);

    const user = userEvent.setup();
    await user.click(screen.getByTestId('group-item'));
    expect(dispatch).toHaveBeenCalledWith({ type: 'group/setActiveGroupId', payload: 'new-id' });
  });
});
