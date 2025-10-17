import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import GroupCreateActions from '@/components/groups/page/create/actions/GroupCreateActions';
import { AuthContext } from '@/components/auth/Auth';
import { ReactQueryWrapperContext } from '@/components/react-query-wrapper/ReactQueryWrapper';

jest.mock('@/components/groups/page/create/actions/GroupCreateTest', () => () => <div data-testid="test" />);
jest.mock('@/components/distribution-plan-tool/common/CircleLoader', () => () => <div data-testid="loader" />);

const mockSubmit = jest.fn();
const mockValidate = jest.fn();
jest.mock('@/hooks/groups/useGroupMutations', () => ({
  useGroupMutations: () => ({
    validate: mockValidate,
    submit: mockSubmit,
    runTest: jest.fn(),
    isSubmitting: false,
    isTesting: false,
    updateVisibility: jest.fn(),
    isUpdatingVisibility: false,
  }),
}));

const defaultGroup = {
  name: '',
  group: {
    tdh: { min: null, max: null },
    rep: { min: null, max: null, user_identity: null, category: null, direction: null },
    cic: { min: null, max: null, user_identity: null, direction: null },
    level: { min: null, max: null },
    owns_nfts: [],
    identity_addresses: [],
    excluded_identity_addresses: [],
  },
};

function renderActions(props?: Partial<React.ComponentProps<typeof GroupCreateActions>>) {
  const auth = {
    requestAuth: jest.fn().mockResolvedValue({ success: true }),
    setToast: jest.fn(),
    connectedProfile: { handle: 'alice' },
  } as any;
  const queryCtx = { onGroupCreate: jest.fn() } as any;
  const onCompleted = jest.fn();
  render(
    <AuthContext.Provider value={auth}>
      <ReactQueryWrapperContext.Provider value={queryCtx}>
        <GroupCreateActions
          originalGroup={null}
          groupConfig={defaultGroup as any}
          onCompleted={onCompleted}
          {...props}
        />
      </ReactQueryWrapperContext.Provider>
    </AuthContext.Provider>
  );
  return { auth, queryCtx, onCompleted };
}

beforeEach(() => {
  jest.clearAllMocks();
  mockSubmit.mockReset();
  mockValidate.mockReset();
});

it('disables create button when no filters selected', () => {
  mockValidate.mockReturnValue({ valid: false, issues: [] });
  renderActions();
  expect(screen.getByRole('button', { name: 'Create' })).toBeDisabled();
});

it('creates group and marks visible on save', async () => {
  const groupConfig = {
    ...defaultGroup,
    name: 'New Group',
    group: { ...defaultGroup.group, identity_addresses: ['0x1'] },
  };
  const originalGroup = { id: 'old', created_by: { handle: 'Alice' } } as any;
  mockValidate.mockReturnValue({ valid: true, issues: [] });
  mockSubmit.mockResolvedValueOnce({ ok: true, group: { id: '123' }, published: true });

  const { auth, queryCtx, onCompleted } = renderActions({ groupConfig, originalGroup });

  await userEvent.click(screen.getByRole('button', { name: 'Create' }));

  await waitFor(() => expect(mockSubmit).toHaveBeenCalledTimes(1));
  expect(mockSubmit).toHaveBeenCalledWith({
    payload: groupConfig,
    previousGroup: originalGroup,
    currentHandle: 'alice',
  });
  expect(auth.setToast).toHaveBeenCalledWith({ message: 'Group created.', type: 'success' });
  expect(onCompleted).toHaveBeenCalled();
});
