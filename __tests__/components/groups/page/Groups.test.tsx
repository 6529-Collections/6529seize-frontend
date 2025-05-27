import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import Groups from '../../../../components/groups/page/Groups';
import { AuthContext } from '../../../../components/auth/Auth';
import React from 'react';

jest.mock('next/router', () => ({ useRouter: () => ({ replace: jest.fn() }) }));

const searchParams = new Map<string, string | null>();
jest.mock('next/navigation', () => ({
  useSearchParams: () => ({ get: (key: string) => searchParams.get(key) ?? null }),
  usePathname: () => '/groups'
}));

jest.mock('../../../../components/groups/page/create/GroupCreate', () => (props: any) => (
  <div data-testid="group-create" {...props} />
));

jest.mock('../../../../components/groups/page/GroupsPageListWrapper', () => (props: any) => (
  <div data-testid="list-wrapper" {...props} />
));

function renderGroups(context: any) {
  return render(
    <AuthContext.Provider value={context}>
      <Groups />
    </AuthContext.Provider>
  );
}

describe('Groups page', () => {
  const baseContext = {
    connectedProfile: { handle: 'alice' },
    activeProfileProxy: null,
    requestAuth: jest.fn().mockResolvedValue({ success: true })
  } as any;

  it('opens create mode when edit param is present', async () => {
    searchParams.set('edit', '123');
    renderGroups(baseContext);
    await screen.findByTestId('group-create');
  });

  it('switches back to list on back button click', async () => {
    searchParams.set('edit', '123');
    const user = userEvent.setup();
    renderGroups(baseContext);
    await screen.findByTestId('group-create');
    await user.click(screen.getByRole('button', { name: /back/i }));
    expect(screen.getByTestId('list-wrapper')).toBeInTheDocument();
  });

  it('shows list when not authenticated', () => {
    searchParams.set('edit', '123');
    renderGroups({ connectedProfile: null, activeProfileProxy: null, requestAuth: jest.fn() });
    expect(screen.getByTestId('list-wrapper')).toBeInTheDocument();
  });
});
