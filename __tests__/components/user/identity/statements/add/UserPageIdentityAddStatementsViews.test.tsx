import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import UserPageIdentityAddStatementsViews from '@/components/user/identity/statements/add/UserPageIdentityAddStatementsViews';
import { STATEMENT_ADD_VIEW } from '@/components/user/identity/statements/add/UserPageIdentityAddStatements';
import type { ApiIdentity } from '@/generated/models/ApiIdentity';

jest.mock('@/components/user/identity/statements/add/UserPageIdentityAddStatementsSelect', () => () => <div data-testid="select" />);
jest.mock('@/components/user/identity/statements/add/contact/UserPageIdentityAddStatementsContact', () => () => <div data-testid="contact" />);
jest.mock('@/components/user/identity/statements/add/social-media/UserPageIdentityAddStatementsSocialMediaAccount', () => () => <div data-testid="sma" />);
jest.mock('@/components/user/identity/statements/add/social-media-verification-posts/UserPageIdentityAddStatementsSocialMediaPosts', () => () => <div data-testid="smp" />);
jest.mock('@/components/user/identity/statements/add/nft-accounts/UserPageIdentityAddStatementsNFTAccounts', () => () => <div data-testid="nft" />);

const profile = { id:'1' } as ApiIdentity;

describe('UserPageIdentityAddStatementsViews', () => {
  const renderView = (activeView: STATEMENT_ADD_VIEW, onBack = jest.fn()) =>
    render(
      <UserPageIdentityAddStatementsViews
        profile={profile}
        activeView={activeView}
        setActiveView={jest.fn()}
        onBack={onBack}
        onClose={jest.fn()}
      />
    );

  it('renders select view', () => {
    renderView(STATEMENT_ADD_VIEW.SELECT);
    expect(screen.getByTestId('select')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /back to statement types/i })).toBeNull();
  });

  it('renders social media account view', () => {
    const onBack = jest.fn();
    renderView(STATEMENT_ADD_VIEW.SOCIAL_MEDIA_ACCOUNT, onBack);
    expect(screen.getByTestId('sma')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: /back to statement types/i }));
    expect(onBack).toHaveBeenCalled();
  });

  it('renders nft account view', () => {
    renderView(STATEMENT_ADD_VIEW.NFT_ACCOUNT);
    expect(screen.getByTestId('nft')).toBeInTheDocument();
  });

  it('renders contact view', () => {
    renderView(STATEMENT_ADD_VIEW.CONTACT);
    expect(screen.getByTestId('contact')).toBeInTheDocument();
  });

  it('renders social media posts view', () => {
    renderView(STATEMENT_ADD_VIEW.SOCIAL_MEDIA_VERIFICATION_POST);
    expect(screen.getByTestId('smp')).toBeInTheDocument();
  });
});
