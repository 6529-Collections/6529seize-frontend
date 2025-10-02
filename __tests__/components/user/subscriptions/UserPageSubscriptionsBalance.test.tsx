import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import UserPageSubscriptionsBalance from '@/components/user/subscriptions/UserPageSubscriptionsBalance';

jest.mock('@/components/dotLoader/DotLoader', () => ({
  __esModule: true,
  default: () => <div>Loading...</div>,
  Spinner: () => <div>Spinner</div>,
}));

describe('UserPageSubscriptionsBalance', () => {
  it('shows loader when fetching', () => {
    render(
      <UserPageSubscriptionsBalance
        details={undefined}
        show_refresh={false}
        fetching={true}
        refresh={jest.fn()}
      />
    );
    expect(screen.getByText('Loading...', { selector: 'div' })).toBeInTheDocument();
  });

  it('calls refresh when icon clicked', async () => {
    const user = userEvent.setup();
    const refresh = jest.fn();
    render(
      <UserPageSubscriptionsBalance
        details={{ balance: 2 } as any}
        show_refresh={true}
        fetching={false}
        refresh={refresh}
      />
    );
    await user.click(screen.getByLabelText('Refresh balance'));
    expect(refresh).toHaveBeenCalled();
    expect(screen.getByText((t) => t.includes('cards'))).toBeInTheDocument();
  });
});
