import React from 'react';
import { render, screen } from '@testing-library/react';
import GroupCardHeader from '@/components/groups/page/list/card/GroupCardHeader';
import { AuthContext } from '@/components/auth/Auth';

jest.mock('@/components/groups/page/list/card/actions/GroupCardEditActions', () => () => <div data-testid="edit" />);
jest.mock('@/helpers/Helpers', () => ({ getTimeAgo: jest.fn(() => '1d') }));
jest.mock('@/helpers/image.helpers', () => ({ getScaledImageUri: (u: string) => u + '?s', ImageScale: { W_AUTO_H_50: 'scale' } }));

const baseGroup: any = {
  created_by: { handle: 'alice', pfp: 'pic.png' },
  created_at: '2023-01-01',
};

function renderComp(opts: { handle?: string | null; activeProxy?: boolean; group?: any } = {}) {
  const { handle = null, activeProxy = false, group = baseGroup } = opts;
  return render(
    <AuthContext.Provider value={{ connectedProfile: handle ? { handle } : null, activeProfileProxy: activeProxy } as any}>
      <GroupCardHeader group={group} onEditClick={jest.fn()} userPlaceholder="u" />
    </AuthContext.Provider>
  );
}

test('shows profile image and link', () => {
  renderComp();
  const img = screen.getByRole('img');
  expect(img).toHaveAttribute('src', 'pic.png?s');
  expect(screen.getByRole('link')).toHaveAttribute('href', '/alice');
  expect(screen.getByText(/1d/i)).toBeInTheDocument();
});

test('renders placeholder when no image', () => {
  renderComp({ group: { created_by: { handle: 'bob' }, created_at: '2023' } });
  expect(screen.queryByRole('img')).toBeNull();
});

test('shows edit actions when connected and not proxied', () => {
  renderComp({ handle: 'me' });
  expect(screen.getByTestId('edit')).toBeInTheDocument();
});

test('hides edit actions when proxy active', () => {
  renderComp({ handle: 'me', activeProxy: true });
  expect(screen.queryByTestId('edit')).toBeNull();
});
