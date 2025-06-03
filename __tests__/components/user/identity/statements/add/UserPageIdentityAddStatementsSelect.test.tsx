import { render, screen, fireEvent } from '@testing-library/react';
import React from 'react';
import UserPageIdentityAddStatementsSelect from '../../../../../../components/user/identity/statements/add/UserPageIdentityAddStatementsSelect';
import { STATEMENT_ADD_VIEW } from '../../../../../../components/user/identity/statements/add/UserPageIdentityAddStatements';

describe('UserPageIdentityAddStatementsSelect', () => {
  it('calls onClose when close button clicked', () => {
    const onClose = jest.fn();
    render(<UserPageIdentityAddStatementsSelect onClose={onClose} onViewChange={jest.fn()} />);
    fireEvent.click(screen.getByRole('button', { name: /close/i }));
    expect(onClose).toHaveBeenCalled();
  });

  it('triggers view changes', () => {
    const onViewChange = jest.fn();
    render(<UserPageIdentityAddStatementsSelect onClose={jest.fn()} onViewChange={onViewChange} />);
    fireEvent.click(screen.getByText('Social Media Accounts'));
    expect(onViewChange).toHaveBeenCalledWith(STATEMENT_ADD_VIEW.SOCIAL_MEDIA_ACCOUNT);
    fireEvent.click(screen.getByText('NFT Accounts'));
    expect(onViewChange).toHaveBeenCalledWith(STATEMENT_ADD_VIEW.NFT_ACCOUNT);
    fireEvent.click(screen.getByText('Contact'));
    expect(onViewChange).toHaveBeenCalledWith(STATEMENT_ADD_VIEW.CONTACT);
    fireEvent.click(screen.getByText('Social Media Verification Posts'));
    expect(onViewChange).toHaveBeenCalledWith(STATEMENT_ADD_VIEW.SOCIAL_MEDIA_VERIFICATION_POST);
  });
});
