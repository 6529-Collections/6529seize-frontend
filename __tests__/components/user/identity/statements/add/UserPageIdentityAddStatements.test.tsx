import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import UserPageIdentityAddStatements, { STATEMENT_ADD_VIEW } from "../../../../../../components/user/identity/statements/add/UserPageIdentityAddStatements";
import { ApiIdentity } from '../../../../../generated/models/ApiIdentity';

let clickAway: () => void;
let escapeCb: () => void;

jest.mock('react-use', () => ({
  useClickAway: (_ref: any, cb: () => void) => { clickAway = cb; },
  useKeyPressEvent: (key: string, cb: () => void) => { if (key === 'Escape') escapeCb = cb; }
}));

jest.mock('../../../../../../components/user/identity/statements/add/UserPageIdentityAddStatementsViews', () => ({
  __esModule: true,
  default: ({ activeView, setActiveView }: any) => (
    <div data-testid="views" onClick={() => setActiveView(STATEMENT_ADD_VIEW.CONTACT)}>{activeView}</div>
  )
}));

const profile = { id: '1' } as ApiIdentity;

test('calls onClose on escape and click away', () => {
  const onClose = jest.fn();
  render(<UserPageIdentityAddStatements profile={profile} onClose={onClose} />);
  escapeCb();
  expect(onClose).toHaveBeenCalled();
  onClose.mockClear();
  clickAway();
  expect(onClose).toHaveBeenCalled();
});

test('changes active view when child triggers', async () => {
  render(<UserPageIdentityAddStatements profile={profile} onClose={() => {}} />);
  const div = screen.getByTestId('views');
  expect(div.textContent).toBe(STATEMENT_ADD_VIEW.SELECT);
  await userEvent.click(div);
  expect(div.textContent).toBe(STATEMENT_ADD_VIEW.CONTACT);
});
