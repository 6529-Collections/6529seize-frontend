import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import ProxyCreateTargetSearch from '../../../../../../components/user/proxy/create/target/ProxyCreateTargetSearch';
import { AuthContext } from '../../../../../../components/auth/Auth';
import { useQuery } from '@tanstack/react-query';

jest.mock('@tanstack/react-query', () => ({ useQuery: jest.fn() }));

jest.mock('react-use', () => ({
  useDebounce: (fn: () => void, _delay: number, deps: any[]) => React.useEffect(fn, deps),
  useClickAway: jest.fn(),
  useKeyPressEvent: jest.fn(),
}));

// Mock ResizeObserver
global.ResizeObserver = jest.fn().mockImplementation(() => ({
  observe: jest.fn(),
  unobserve: jest.fn(),
  disconnect: jest.fn(),
}));

const useQueryMock = useQuery as jest.Mock;

describe('ProxyCreateTargetSearch', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    useQueryMock.mockReturnValue({ data: undefined, isLoading: false, error: null });
  });

  function renderWithContext(props: any) {
    return render(
      <AuthContext.Provider value={{ connectedProfile: { handle: 'alice' } } as any}>
        <ProxyCreateTargetSearch {...props} />
      </AuthContext.Provider>
    );
  }

  it('shows selected profile and allows clearing', async () => {
    const onTargetSelect = jest.fn();
    const profileProxy = { granted_to: { handle: 'bob', pfp: 'b.png' } } as any;
    const user = userEvent.setup();
    renderWithContext({ profileProxy, loading: false, onTargetSelect });
    expect(screen.getByText('bob')).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Remove selected profile' }));
    expect(onTargetSelect).toHaveBeenCalledWith(null);
  });

  it('lists search results and selects a profile', async () => {
    const profiles = [{ handle: 'bob' }, { handle: 'carol' }];
    useQueryMock.mockReturnValue({ data: profiles, isLoading: false, error: null });
    const onTargetSelect = jest.fn();
    const user = userEvent.setup();
    renderWithContext({ profileProxy: null, loading: false, onTargetSelect });

    await user.type(screen.getByPlaceholderText('Search profile'), 'bob');
    expect(screen.getByRole('option', { name: 'bob' })).toBeInTheDocument();
    await user.click(screen.getByRole('option', { name: 'bob' }));
    expect(onTargetSelect).toHaveBeenCalledWith(profiles[0]);
  });
});
