import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import ProxyListItem from '@/components/user/proxy/list/ProxyListItem';
import { AuthContext } from '@/components/auth/Auth';
import type { ApiProfileProxy } from '@/generated/models/ApiProfileProxy';

jest.mock('@/components/user/proxy/proxy/list/ProxyActions', () => () => <div data-testid="actions" />);
jest.mock('@/components/user/proxy/proxy/create-action/ProxyCreateAction', () => (props: any) => <div data-testid="create" onClick={props.onCancel} />);
jest.mock('@/components/utils/animation/CommonChangeAnimation', () => ({ __esModule: true, default: ({ children }: any) => <div>{children}</div> }));

describe('ProxyListItem', () => {
  const proxy: any = {
    actions: [],
    created_by: { id: '1', handle: 'grantor', pfp: null },
    granted_to: { id: '2', handle: 'grantee', pfp: null }
  };
  const profile: any = { id: 'p1' };

  function renderComp(isSelf: boolean, profileProxy: ApiProfileProxy = proxy) {
    return render(
      <AuthContext.Provider value={{ connectedProfile: { id: '1' } } as any}>
        <ProxyListItem isSelf={isSelf} profileProxy={profileProxy} profile={profile} />
      </AuthContext.Provider>
    );
  }

  it('shows add button and toggles view', async () => {
    const user = userEvent.setup();
    renderComp(true);
    const btn = screen.getByRole('button', { name: /Add A Proxy/i });
    await user.click(btn);
    expect(screen.getByTestId('create')).toBeInTheDocument();
  });

  it('shows addresses for grantors and recipients without handles', () => {
    const grantorAddress = '0x1111111111111111111111111111111111111111';
    const recipientAddress = '0x2222222222222222222222222222222222222222';
    renderComp(false, {
      ...proxy,
      created_by: { ...proxy.created_by, handle: null, primary_address: grantorAddress },
      granted_to: { ...proxy.granted_to, handle: null, primary_address: recipientAddress },
    });

    for (const address of [grantorAddress, recipientAddress]) {
      expect(screen.getByRole('link', { name: address })).toHaveAttribute(
        'href',
        `/${address}/proxy`
      );
    }
  });

  it('hides add button when not self', () => {
    renderComp(false);
    expect(screen.queryByRole('button', { name: /Add A Proxy/i })).toBeNull();
  });
});
