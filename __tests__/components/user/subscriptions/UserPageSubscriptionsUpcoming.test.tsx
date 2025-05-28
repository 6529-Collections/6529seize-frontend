import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import UserPageSubscriptionsUpcoming from '../../../../components/user/subscriptions/UserPageSubscriptionsUpcoming';
import { AuthContext } from '../../../../components/auth/Auth';

jest.mock('../../../../services/api/common-api', () => ({
  commonApiFetch: jest.fn(),
  commonApiPost: jest.fn(),
}));

jest.mock('@tanstack/react-query', () => ({
  useQuery: () => ({ data: null }),
}));

jest.mock('react-toggle', () => (props: any) => (
  <input type="checkbox" {...props} data-testid="toggle" />
));

function renderComponent(subscriptions: any[]) {
  const requestAuth = jest.fn().mockResolvedValue({ success: true });
  const setToast = jest.fn();
  const refresh = jest.fn();
  render(
    <AuthContext.Provider value={{ requestAuth, setToast } as any}>
      <UserPageSubscriptionsUpcoming
        profileKey="p1"
        details={undefined}
        memes_subscriptions={subscriptions}
        readonly={false}
        refresh={refresh}
      />
    </AuthContext.Provider>
  );
  return { requestAuth, setToast, refresh };
}

describe('UserPageSubscriptionsUpcoming', () => {
  const sample = (n: number) =>
    Array.from({ length: n }, (_, i) => ({
      token_id: i + 1,
      contract: '0x1',
      subscribed: true,
      consolidation_key: 'k',
    }));

  it('expands and collapses subscription list', async () => {
    const user = userEvent.setup();
    renderComponent(sample(4));
    expect(screen.getAllByRole('checkbox').length).toBe(3);
    await user.click(screen.getByRole('button'));
    expect(screen.getAllByRole('checkbox').length).toBe(4);
    await user.click(screen.getByRole('button'));
    expect(screen.getAllByRole('checkbox').length).toBe(3);
  });
});
