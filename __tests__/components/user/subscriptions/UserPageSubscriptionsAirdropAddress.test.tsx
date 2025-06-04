import { render, screen } from '@testing-library/react';
import UserPageSubscriptionsAirdropAddress from '../../../../components/user/subscriptions/UserPageSubscriptionsAirdropAddress';
import { MEMES_CONTRACT } from '../../../../constants';
import { AIRDROPS_USE_CASE } from '../../../../pages/delegation/[...section]';

jest.mock('../../../../helpers/Helpers', () => ({ formatAddress: () => 'formatted' }));

describe('UserPageSubscriptionsAirdropAddress', () => {
  const airdrop = {
    airdrop_address: { address: '0x123', ens: 'alice.eth' },
    tdh_wallet: { address: '', ens: '' }
  };

  it('shows address and edit link when allowed', () => {
    render(<UserPageSubscriptionsAirdropAddress show_edit airdrop={airdrop} />);
    expect(screen.getByText('formatted')).toBeInTheDocument();
    expect(screen.getByText(/alice\.eth/)).toBeInTheDocument();
    const link = screen.getByRole('link', { name: /Change airdrop address/i });
    expect(link).toHaveAttribute('href', `/delegation/register-delegation?collection=${MEMES_CONTRACT}&use_case=${AIRDROPS_USE_CASE.use_case}`);
  });

  it('hides edit link when not allowed', () => {
    render(<UserPageSubscriptionsAirdropAddress show_edit={false} airdrop={airdrop} />);
    expect(screen.queryByRole('link', { name: /Change airdrop address/i })).toBeNull();
  });
});
