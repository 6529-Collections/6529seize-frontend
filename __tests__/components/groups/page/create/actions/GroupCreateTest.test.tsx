import React from 'react';
import { ApiGroupTdhInclusionStrategy } from '@/generated/models/ApiGroupTdhInclusionStrategy';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import GroupCreateTest from '@/components/groups/page/create/actions/GroupCreateTest';
import { AuthContext } from '@/components/auth/Auth';

const hookState = {
  runTest: jest.fn(),
  isTesting: false,
  submit: jest.fn(),
  validate: jest.fn(),
  updateVisibility: jest.fn(),
  isUpdatingVisibility: false,
};

jest.mock('@/hooks/groups/useGroupMutations', () => ({
  useGroupMutations: () => hookState,
}));

const useQueryMock = jest.fn().mockReturnValue({ isFetching: false, data: undefined });
jest.mock('@tanstack/react-query', () => ({

  useQuery: (...args: any[]) => useQueryMock(...args),
  keepPreviousData: {},
}));

const commonApiFetch = jest.fn();
jest.mock('@/services/api/common-api', () => ({
  commonApiFetch: (...args: any[]) => commonApiFetch(...args),
}));

const defaultGroupConfig = {
  name: 'My Group',
  group: {
    identity_addresses: [],
    excluded_identity_addresses: [],
    owns_nfts: [],
    tdh: { min: null, max: null, inclusion_strategy: ApiGroupTdhInclusionStrategy.Tdh },
    rep: { min: null, max: null, user_identity: null, category: null, direction: null },
    cic: { min: null, max: null, user_identity: null, direction: null },
    level: { min: null, max: null },
  },
};

beforeEach(() => {
  jest.clearAllMocks();
  hookState.runTest.mockReset();
  hookState.isTesting = false;
});

function renderComponent(props?: Partial<React.ComponentProps<typeof GroupCreateTest>>) {
  const auth = {
    requestAuth: jest.fn().mockResolvedValue({ success: true }),
    setToast: jest.fn(),
    connectedProfile: { handle: 'alice' },
  } as any;

  render(
    <AuthContext.Provider value={auth}>
      <GroupCreateTest groupConfig={defaultGroupConfig as any} disabled={false} {...props} />
    </AuthContext.Provider>
  );

  return { auth };
}

it('disables button when disabled prop true', () => {
  render(
    <AuthContext.Provider value={{} as any}>
      <GroupCreateTest groupConfig={defaultGroupConfig as any} disabled />
    </AuthContext.Provider>
  );

  expect(screen.getByRole('button', { name: 'Test' })).toBeDisabled();
});

it('calls runTest with payload and fallback name', async () => {
  hookState.runTest.mockResolvedValueOnce({ ok: true, group: { id: '123' } });
  const customConfig = {
    ...defaultGroupConfig,
    name: '',
  };

  renderComponent({ groupConfig: customConfig as any });

  await fireEvent.click(screen.getByRole('button', { name: 'Test' }));

  await waitFor(() => expect(hookState.runTest).toHaveBeenCalledTimes(1));
  expect(hookState.runTest).toHaveBeenCalledWith({
    payload: customConfig,
    nameFallback: 'alice Test Run',
  });
});

it('shows toast when runTest fails with api error', async () => {
  hookState.runTest.mockResolvedValueOnce({
    ok: false,
    reason: 'api',
    error: 'failed',
  });

  const { auth } = renderComponent();

  await fireEvent.click(screen.getByRole('button', { name: 'Test' }));

  await waitFor(() => expect(hookState.runTest).toHaveBeenCalled());
  expect(auth.setToast).toHaveBeenCalledWith({ message: 'failed', type: 'error' });
});
