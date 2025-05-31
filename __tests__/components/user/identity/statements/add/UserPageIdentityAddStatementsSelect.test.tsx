import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import React from 'react';
import UserPageIdentityAddStatementsSelect from '../../../../../../components/user/identity/statements/add/UserPageIdentityAddStatementsSelect';
import { STATEMENT_ADD_VIEW } from '../../../../../../components/user/identity/statements/add/UserPageIdentityAddStatements';

describe('UserPageIdentityAddStatementsSelect', () => {
  it('closes when close button clicked', async () => {
    const onClose = jest.fn();
    render(<UserPageIdentityAddStatementsSelect onClose={onClose} onViewChange={() => {}} />);
    await userEvent.click(screen.getByRole('button', { name: /close/i }));
    expect(onClose).toHaveBeenCalled();
  });

  it('selects social media accounts view', async () => {
    const onViewChange = jest.fn();
    render(<UserPageIdentityAddStatementsSelect onClose={() => {}} onViewChange={onViewChange} />);
    await userEvent.click(screen.getByRole('button', { name: /social media accounts/i }));
    expect(onViewChange).toHaveBeenCalledWith(STATEMENT_ADD_VIEW.SOCIAL_MEDIA_ACCOUNT);
  });
});
