import { render, screen, fireEvent } from '@testing-library/react';
import UserPageSubscriptionsMode from '../../../../components/user/subscriptions/UserPageSubscriptionsMode';
import { AuthContext } from '../../../../components/auth/Auth';
import { commonApiPost } from '../../../../services/api/common-api';

jest.mock('../../../../services/api/common-api', () => ({
  commonApiPost: jest.fn(),
}));

jest.mock('../../../../components/dotLoader/DotLoader', () => ({ Spinner: () => <span data-testid="spinner" /> }));

describe('UserPageSubscriptionsMode', () => {
  const requestAuth = jest.fn();
  const setToast = jest.fn();
  const refresh = jest.fn();

  const renderComponent = (auto = false) =>
    render(
      <AuthContext.Provider value={{ requestAuth, setToast } as any}>
        <UserPageSubscriptionsMode
          profileKey="p1"
          details={{
            automatic: auto,
            consolidation_key: '',
            last_update: 0,
            balance: 0,
          }}
          readonly={false}
          refresh={refresh}
        />
      </AuthContext.Provider>
    );

  beforeEach(() => {
    jest.clearAllMocks();
    (commonApiPost as jest.Mock).mockResolvedValue({ automatic: true });
    requestAuth.mockResolvedValue({ success: true });
  });

  it('initializes toggle state from props', () => {
    renderComponent(true);
    const toggle = screen.getByRole('checkbox');
    expect(toggle).toBeChecked();
  });

  it('toggles subscription mode on click', async () => {
    renderComponent(false);
    const toggle = screen.getByRole('checkbox');
    fireEvent.click(toggle);
    expect(requestAuth).toHaveBeenCalled();
    await screen.findByRole('checkbox');
    expect(commonApiPost).toHaveBeenCalledWith({
      endpoint: 'subscriptions/p1/subscription-mode',
      body: { automatic: true },
    });
    expect(setToast).toHaveBeenCalled();
    expect(refresh).toHaveBeenCalled();
  });
});
