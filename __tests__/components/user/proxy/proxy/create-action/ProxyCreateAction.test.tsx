import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import ProxyCreateAction from '@/components/user/proxy/proxy/create-action/ProxyCreateAction';
import { AuthContext } from '@/components/auth/Auth';
import { ReactQueryWrapperContext } from '@/components/react-query-wrapper/ReactQueryWrapper';
import { useMutation } from '@tanstack/react-query';

// Mock fetch
global.fetch = jest.fn(() => 
  Promise.resolve({
    ok: true,
    json: () => Promise.resolve({}),
  })
) as jest.Mock;

jest.mock('@tanstack/react-query');

jest.mock('@/components/user/proxy/proxy/create-action/select-type/ProxyCreateActionSelectType', () => ({
  __esModule: true,
  default: ({ setSelectedActionType, onCancel }: any) => (
    <button onClick={() => setSelectedActionType('vote')} data-testid="select">select</button>
  ),
}));

jest.mock('@/components/user/proxy/proxy/create-action/config/ProxyCreateActionConfig', () => ({
  __esModule: true,
  default: ({ onSubmit }: any) => <button onClick={() => onSubmit({ type: 'vote' })} data-testid="submit">config</button>,
}));

const mutateAsync = jest.fn();
(useMutation as jest.Mock).mockImplementation((opts) => ({
  mutateAsync: async (body: any) => {
    try {
      await opts.mutationFn(body);
      opts.onSuccess?.();
    } catch (error) {
      opts.onError?.(error);
    } finally {
      opts.onSettled?.();
    }
    return mutateAsync();
  },
}));

describe('ProxyCreateAction', () => {
  const auth = { requestAuth: jest.fn().mockResolvedValue({ success: true }), setToast: jest.fn() } as any;
  const rq = { onProfileProxyModify: jest.fn() } as any;

  it('allows selecting and submitting action', async () => {
    const user = userEvent.setup();
    render(
      <AuthContext.Provider value={auth}>
        <ReactQueryWrapperContext.Provider value={rq}>
          <ProxyCreateAction 
          profileProxy={{ 
            id: 'p', 
            actions: [], 
            granted_to: { handle: 'user1' }, 
            created_by: { handle: 'user2' } 
          } as any} 
          onActionCreated={jest.fn()} 
        />
        </ReactQueryWrapperContext.Provider>
      </AuthContext.Provider>
    );
    await user.click(screen.getByTestId('select'));
    await user.click(screen.getByTestId('submit'));
    expect(auth.requestAuth).toHaveBeenCalled();
    expect(mutateAsync).toHaveBeenCalled();
    expect(rq.onProfileProxyModify).toHaveBeenCalled();
  });
});
