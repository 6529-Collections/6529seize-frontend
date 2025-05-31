import { render, screen } from '@testing-library/react';
import UserPageStatsActivityDistributionsTable from '../../../../../../components/user/stats/activity/distributions/UserPageStatsActivityDistributionsTable';

jest.mock('../../../../../../components/user/stats/activity/distributions/UserPageStatsActivityDistributionsTableItem', () => (props: any) => (
  <tr data-testid="item">{props.item.name}</tr>
));

const items = [
  {
    card_id: 1,
    contract: '0x33FD426905F149f8376e227d0C9D3340AaD17aF1',
    wallet: '0x1',
    wallet_display: 'A',
    card_name: 'Card1',
    mint_date: '2020-01-01',
    airdrops: 1,
    total_spots: 0,
    minted: 2,
    allowlist: [{ phase: 'phase1', spots: 3 }],
    total_count: 5,
    phases: ['phase1', 'AIRDROP'],
  },
  {
    card_id: 2,
    contract: '0x0C58Ef43fF3032005e472cB5709f8908aCb00205',
    wallet: '0x2',
    wallet_display: 'B',
    card_name: 'Card2',
    mint_date: '2020-01-02',
    airdrops: 0,
    total_spots: 0,
    minted: 1,
    allowlist: [],
    total_count: 3,
    phases: ['phase1'],
  },
];

const profile = { wallets: [{ wallet: '0x1', display: 'disp1' }] } as any;

test('renders rows and phases', () => {
  render(<UserPageStatsActivityDistributionsTable items={items} profile={profile} loading={false} />);
  expect(screen.getAllByTestId('item')).toHaveLength(2);
  expect(screen.getByText('Phase1')).toBeInTheDocument();
  expect(screen.getByText('Airdrop')).toBeInTheDocument();
});
