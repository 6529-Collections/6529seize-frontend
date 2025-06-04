import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import HeaderUserConnect from '../../../../components/header/user/HeaderUserConnect';
import { useSeizeConnectContext } from '../../../../components/auth/SeizeConnectContext';

jest.mock('../../../../components/auth/SeizeConnectContext', () => ({ useSeizeConnectContext: jest.fn() }));

it('calls seizeConnect on click', async () => {
  const user = userEvent.setup();
  const seizeConnect = jest.fn();
  (useSeizeConnectContext as jest.Mock).mockReturnValue({ seizeConnect });
  render(<HeaderUserConnect />);
  await user.click(screen.getByRole('button'));
  expect(seizeConnect).toHaveBeenCalled();
});
