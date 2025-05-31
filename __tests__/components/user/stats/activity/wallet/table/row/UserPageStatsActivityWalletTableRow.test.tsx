import { render, screen } from '@testing-library/react';
import UserPageStatsActivityWalletTableRow from '../../../../../../../../components/user/stats/activity/wallet/table/row/UserPageStatsActivityWalletTableRow';
jest.mock('../../../../../../../../components/user/stats/activity/wallet/table/row/UserPageStatsActivityWalletTableRowIcon', () => () => <div data-testid="icon" />);
jest.mock('../../../../../../../../components/user/stats/activity/wallet/table/row/UserPageStatsActivityWalletTableRowMainAddress', () => () => <div data-testid="main" />);
jest.mock('../../../../../../../../components/user/stats/activity/wallet/table/row/UserPageStatsActivityWalletTableRowSecondAddress', () => () => <div data-testid="second" />);
jest.mock('../../../../../../../../components/user/stats/activity/wallet/table/row/UserPageStatsActivityWalletTableRowGas', () => () => <div data-testid="gas" />);
jest.mock('../../../../../../../../components/user/stats/activity/wallet/table/row/UserPageStatsActivityWalletTableRowRoyalties', () => () => <div data-testid="roy" />);

jest.mock('next/link', () => ({ __esModule: true, default: ({ href, children }: any) => <a href={href}>{children}</a> }));

describe('UserPageStatsActivityWalletTableRow', () => {
  const profile: any = { wallets: [{ wallet: '0xabc' }] };
  const memes: any[] = [{ id: '1', name: 'meme', icon: 'm.png' }];
  const nextgens: any[] = [];

  const baseTx: any = {
    transaction_date: 1,
    from_address: '0xabc',
    to_address: '0xdef',
    contract: '0x33FD426905F149f8376e227d0C9D3340AaD17aF1',
    token_id: '1',
    value: 2,
    token_count: 1,
  };

  it('renders sale info with value and link', () => {
    render(
      <table><tbody>
        <UserPageStatsActivityWalletTableRow transaction={baseTx} profile={profile} memes={memes} nextgenCollections={nextgens} />
      </tbody></table>
    );
    expect(screen.getByText('sold')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'meme' })).toHaveAttribute('href', '/the-memes/1');
    expect(screen.getByText('2')).toBeInTheDocument();
  });
});
