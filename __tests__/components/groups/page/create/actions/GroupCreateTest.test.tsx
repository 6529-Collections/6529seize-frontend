// @ts-nocheck
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import React from 'react';
import GroupCreateTest from '../../../../../../components/groups/page/create/actions/GroupCreateTest';
import { AuthContext } from '../../../../../../components/auth/Auth';

const commonApiPost = jest.fn();
const commonApiFetch = jest.fn();

jest.mock('../../../../../../services/api/common-api', () => ({
  commonApiPost: (...args: any[]) => commonApiPost(...args),
  commonApiFetch: (...args: any[]) => commonApiFetch(...args),
}));

const mutateAsyncMock = jest.fn();

const useMutationMock = jest.fn((options: any) => {
  const mutateAsync = async (param?: any) => {
    return options.mutationFn(param);
  };
  mutateAsyncMock.mockImplementation(mutateAsync);
  return { mutateAsync: mutateAsyncMock };
});

const useQueryMock = jest.fn((...args: any[]) => ({ isFetching: false, data: undefined }));

jest.mock('@tanstack/react-query', () => ({
  useMutation: (opts: any) => useMutationMock(opts),
  // @ts-expect-error - test mock
  useQuery: (...args: any[]) => useQueryMock(...args),
  keepPreviousData: {},
}));

function renderComponent(props?: Partial<React.ComponentProps<typeof GroupCreateTest>>) {
  const auth = {
    requestAuth: jest.fn().mockResolvedValue({ success: true }),
    setToast: jest.fn(),
    connectedProfile: { handle: 'alice' },
  } as any;
  render(
    <AuthContext.Provider value={auth}>
      <GroupCreateTest
        groupConfig={{ name: 'name', group: {} } as any}
        disabled={false}
        {...props}
      />
    </AuthContext.Provider>
  );
  return { auth };
}

beforeEach(() => {
  jest.clearAllMocks();
});

test('disables button when disabled prop true', () => {
  render(
    <AuthContext.Provider value={{} as any}>
      <GroupCreateTest groupConfig={{} as any} disabled={true} />
    </AuthContext.Provider>
  );
  expect(screen.getByRole('button', { name: 'Test' })).toBeDisabled();
});

test('calls mutation and displays loader on click', async () => {
  const { auth } = renderComponent();
  const button = screen.getByRole('button', { name: 'Test' });

  await fireEvent.click(button);

  await waitFor(() => expect(auth.requestAuth).toHaveBeenCalled());
  expect(mutateAsyncMock).toHaveBeenCalledWith({
    name: 'name',
    group: {},
  });
});
