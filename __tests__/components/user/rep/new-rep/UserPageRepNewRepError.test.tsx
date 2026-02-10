import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import UserPageRepNewRepError from '@/components/user/rep/new-rep/UserPageRepNewRepError';

jest.mock('@/components/user/utils/UserPageErrorWrapper', () => (props:any) => (
  <div data-testid="wrapper" onClick={props.closeError}>{props.children}</div>
));

test('shows message and triggers close', async () => {
  const user = userEvent.setup();
  const close = jest.fn();
  render(<UserPageRepNewRepError msg="oops" closeError={close} />);
  expect(screen.getByText('oops')).toBeInTheDocument();
  await user.click(screen.getByTestId('wrapper'));
  expect(close).toHaveBeenCalled();
});
