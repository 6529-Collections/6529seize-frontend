import { render, screen } from '@testing-library/react';
import UserPageStatsActivityWalletTableRowRoyalties from '../../../../../../../../components/user/stats/activity/wallet/table/row/UserPageStatsActivityWalletTableRowRoyalties';

jest.mock('react-tooltip', () => ({
  Tooltip: ({ children, id }: any) => (
    <div data-testid={`tooltip-${id}`}>
      {children}
    </div>
  ),
}));

describe('UserPageStatsActivityWalletTableRowRoyalties', () => {
  it('returns null when no royalties', () => {
    const { container } = render(<UserPageStatsActivityWalletTableRowRoyalties royalties={0} transactionValue={1} />);
    expect(container.firstChild).toBeNull();
  });

  it('shows smile icon below threshold', () => {
    render(<UserPageStatsActivityWalletTableRowRoyalties royalties={0.05} transactionValue={1} />);
    expect(screen.getByAltText('pepe-smile')).toBeInTheDocument();
    expect(screen.getByTestId('tooltip-royalties-below-threshold').textContent).toContain('Royalties:');
  });

  it('shows xglasses icon above threshold', () => {
    render(<UserPageStatsActivityWalletTableRowRoyalties royalties={0.1} transactionValue={1} />);
    expect(screen.getByAltText('pepe-xglasses')).toBeInTheDocument();
  });
});
