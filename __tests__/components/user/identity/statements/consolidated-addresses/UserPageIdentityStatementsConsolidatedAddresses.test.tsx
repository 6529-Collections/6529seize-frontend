import { render, screen } from '@testing-library/react';
import UserPageIdentityStatementsConsolidatedAddresses from '../../../../../../components/user/identity/statements/consolidated-addresses/UserPageIdentityStatementsConsolidatedAddresses';
import { AuthContext } from '../../../../../../components/auth/Auth';
import { ApiIdentity } from '../../../../../../generated/models/ApiIdentity';

jest.mock('../../../../../../components/user/identity/statements/consolidated-addresses/UserPageIdentityStatementsConsolidatedAddressesItem', () => (props: any) => <li data-testid="item">{props.address.wallet}</li>);
jest.mock('../../../../../../components/user/utils/icons/EthereumIcon', () => () => <div />);
jest.mock('next/link', () => ({ __esModule: true, default: (props: any) => <a {...props}>{props.children}</a> }));
jest.mock('@tanstack/react-query', () => ({ useQueries: () => [] }));
jest.mock('../../../../../../helpers/Helpers', () => ({ amIUser: () => true, formatNumberWithCommasOrDash: (x: number) => String(x) }));
jest.mock('../../../../../../components/auth/SeizeConnectContext', () => ({ useSeizeConnectContext: () => ({ address: '0x2' }) }));

describe('UserPageIdentityStatementsConsolidatedAddresses', () => {
  const profile: ApiIdentity = {
    primary_wallet: null,
    wallets: [
      { wallet: '0x1', tdh: 1 } as any,
      { wallet: '0x2', tdh: 2 } as any,
    ],
  } as any;

  it('sorts wallets and sets wallet checker link', () => {
    render(
      <AuthContext.Provider value={{ activeProfileProxy: null } as any}>
        <UserPageIdentityStatementsConsolidatedAddresses profile={profile} />
      </AuthContext.Provider>
    );
    const items = screen.getAllByTestId('item');
    expect(items[0]).toHaveTextContent('0x2');
    expect(screen.getByRole('link', { name: 'Wallet Checker' })).toHaveAttribute('href', '/delegation/wallet-checker?address=0x2');
  });
});
