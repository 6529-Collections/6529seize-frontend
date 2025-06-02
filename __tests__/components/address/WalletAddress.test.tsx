import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import React from 'react';
import { WalletAddress } from '../../../components/address/WalletAddress';

jest.mock('next/link', () => ({ __esModule: true, default: ({ href, children }: any) => <a href={href}>{children}</a> }));

const parseEmojis = jest.fn(() => 'parsed');
const formatAddress = jest.fn((v: string) => `fmt-${v}`);
jest.mock('../../../helpers/Helpers', () => ({
  containsEmojis: jest.fn((s:string)=>s.includes('U+')),
  parseEmojis: (...args: any[]) => parseEmojis(...args),
  formatAddress: (...args: any[]) => formatAddress(...args)
}));

describe('WalletAddress', () => {
  beforeEach(() => {
    Object.assign(navigator, { clipboard: { writeText: jest.fn().mockResolvedValue(undefined) } });
  });

  it('renders address link without copy', () => {
    render(<WalletAddress wallet="0xabc" display="display" hideCopy />);
    const link = screen.getByRole('link');
    expect(link).toHaveAttribute('href', '/display');
    expect(link).toHaveTextContent('fmt-display');
  });

  it('copies wallet address on click', async () => {
    render(<WalletAddress wallet="0xabc" display="display"  />);
    await userEvent.click(screen.getByLabelText('copy-toggle'));
    expect(navigator.clipboard.writeText).toHaveBeenCalledWith('0xabc');
  });

  it('parses emoji display names', () => {
    render(<WalletAddress wallet="0x1" display="U+1F60A" hideCopy />);
    expect(parseEmojis).toHaveBeenCalledWith('U+1F60A');
  });
});
