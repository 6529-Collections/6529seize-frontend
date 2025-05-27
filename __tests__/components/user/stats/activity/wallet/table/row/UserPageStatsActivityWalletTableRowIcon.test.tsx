import { render } from '@testing-library/react';
import UserPageStatsActivityWalletTableRowIcon from '../../../../../../../../components/user/stats/activity/wallet/table/row/UserPageStatsActivityWalletTableRowIcon';
import { TransactionType } from '../../../../../../../../components/user/stats/activity/wallet/table/row/UserPageStatsActivityWalletTableRow';

describe('UserPageStatsActivityWalletTableRowIcon', () => {
  it('renders sale icon for sale transaction', () => {
    const { container } = render(<UserPageStatsActivityWalletTableRowIcon type={TransactionType.SALE} />);
    const svg = container.querySelector('svg');
    expect(svg).toBeInTheDocument();
    expect(svg).toHaveAttribute('viewBox', '0 0 27 27');
  });

  it('renders burn icon for burned transaction', () => {
    const { container } = render(<UserPageStatsActivityWalletTableRowIcon type={TransactionType.BURNED} />);
    const svg = container.querySelector('svg');
    expect(svg).toBeInTheDocument();
    expect(svg).toHaveAttribute('viewBox', '0 0 24 24');
  });
});
