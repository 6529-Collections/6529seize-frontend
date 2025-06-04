import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import UserPageActivityTabs from '../../../../../../components/user/stats/activity/tabs/UserPageActivityTabs';
import { USER_PAGE_ACTIVITY_TAB } from '../../../../../../components/user/stats/activity/UserPageActivityWrapper';

jest.mock('../../../../../../components/user/stats/activity/tabs/UserPageActivityTab', () => ({ __esModule: true, default: (props: any) => (
  <button data-testid={props.tab} onClick={() => props.setActiveTab(props.tab)}>{props.tab}</button>
) }));

describe('UserPageActivityTabs', () => {
  it('renders all tabs and handles click', async () => {
    const user = userEvent.setup();
    const setActive = jest.fn();
    render(<UserPageActivityTabs activeTab={USER_PAGE_ACTIVITY_TAB.DISTRIBUTIONS} setActiveTab={setActive} />);
    const walletBtn = screen.getByTestId(USER_PAGE_ACTIVITY_TAB.WALLET_ACTIVITY);
    expect(walletBtn).toBeInTheDocument();
    await user.click(walletBtn);
    expect(setActive).toHaveBeenCalledWith(USER_PAGE_ACTIVITY_TAB.WALLET_ACTIVITY);
  });
});
