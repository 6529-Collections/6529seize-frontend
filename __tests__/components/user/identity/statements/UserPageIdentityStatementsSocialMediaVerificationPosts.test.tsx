import { render, screen } from '@testing-library/react';
import UserPageIdentityStatementsSocialMediaVerificationPosts from '@/components/user/identity/statements/social-media-verification-posts/UserPageIdentityStatementsSocialMediaVerificationPosts';
import { CicStatement } from '@/entities/IProfile';
import { ApiIdentity } from '@/generated/models/ApiIdentity';

let capturedProps: any = null;

jest.mock('@/components/user/identity/statements/utils/UserPageIdentityStatementsStatementsList', () => (props: any) => {
  capturedProps = props;
  return <div data-testid="list" />;
});

describe('UserPageIdentityStatementsSocialMediaVerificationPosts', () => {
  it('forwards props to statements list', () => {
    const statements: CicStatement[] = [{ statement_value: 'a' }] as any;
    const profile: ApiIdentity = { handle: 'bob' } as any;
    render(
      <UserPageIdentityStatementsSocialMediaVerificationPosts statements={statements} profile={profile} loading={true} />
    );
    expect(capturedProps.statements).toBe(statements);
    expect(capturedProps.profile).toBe(profile);
    expect(capturedProps.loading).toBe(true);
    expect(capturedProps.noItemsMessage).toMatch('No Social Media Verification Post added yet');
    expect(screen.getByTestId('list')).toBeInTheDocument();
  });
});
