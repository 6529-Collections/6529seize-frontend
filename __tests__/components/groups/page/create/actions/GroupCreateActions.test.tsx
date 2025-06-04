import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import GroupCreateActions from '../../../../../../components/groups/page/create/actions/GroupCreateActions';
import { AuthContext } from '../../../../../../components/auth/Auth';
import { ReactQueryWrapperContext } from '../../../../../../components/react-query-wrapper/ReactQueryWrapper';

jest.mock('../../../../../../components/groups/page/create/actions/GroupCreateTest', () => () => <div data-testid="test" />);
jest.mock('../../../../../../components/distribution-plan-tool/common/CircleLoader', () => () => <div data-testid="loader" />);

const commonApiPost = jest.fn();
jest.mock('../../../../../../services/api/common-api', () => ({
  commonApiPost: (...args: any[]) => commonApiPost(...args),
}));

// simple useMutation mock that executes mutationFn and callbacks
const useMutationMock = jest.fn((options: any) => {
  const mutateAsync = jest.fn(async (param?: any) => {
    try {
      const result = await options.mutationFn(param);
      if (options.onSuccess) options.onSuccess(result, param, undefined);
      if (options.onSettled) options.onSettled(result, undefined, param, undefined);
      return result;
    } catch (err) {
      if (options.onError) options.onError(err, param, undefined);
      if (options.onSettled) options.onSettled(undefined, err, param, undefined);
      throw err;
    }
  });
  return { mutateAsync };
});

jest.mock('@tanstack/react-query', () => ({ useMutation: (options: any) => useMutationMock(options) }));

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

it('disables create button when no filters selected', () => {
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
  commonApiPost.mockResolvedValueOnce({ id: '123' }).mockResolvedValueOnce({});

  const { auth, queryCtx, onCompleted } = renderActions({ groupConfig, originalGroup });

  await userEvent.click(screen.getByRole('button', { name: 'Create' }));

  await waitFor(() => expect(commonApiPost).toHaveBeenCalledTimes(2));
  expect(auth.requestAuth).toHaveBeenCalled();
  expect(commonApiPost).toHaveBeenNthCalledWith(1, { endpoint: 'groups', body: groupConfig });
  expect(commonApiPost).toHaveBeenNthCalledWith(2, {
    endpoint: 'groups/123/visible',
    body: { visible: true, old_version_id: 'old' },
  });
  expect(auth.setToast).toHaveBeenCalledWith({ message: 'Group created.', type: 'success' });
  expect(queryCtx.onGroupCreate).toHaveBeenCalled();
  expect(onCompleted).toHaveBeenCalled();
});
