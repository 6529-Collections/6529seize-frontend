import { render } from '@testing-library/react';
import React from 'react';
import UserPageIdentityStatementsSocialMediaAccounts from '../../../../../../components/user/identity/statements/social-media-accounts/UserPageIdentityStatementsSocialMediaAccounts';

let listProps: any;
jest.mock('../../../../../../components/user/identity/statements/utils/UserPageIdentityStatementsStatementsList', () => (props: any) => { listProps = props; return <ul data-testid="list" />; });

describe('UserPageIdentityStatementsSocialMediaAccounts', () => {
  it('passes props to list', () => {
    const statements = [{ id: '1' } as any];
    const profile = { id: 'p1' } as any;
    render(<UserPageIdentityStatementsSocialMediaAccounts statements={statements} profile={profile} loading={false} />);
    expect(listProps.statements).toBe(statements);
    expect(listProps.profile).toBe(profile);
    expect(listProps.noItemsMessage).toBe('No Social Media Account added yet');
    expect(listProps.loading).toBe(false);
  });
});
