import { render } from '@testing-library/react';
import React from 'react';
import UserPageBrainWrapper from '../../../../components/user/brain/UserPageBrainWrapper';
import { useRouter } from 'next/router';
import { AuthContext } from '../../../../components/auth/Auth';
import { useSeizeConnectContext } from '../../../../components/auth/SeizeConnectContext';
import { useIdentity } from '../../../../hooks/useIdentity';

jest.mock('next/router', () => ({ useRouter: jest.fn() }));
jest.mock('../../../../components/auth/SeizeConnectContext', () => ({ useSeizeConnectContext: jest.fn() }));
jest.mock('../../../../components/auth/Auth', () => ({ AuthContext: React.createContext({}), }));
jest.mock('../../../../hooks/useIdentity', () => ({ useIdentity: jest.fn() }));
jest.mock('../../../../components/user/brain/UserPageDrops', () => (props: any) => <div data-testid="drops" {...props} />);

const routerPush = jest.fn();
(useRouter as jest.Mock).mockReturnValue({ query: { user: 'alice' }, push: routerPush });

function renderWithContext(ctx: any) {
  (useSeizeConnectContext as jest.Mock).mockReturnValue({ address: ctx.address });
  const AuthCtx = require('../../../../components/auth/Auth').AuthContext;
  (useIdentity as jest.Mock).mockReturnValue({ profile: ctx.identity });
  return render(
    <AuthCtx.Provider value={ctx.auth as any}>
      <UserPageBrainWrapper profile={ctx.identity} />
    </AuthCtx.Provider>
  );
}

describe('UserPageBrainWrapper', () => {
  beforeEach(() => {
    routerPush.mockClear();
  });
  it('redirects to rep when waves disabled', () => {
    renderWithContext({ address: undefined, auth: { connectedProfile: null, activeProfileProxy: null, showWaves: false }, identity: { id: '1' } });
    expect(routerPush).toHaveBeenCalledWith('/alice/rep');
  });

  it('shows drops when waves enabled', () => {
    const { getByTestId } = renderWithContext({ address: '0x1', auth: { connectedProfile: null, activeProfileProxy: null, showWaves: true }, identity: { id: '1' } });
    expect(getByTestId('drops')).toBeInTheDocument();
    expect(routerPush).not.toHaveBeenCalled();
  });
});
