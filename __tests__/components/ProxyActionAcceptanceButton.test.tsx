import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import React from 'react';
import ProxyActionAcceptanceButton from '../../components/user/proxy/proxy/action/ProxyActionAcceptanceButton';
import { AuthContext } from '../../components/auth/Auth';
import { ReactQueryWrapperContext } from '../../components/react-query-wrapper/ReactQueryWrapper';
import { AcceptActionRequestActionEnum } from '../../generated/models/AcceptActionRequest';

const mutateAsync = jest.fn();
let onSuccessCb: any;
jest.mock('@tanstack/react-query', () => ({
  useMutation: (opts: any) => {
    onSuccessCb = opts.onSuccess;
    return { mutateAsync: async (v: any) => { mutateAsync(v); onSuccessCb?.(null, v); } };
  },
}));

jest.mock('../../helpers/profile-proxy.helpers', () => ({
  haveSeenProfileProxyActionAcceptanceModal: jest.fn(() => false),
  setSeenProfileProxyActionAcceptanceModal: jest.fn(),
}));

jest.mock('../../components/distribution-plan-tool/common/CircleLoader', () => {
  const MockedCircleLoader = () => <span data-testid="loader" />;
  MockedCircleLoader.displayName = 'CircleLoader';
  return MockedCircleLoader;
});

describe('ProxyActionAcceptanceButton', () => {
  it('executes accept action', async () => {
    const action: any = { id: 'a', revoked_at: null, accepted_at: null, rejected_at: null };
    const profile: any = { id: '1' };
    const profileProxy: any = { id: 'p', granted_to: { id: '1', handle: 'alice' }, created_by: { id: '2', handle: 'bob' } };

    const authValue = { setToast: jest.fn(), connectedProfile: { id: '1' }, requestAuth: jest.fn().mockResolvedValue({ success: true }) } as any;
    const rqValue = { onProfileProxyModify: jest.fn() } as any;

    render(
      <AuthContext.Provider value={authValue}>
        <ReactQueryWrapperContext.Provider value={rqValue}>
          <ProxyActionAcceptanceButton action={action} profile={profile} profileProxy={profileProxy} />
        </ReactQueryWrapperContext.Provider>
      </AuthContext.Provider>
    );

    fireEvent.click(screen.getByText('Accept'));
    await waitFor(() => expect(mutateAsync).toHaveBeenCalled());
    expect(mutateAsync).toHaveBeenCalledWith({ action: AcceptActionRequestActionEnum.Accept });
  });

  it('shows revoke action for creator', async () => {
    const action: any = { id: 'a', revoked_at: null };
    const profile: any = { id: '1' };
    const profileProxy: any = { id: 'p', granted_to: { id: '2' }, created_by: { id: '1', handle: 'bob' } };

    const authValue = {
      setToast: jest.fn(),
      connectedProfile: { id: '1' },
      requestAuth: jest.fn().mockResolvedValue({ success: true }),
    } as any;
    const rqValue = { onProfileProxyModify: jest.fn() } as any;

    render(
      <AuthContext.Provider value={authValue}>
        <ReactQueryWrapperContext.Provider value={rqValue}>
          <ProxyActionAcceptanceButton action={action} profile={profile} profileProxy={profileProxy} />
        </ReactQueryWrapperContext.Provider>
      </AuthContext.Provider>
    );

    fireEvent.click(screen.getByText('Revoke'));
    await waitFor(() => expect(mutateAsync).toHaveBeenCalled());
    expect(mutateAsync).toHaveBeenCalledWith({ action: AcceptActionRequestActionEnum.Revoke });
  });

  it('shows modal on successful accept', async () => {
    const action: any = { id: 'a', revoked_at: null, accepted_at: null, rejected_at: null };
    const profile: any = { id: '1' };
    const profileProxy: any = { id: 'p', granted_to: { id: '1', handle: 'alice' }, created_by: { id: '2', handle: 'bob' } };

    const authValue = { setToast: jest.fn(), connectedProfile: { id: '1' }, requestAuth: jest.fn().mockResolvedValue({ success: true }) } as any;
    const rqValue = { onProfileProxyModify: jest.fn() } as any;

    render(
      <AuthContext.Provider value={authValue}>
        <ReactQueryWrapperContext.Provider value={rqValue}>
          <ProxyActionAcceptanceButton action={action} profile={profile} profileProxy={profileProxy} />
        </ReactQueryWrapperContext.Provider>
      </AuthContext.Provider>
    );

    fireEvent.click(screen.getByText('Accept'));
    await waitFor(() => expect(screen.getByRole('dialog')).toBeInTheDocument());
  });
});
