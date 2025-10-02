import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import UserPageIdentityAddStatementsContactItems from '@/components/user/identity/statements/add/contact/UserPageIdentityAddStatementsContactItems';
import { CONTACT_STATEMENT_TYPES } from '@/helpers/Types';

jest.mock('@/components/user/identity/statements/utils/UserPageIdentityAddStatementsTypeButton', () => ({ statementType, onClick, isActive }: any) => (
  <button data-testid="btn" onClick={onClick}>{statementType}{isActive ? '!' : ''}</button>
));

describe('UserPageIdentityAddStatementsContactItems', () => {
  it('renders all buttons and handles click', async () => {
    const user = userEvent.setup();
    const setContactType = jest.fn();
    render(
      <UserPageIdentityAddStatementsContactItems
        activeType={CONTACT_STATEMENT_TYPES[0]}
        setContactType={setContactType}
      />
    );
    const buttons = screen.getAllByTestId('btn');
    expect(buttons).toHaveLength(CONTACT_STATEMENT_TYPES.length);
    await user.click(buttons[1]);
    expect(setContactType).toHaveBeenCalledWith(CONTACT_STATEMENT_TYPES[1]);
  });
});
