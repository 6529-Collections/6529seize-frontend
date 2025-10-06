import { render, screen, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import React from 'react';
import UserPageIdentityStatementsAddButton from '@/components/user/identity/statements/add/UserPageIdentityStatementsAddButton';

let modalProps: any;

jest.mock('@/components/utils/animation/CommonAnimationWrapper', () => ({
  __esModule: true,
  default: ({ children }: any) => <div>{children}</div>,
}));

jest.mock('@/components/utils/animation/CommonAnimationOpacity', () => ({
  __esModule: true,
  default: ({ children, elementRole, elementClasses, ...rest }: any) => (
    <div role={elementRole} className={elementClasses} {...rest}>{children}</div>
  ),
}));

jest.mock('@/components/user/identity/statements/add/UserPageIdentityAddStatements', () => (props: any) => {
  modalProps = props;
  return <div data-testid="modal-content" />;
});

jest.mock('@/components/utils/button/PrimaryButton', () => (props: any) => (
  <button onClick={props.onClicked}>{props.children}</button>
));

const profile = { id: '1' } as any;

describe('UserPageIdentityStatementsAddButton', () => {
  it('opens and closes the add statements modal', async () => {
    render(<UserPageIdentityStatementsAddButton profile={profile} />);
    expect(screen.queryByRole('dialog')).toBeNull();

    await userEvent.click(screen.getByRole('button', { name: /add/i }));
    expect(screen.getByRole('dialog')).toBeInTheDocument();
    expect(modalProps.profile).toBe(profile);

    await act(async () => {
      modalProps.onClose();
    });
    expect(screen.queryByRole('dialog')).toBeNull();
  });
});
