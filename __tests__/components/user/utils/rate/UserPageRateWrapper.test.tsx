import { render, screen } from '@testing-library/react';
import UserPageRateWrapper from '../../../../../components/user/utils/rate/UserPageRateWrapper';
import { RateMatter } from '../../../../../entities/IProfile';
import { AuthContext } from '../../../../../components/auth/Auth';
import { useSeizeConnectContext } from '../../../../../components/auth/SeizeConnectContext';
import CommonInfoBox from '../../../../../components/utils/CommonInfoBox';
import React from 'react';

jest.mock('../../../../../components/auth/SeizeConnectContext');
jest.mock('../../../../../components/utils/CommonInfoBox', () => ({ __esModule: true, default: (props: any) => <div data-testid="infobox">{props.message}</div> }));

describe('UserPageRateWrapper', () => {
  const useCtx = useSeizeConnectContext as jest.Mock;

  const profile: any = { query: 'alice', handle: 'alice', wallets: [{ wallet: '0xabc' }] };

  function renderWrapper(ctx: any, seize: any, type = RateMatter.NIC) {
    useCtx.mockReturnValue(seize);
    return render(
      <AuthContext.Provider value={ctx as any}>
        <UserPageRateWrapper profile={profile} type={type}>
          <div data-testid="child" />
        </UserPageRateWrapper>
      </AuthContext.Provider>
    );
  }

  it('shows message when not connected', () => {
    renderWrapper({ connectedProfile: undefined, activeProfileProxy: undefined }, { address: undefined });
    expect(screen.getByTestId('infobox')).toHaveTextContent('Please connect to NIC rate alice');
  });

  it('renders children when user can rate', () => {
    renderWrapper({ connectedProfile: { handle: 'bob' }, activeProfileProxy: undefined }, { address: '0xdef' });
    expect(screen.getByTestId('child')).toBeInTheDocument();
  });
});
