import { render, screen } from '@testing-library/react';
import UserPageIdentityAddStatementsHeader from '@/components/user/identity/statements/header/UserPageIdentityAddStatementsHeader';
import { AuthContext } from '@/components/auth/Auth';
import { useSeizeConnectContext } from '@/components/auth/SeizeConnectContext';

jest.mock('@/components/user/identity/statements/add/UserPageIdentityStatementsAddButton', () => ({
  __esModule: true,
  default: () => <div data-testid="add-button" />,
}));

jest.mock('@/components/auth/SeizeConnectContext', () => ({
  useSeizeConnectContext: jest.fn(),
}));

const mockedUseSeize = useSeizeConnectContext as jest.Mock;

const profile = { handle: 'alice', wallets: [{ wallet: '0x1' }] } as any;

describe('UserPageIdentityAddStatementsHeader', () => {
  it('shows add button when viewing own profile', () => {
    mockedUseSeize.mockReturnValue({ address: '0x1' });
    render(
      <AuthContext.Provider value={{ activeProfileProxy: undefined } as any}>
        <UserPageIdentityAddStatementsHeader profile={profile} />
      </AuthContext.Provider>
    );
    expect(screen.getByTestId('add-button')).toBeInTheDocument();
    expect(screen.getByRole('heading')).toHaveTextContent("alice's ID Statements");
  });

  it('hides add button when not my profile', () => {
    mockedUseSeize.mockReturnValue({ address: '0x2' });
    render(
      <AuthContext.Provider value={{ activeProfileProxy: undefined } as any}>
        <UserPageIdentityAddStatementsHeader profile={profile} />
      </AuthContext.Provider>
    );
    expect(screen.queryByTestId('add-button')).toBeNull();
  });
});
