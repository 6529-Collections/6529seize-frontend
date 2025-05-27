import { render, act } from '@testing-library/react';
import UserPageGroups from '../../../../components/user/groups/UserPageGroups';
import { AuthContext } from '../../../../components/auth/Auth';
import { useRouter } from 'next/router';

let routerPush = jest.fn();
let capturedProps: any = null;

jest.mock('../../../../components/groups/page/list/GroupsList', () => (props: any) => {
  capturedProps = props;
  return <div data-testid="list" />;
});

jest.mock('next/router', () => ({ useRouter: jest.fn() }));

const { useRouter: useRouterMock } = jest.requireMock('next/router');

function renderComponent(context: any, profile: any) {
  routerPush = jest.fn();
  useRouterMock.mockReturnValue({ push: routerPush });
  return render(
    <AuthContext.Provider value={context}>
      <UserPageGroups profile={profile} />
    </AuthContext.Provider>
  );
}

describe('UserPageGroups', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    capturedProps = null;
  });

  it('determines visibility of create button based on context', () => {
    renderComponent(
      { connectedProfile: { handle: 'alice' }, activeProfileProxy: null, requestAuth: jest.fn() },
      { handle: 'alice' }
    );
    expect(capturedProps.showCreateNewGroupButton).toBe(true);

    renderComponent(
      { connectedProfile: { handle: 'alice' }, activeProfileProxy: { id: 1 }, requestAuth: jest.fn() },
      { handle: 'alice' }
    );
    expect(capturedProps.showCreateNewGroupButton).toBe(false);
  });

  it('updates filters when callbacks invoked', () => {
    renderComponent(
      { connectedProfile: { handle: 'bob' }, activeProfileProxy: null, requestAuth: jest.fn() },
      { handle: 'bob' }
    );
    expect(capturedProps.filters).toEqual({ group_name: null, author_identity: 'bob' });

    act(() => capturedProps.setGroupName('group'));
    expect(capturedProps.filters.group_name).toBe('group');

    act(() => capturedProps.setAuthorIdentity('alice'));
    expect(capturedProps.filters.author_identity).toBe('alice');
  });

  it('navigates to create page after successful auth', async () => {
    const requestAuth = jest.fn().mockResolvedValue({ success: true });
    renderComponent(
      { connectedProfile: { handle: 'bob' }, activeProfileProxy: null, requestAuth },
      { handle: 'bob' }
    );

    await act(async () => {
      await capturedProps.onCreateNewGroup();
    });
    expect(requestAuth).toHaveBeenCalled();
    expect(routerPush).toHaveBeenCalledWith('/network/groups?edit=new');
  });
});
