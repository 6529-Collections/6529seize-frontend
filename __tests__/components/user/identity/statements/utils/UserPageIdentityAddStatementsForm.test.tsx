import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import React from 'react';
import UserPageIdentityAddStatementsForm from '../../../../../../components/user/identity/statements/utils/UserPageIdentityAddStatementsForm';
import { STATEMENT_TYPE, STATEMENT_GROUP } from '../../../../../../helpers/Types';
import { AuthContext } from '../../../../../../components/auth/Auth';
import { ReactQueryWrapperContext } from '../../../../../../components/react-query-wrapper/ReactQueryWrapper';
import { useMutation } from '@tanstack/react-query';

jest.mock('@tanstack/react-query', () => ({ useMutation: jest.fn() }));

const mutateAsync = jest.fn();
(useMutation as jest.Mock).mockReturnValue({ mutateAsync });

const auth = { requestAuth: jest.fn().mockResolvedValue({ success: true }), setToast: jest.fn() } as any;
const wrapper = ({ children }: any) => (
  <AuthContext.Provider value={auth}>
    <ReactQueryWrapperContext.Provider value={{ onProfileStatementAdd: jest.fn() }}>
      {children}
    </ReactQueryWrapperContext.Provider>
  </AuthContext.Provider>
);

describe('UserPageIdentityAddStatementsForm', () => {
  const profile: any = { query: 'q' };

  it('resets value when active type changes and submits', async () => {
    render(
      <UserPageIdentityAddStatementsForm profile={profile} activeType={STATEMENT_TYPE.DISCORD} group={STATEMENT_GROUP.CONTACT} onClose={jest.fn()} />,
      { wrapper }
    );
    const input = screen.getByRole('textbox');
    fireEvent.change(input, { target: { value: 'abc' } });

    const form = input.closest('form') as HTMLFormElement;
    fireEvent.submit(form);
    await waitFor(() => expect(auth.requestAuth).toHaveBeenCalled());
    expect(mutateAsync).toHaveBeenCalledWith('abc');
  });
});
