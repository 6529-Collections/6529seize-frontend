import React from 'react';

// Mock fetch
global.fetch = jest.fn(() => 
  Promise.resolve({
    ok: true,
    json: () => Promise.resolve({}),
  })
) as jest.Mock;

// Mock react-dom first 
jest.mock('react-dom', () => ({
  ...jest.requireActual('react-dom'),
  createPortal: (node: any) => node
}));

import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import GroupCardDeleteModal from '@/components/groups/page/list/card/actions/delete/GroupCardDeleteModal';
import { AuthContext } from '@/components/auth/Auth';
import { ReactQueryWrapperContext } from '@/components/react-query-wrapper/ReactQueryWrapper';
const hookState = {
  updateVisibility: jest.fn(),
  isUpdatingVisibility: false,
  submit: jest.fn(),
  runTest: jest.fn(),
  validate: jest.fn(),
  isSubmitting: false,
  isTesting: false,
};

jest.mock('@/hooks/groups/useGroupMutations', () => ({
  useGroupMutations: () => hookState,
}));
jest.mock('react-redux', () => ({ useDispatch: jest.fn(() => jest.fn()), useSelector: jest.fn(() => null) }));

describe('GroupCardDeleteModal', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    hookState.updateVisibility.mockReset();
    hookState.isUpdatingVisibility = false;
  });

  const auth = { requestAuth: jest.fn().mockResolvedValue({ success: true }), setToast: jest.fn() } as any;
  const rq = { onGroupRemoved: jest.fn() } as any;

  it('deletes group when confirmed', async () => {
    const user = userEvent.setup();
    hookState.updateVisibility.mockResolvedValueOnce({ ok: true, visible: false, groupId: 'g' });
    render(
      <AuthContext.Provider value={auth}>
        <ReactQueryWrapperContext.Provider value={rq}>
          <GroupCardDeleteModal group={{ id: 'g', name: 'Test Group' } as any} onClose={jest.fn()} />
        </ReactQueryWrapperContext.Provider>
      </AuthContext.Provider>
    );
    await user.click(screen.getByRole('button', { name: 'Delete' }));
    expect(hookState.updateVisibility).toHaveBeenCalledWith({
      groupId: 'g',
      visible: false,
    });
    expect(auth.setToast).toHaveBeenCalledWith({ message: 'Group deleted.', type: 'warning' });
    expect(rq.onGroupRemoved).toHaveBeenCalledWith({ groupId: 'g' });
  });

  it('calls onClose on cancel', async () => {
    const user = userEvent.setup();
    const onClose = jest.fn();
    render(
      <AuthContext.Provider value={auth}>
        <ReactQueryWrapperContext.Provider value={rq}>
          <GroupCardDeleteModal group={{ id: 'g', name: 'Test Group' } as any} onClose={onClose} />
        </ReactQueryWrapperContext.Provider>
      </AuthContext.Provider>
    );
    await user.click(screen.getByRole('button', { name: 'Cancel' }));
    expect(onClose).toHaveBeenCalled();
  });
});
