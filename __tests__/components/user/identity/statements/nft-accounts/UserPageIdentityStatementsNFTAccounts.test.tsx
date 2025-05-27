import { render } from '@testing-library/react';
import React from 'react';
import UserPageIdentityStatementsNFTAccounts from '../../../../../../components/user/identity/statements/nft-accounts/UserPageIdentityStatementsNFTAccounts';

let listProps: any;

jest.mock('../../../../../../components/user/identity/statements/utils/UserPageIdentityStatementsStatementsList', () => (props: any) => {
  listProps = props;
  return <ul data-testid="list" />;
});

describe('UserPageIdentityStatementsNFTAccounts', () => {
  it('passes statements to list', () => {
    const statements = [{ id: 's1' } as any];
    const profile = { id: 'p1' } as any;
    render(
      <UserPageIdentityStatementsNFTAccounts
        statements={statements}
        profile={profile}
        loading={false}
      />
    );
    expect(listProps.statements).toBe(statements);
    expect(listProps.profile).toBe(profile);
    expect(listProps.noItemsMessage).toBe('No NFT Account added yet');
    expect(listProps.loading).toBe(false);
  });
});
