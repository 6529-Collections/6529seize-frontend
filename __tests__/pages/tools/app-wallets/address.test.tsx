import React from 'react';
import { render, screen } from '@testing-library/react';
import Page, { getServerSideProps } from '../../../../pages/tools/app-wallets/[app-wallet-address]';
import { AuthContext } from '../../../../components/auth/Auth';
import { formatAddress } from '../../../../helpers/Helpers';

jest.mock('next/dynamic', () => () => (p: any) => <div data-testid="wallet" {...p} />);

jest.mock('../../../../helpers/Helpers', () => ({
  formatAddress: jest.fn((a: string) => `fmt-${a}`),
}));

const mockedFormat = formatAddress as jest.Mock;

const renderPage = (address: string, setTitle: jest.Mock) =>
  render(
    <AuthContext.Provider value={{ setTitle } as any}>
      <Page pageProps={{ address }} />
    </AuthContext.Provider>
  );

describe('App Wallet page', () => {
  it('sets title and passes address', () => {
    const setTitle = jest.fn();
    renderPage('0xabc', setTitle);
    expect(screen.getByTestId('wallet')).toHaveAttribute('address', '0xabc');
    expect(setTitle).toHaveBeenCalledWith({ title: 'fmt-0xabc | App Wallets | 6529.io' });
  });

  it('getServerSideProps returns metadata', async () => {
    const ctx = { query: { 'app-wallet-address': '0xdef' } } as any;
    const res = await getServerSideProps(ctx, null as any, '/p');
    expect(res).toEqual({
      props: {
        address: '0xdef',
        metadata: { title: 'fmt-0xdef | App Wallets' },
      },
    });
  });
});
