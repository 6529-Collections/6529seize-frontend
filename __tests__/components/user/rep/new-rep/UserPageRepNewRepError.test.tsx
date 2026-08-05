import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import UserPageRepNewRepError from '@/components/user/rep/new-rep/UserPageRepNewRepError';

jest.mock('@/components/user/utils/UserPageErrorWrapper', () => (props:any) => (
  <div data-testid="wrapper" onClick={props.closeError}>{props.children}</div>
));

test('shows title, message and details, and triggers close', async () => {
  const user = userEvent.setup();
  const close = jest.fn();
  render(<UserPageRepNewRepError msg="oops" closeError={close} />);
  expect(
    screen.getByRole('heading', { name: /category name won't work/i })
  ).toBeInTheDocument();
  expect(screen.getByText('oops')).toBeInTheDocument();
  expect(screen.getByText(/AI filter/)).toBeInTheDocument();
  await user.click(screen.getByTestId('wrapper'));
  expect(close).toHaveBeenCalled();
});

test('can hide the abuse-filter details for reserved categories', () => {
  const close = jest.fn();
  render(
    <UserPageRepNewRepError
      msg="Help6529 Credits is managed by help6529."
      showDetails={false}
      closeError={close}
    />
  );

  expect(
    screen.getByText('Help6529 Credits is managed by help6529.')
  ).toBeInTheDocument();
  expect(screen.queryByText(/AI filter/)).not.toBeInTheDocument();
});
