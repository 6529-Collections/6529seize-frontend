import { render, screen, waitFor } from '@testing-library/react';
import React from 'react';
import UserPageIdentityStatementsStatementsList from '../../../../../../components/user/identity/statements/utils/UserPageIdentityStatementsStatementsList';
import { AuthContext } from '../../../../../../components/auth/Auth';
import { useSeizeConnectContext } from '../../../../../../components/auth/SeizeConnectContext';

jest.mock('../../../../../../components/auth/SeizeConnectContext', () => ({ useSeizeConnectContext: jest.fn() }));
jest.mock('../../../../../../helpers/Helpers', () => ({
  amIUser: jest.fn(() => true),
}));

let statementProps: any[] = [];
jest.mock('../../../../../../components/user/identity/statements/utils/UserPageIdentityStatementsStatement', () => (props: any) => { statementProps.push(props); return <li data-testid="statement" />; });
jest.mock('../../../../../../components/utils/animation/CommonSkeletonLoader', () => ({ __esModule: true, default: () => <div data-testid="loader" /> }));

describe('UserPageIdentityStatementsStatementsList', () => {
  const addressContext = { address: '0x1' };
  const authContext = { activeProfileProxy: null };

  beforeEach(() => { (useSeizeConnectContext as jest.Mock).mockReturnValue(addressContext); statementProps = []; });

  it('shows loader when loading', () => {
    render(
      <AuthContext.Provider value={authContext as any}>
        <UserPageIdentityStatementsStatementsList statements={[]} profile={{} as any} noItemsMessage="none" loading={true} />
      </AuthContext.Provider>
    );
    expect(screen.getByTestId('loader')).toBeInTheDocument();
  });

  it('passes canEdit to statements when not loading', async () => {
    render(
      <AuthContext.Provider value={authContext as any}>
        <UserPageIdentityStatementsStatementsList statements={[{ id: 's' } as any]} profile={{} as any} noItemsMessage="none" loading={false} />
      </AuthContext.Provider>
    );
    await waitFor(() => {
      const last = statementProps[statementProps.length - 1];
      expect(last.canEdit).toBe(true);
    });
  });
});
