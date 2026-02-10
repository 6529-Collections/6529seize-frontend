import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import Address from '@/components/address/Address';

jest.mock('next/image', () => ({ __esModule: true, default: (p:any) => <img {...p} /> }));

jest.mock('@fortawesome/react-fontawesome', () => ({ FontAwesomeIcon: (p:any) => <svg {...p} /> }));

jest.mock('@/helpers/Helpers', () => ({
  numberWithCommas: (n:number) => String(n),
  parseEmojis: (s:string) => s,
}));

jest.mock('@/components/address/WalletAddress', () => ({
  WalletAddress: (props: any) => <div data-testid="wallet" {...props}>{props.display}</div>
}));

jest.mock('react-bootstrap', () => {
  const Dropdown: any = ({ children }:any) => <div>{children}</div>;
  Dropdown.Toggle = (p:any) => <button {...p}>{p.children}</button>;
  Dropdown.Menu = (p:any) => <div>{p.children}</div>;
  return { Dropdown };
});

const baseTags = {
  memesCardsSets:0,
  memesCardsSetS1:0,
  memesCardsSetS2:0,
  memesCardsSetS3:0,
  memesCardsSetS4:0,
  memesCardsSetS5:0,
  memesCardsSetS6:0,
  memesBalance:0,
  genesis:0,
  gradientsBalance:0,
};

describe('Address component', () => {
  it('renders single wallet via WalletAddress', () => {
    render(<Address wallets={['0x1']} display="Alice" />);
    expect(screen.getByTestId('wallet')).toHaveTextContent('Alice');
  });

  it('expands and shows all wallets when dropdown image clicked', async () => {
    const user = userEvent.setup();
    render(<Address wallets={['0x1','0x2']} display="A - B" />);
    expect(screen.queryAllByTestId('wallet')).toHaveLength(0);
    await user.click(screen.getByAltText('consolidation'));
    const wallets = screen.getAllByTestId('wallet');
    expect(wallets).toHaveLength(2);
    expect(wallets[0]).toHaveTextContent('0x1');
    expect(wallets[1]).toHaveTextContent('0x2');
  });

  it('shows rank tag when expandedTags true', () => {
    render(<Address wallets={['0x1']} display="A" tags={{...baseTags, balance_rank:1}} expandedTags />);
    expect(screen.getByText('All Cards Rank #1')).toBeInTheDocument();
  });
});
