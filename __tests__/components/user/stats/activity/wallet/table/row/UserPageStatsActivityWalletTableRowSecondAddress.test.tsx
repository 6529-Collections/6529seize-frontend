import React from 'react';
import { render, screen } from '@testing-library/react';
import UserPageStatsActivityWalletTableRowSecondAddress from '../../../../../../../../components/user/stats/activity/wallet/table/row/UserPageStatsActivityWalletTableRowSecondAddress';
import { TransactionType } from '../../../../../../../../components/user/stats/activity/wallet/table/row/UserPageStatsActivityWalletTableRow';

jest.mock('next/link', () => ({ __esModule: true, default: ({ href, children }:any) => <a href={href}>{children}</a> }));

jest.mock('../../../../../../../../helpers/Helpers', () => ({
  formatAddress: (a: string) => `fmt-${a}`,
  getProfileTargetRoute: ({ handleOrWallet }: any) => `/p/${handleOrWallet}`,
}));

jest.mock('next/router', () => ({ useRouter: () => ({ route: '/[user]' }) }));

describe('UserPageStatsActivityWalletTableRowSecondAddress', () => {
  const baseTx = { from_display: 'Alice', from_address: '0xabc', to_display: 'Bob', to_address: '0xdef' } as any;

  it('shows from address for purchase', () => {
    render(<UserPageStatsActivityWalletTableRowSecondAddress transaction={baseTx} type={TransactionType.PURCHASE} />);
    expect(screen.getByText('from')).toBeInTheDocument();
    const link = screen.getByRole('link');
    expect(link).toHaveAttribute('href', '/p/0xabc');
    expect(link).toHaveTextContent('Alice');
  });

  it('shows to address for sale', () => {
    render(<UserPageStatsActivityWalletTableRowSecondAddress transaction={baseTx} type={TransactionType.SALE} />);
    const link = screen.getByRole('link');
    expect(link).toHaveAttribute('href', '/p/0xdef');
    expect(link).toHaveTextContent('Bob');
  });
});
