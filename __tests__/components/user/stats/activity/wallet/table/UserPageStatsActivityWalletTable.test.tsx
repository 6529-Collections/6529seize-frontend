import { render, screen } from '@testing-library/react';
import UserPageStatsActivityWalletTable from '@/components/user/stats/activity/wallet/table/UserPageStatsActivityWalletTable';
import { ApiIdentity } from '@/generated/models/ApiIdentity';
import { Transaction } from '@/entities/ITransaction';

jest.mock('@/components/user/stats/activity/wallet/table/row/UserPageStatsActivityWalletTableRow', () => ({
  __esModule: true,
  default: jest.fn(() => <tr data-testid="row" />)
}));

const RowMock = require('@/components/user/stats/activity/wallet/table/row/UserPageStatsActivityWalletTableRow').default as jest.Mock;

describe('UserPageStatsActivityWalletTable', () => {
  it('renders a row for each transaction', () => {
    const transactions: Transaction[] = [
      { from_address: '0x1', to_address: '0x2', transaction: 'tx1', token_id: 1, block: 1, transaction_date: new Date(), created_at: new Date(), from_display: '', to_display: '', contract: '', token_count: 1, value: 0, royalties: 0, gas_gwei: 1, gas_price: 1, gas_price_gwei: 1, gas: 1 },
      { from_address: '0x3', to_address: '0x4', transaction: 'tx2', token_id: 2, block: 2, transaction_date: new Date(), created_at: new Date(), from_display: '', to_display: '', contract: '', token_count: 1, value: 0, royalties: 0, gas_gwei: 1, gas_price: 1, gas_price_gwei: 1, gas: 1 }
    ];
    const profile = { handle: 'alice' } as ApiIdentity;
    render(<UserPageStatsActivityWalletTable transactions={transactions} profile={profile} memes={[]} nextgenCollections={[]} />);
    expect(RowMock).toHaveBeenCalledTimes(2);
    expect(screen.getAllByTestId('row')).toHaveLength(2);
  });
});
