import React from 'react';
import { render, screen } from '@testing-library/react';
import UserPageIdentityAddStatementsSocialMediaPosts from '@/components/user/identity/statements/add/social-media-verification-posts/UserPageIdentityAddStatementsSocialMediaPosts';

jest.mock('@/components/user/identity/statements/utils/UserPageIdentityAddStatementsForm', () => ({ __esModule: true, default: (p:any) => { (global as any).formProps = p; return <div data-testid="form"/>; }}));

test('passes props to form', () => {
  const profile = { handle: 'a' } as any;
  const onClose = jest.fn();
  render(<UserPageIdentityAddStatementsSocialMediaPosts profile={profile} onClose={onClose} />);
  expect(screen.getByTestId('form')).toBeInTheDocument();
  expect((global as any).formProps.profile).toBe(profile);
  expect((global as any).formProps.activeType).toBe('LINK');
  expect((global as any).formProps.group).toBe('SOCIAL_MEDIA_VERIFICATION_POST');
  expect((global as any).formProps.onClose).toBe(onClose);
});
