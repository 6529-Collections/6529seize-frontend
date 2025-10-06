import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import UserPageStatsActivityWalletFilterItem from '@/components/user/stats/activity/wallet/filter/UserPageStatsActivityWalletFilterItem';

enum FilterType { ALL = 'ALL', SENT = 'SENT' }

describe('UserPageStatsActivityWalletFilterItem', () => {
  it('calls onFilter when clicked', async () => {
    const onFilter = jest.fn();
    render(
      <UserPageStatsActivityWalletFilterItem
        filter={FilterType.ALL as any}
        title="All"
        activeFilter={FilterType.SENT as any}
        onFilter={onFilter}
      />
    );
    await userEvent.click(screen.getByText('All'));
    expect(onFilter).toHaveBeenCalledWith(FilterType.ALL);
  });

  it('shows check mark when active', () => {
    const { container } = render(
      <UserPageStatsActivityWalletFilterItem
        filter={FilterType.ALL as any}
        title="All"
        activeFilter={FilterType.ALL as any}
        onFilter={jest.fn()}
      />
    );
    expect(container.querySelector('svg')).not.toBeNull();
  });
});
