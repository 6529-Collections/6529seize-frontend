import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import UserSettingsPrimaryWalletItem from '@/components/user/settings/UserSettingsPrimaryWalletItem';
import type { ApiWallet } from '@/generated/models/ApiWallet';

const wallet: ApiWallet = {
  wallet: '0xabc',
  display: '0xabc',
  tdh: 10,
} as any;

describe('UserSettingsPrimaryWalletItem', () => {
  it('displays check icon when selected and handles click', async () => {
    const onSelect = jest.fn();
    const { rerender } = render(
      <UserSettingsPrimaryWalletItem wallet={wallet} selected='0xabc' onSelect={onSelect} />
    );
    const item = screen.getByRole('listitem');
    expect(item.querySelector('svg')).toBeInTheDocument();

    await userEvent.click(item);
    expect(onSelect).toHaveBeenCalledWith('0xabc');

    rerender(
      <UserSettingsPrimaryWalletItem wallet={wallet} selected='0xdef' onSelect={onSelect} />
    );
    expect(screen.getByRole('listitem').querySelector('svg')).toBeNull();
  });
});
