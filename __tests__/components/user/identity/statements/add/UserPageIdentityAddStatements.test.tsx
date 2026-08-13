import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import UserPageIdentityAddStatements, { STATEMENT_ADD_VIEW } from "@/components/user/identity/statements/add/UserPageIdentityAddStatements";
import type { ApiIdentity } from '@/generated/models/ApiIdentity';

let dialogProps: any;

jest.mock('@/components/mobile-wrapper-dialog/MobileWrapperDialog', () => ({
  __esModule: true,
  default: (props: any) => {
    dialogProps = props;
    return props.isOpen ? <div data-testid="dialog">{props.children}</div> : null;
  },
}));

jest.mock('@/components/user/identity/statements/add/UserPageIdentityAddStatementsViews', () => ({
  __esModule: true,
  default: ({ activeView, setActiveView }: any) => (
    <div data-testid="views" onClick={() => setActiveView(STATEMENT_ADD_VIEW.CONTACT)}>{activeView}</div>
  )
}));

const profile = { id: '1' } as ApiIdentity;

test('passes open state and close callback to the shared dialog', () => {
  const onClose = jest.fn();
  render(<UserPageIdentityAddStatements profile={profile} isOpen onClose={onClose} />);
  expect(dialogProps.isOpen).toBe(true);
  dialogProps.onClose();
  expect(onClose).toHaveBeenCalled();
});

test('changes active view when child triggers', async () => {
  render(<UserPageIdentityAddStatements profile={profile} isOpen onClose={() => {}} />);
  const div = screen.getByTestId('views');
  expect(div.textContent).toBe(STATEMENT_ADD_VIEW.SELECT);
  await userEvent.click(div);
  expect(div.textContent).toBe(STATEMENT_ADD_VIEW.CONTACT);
  expect(dialogProps.title).toBe('Add contact');
});
