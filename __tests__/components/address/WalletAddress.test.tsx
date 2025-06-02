import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import React from 'react';
import { WalletAddress } from '../../../components/address/WalletAddress';

jest.mock('next/link', () => ({ __esModule: true, default: ({ href, children }: any) => <a href={href}>{children}</a> }));

jest.mock('@tippyjs/react', () => ({ __esModule: true, default: ({ children }: any) => <div>{children}</div> }));

jest.mock('@fortawesome/react-fontawesome', () => ({ FontAwesomeIcon: (p:any) => <svg {...p} data-testid="icon" /> }));

jest.mock('react-bootstrap', () => {
  const Dropdown: any = ({ children }: any) => <div>{children}</div>;
  Dropdown.displayName = 'Dropdown';
  Dropdown.Toggle = (p: any) => <button {...p}>{p.children}</button>;
  Dropdown.Toggle.displayName = 'DropdownToggle';
  Dropdown.Menu = (p: any) => <div>{p.children}</div>;
  Dropdown.Menu.displayName = 'DropdownMenu';
  Dropdown.Item = (p: any) => <button onClick={p.onClick}>{p.children}</button>;
  Dropdown.Item.displayName = 'DropdownItem';
  return { Dropdown };
});

const parseEmojis = jest.fn((s: string) => 'parsed');
const formatAddress = jest.fn((v: string) => `fmt-${v}`);

jest.mock('../../../helpers/Helpers', () => ({
  containsEmojis: jest.fn((s: string) => s.includes('U+')),
  parseEmojis: (s: string) => parseEmojis(s),
  formatAddress: (v: string) => formatAddress(v)
}));

describe('WalletAddress', () => {
  beforeEach(() => {
    (global as any).navigator.clipboard = { writeText: jest.fn() };
  });

  it('renders address link without copy', () => {
    render(<WalletAddress wallet="0xabc" display="display" hideCopy />);
    const link = screen.getByRole('link');
    expect(link).toHaveAttribute('href', '/display');
    expect(link).toHaveTextContent('fmt-display');
  });

  it('renders link with query when requested', () => {
    render(<WalletAddress wallet="0xabc" display="Bob" setLinkQueryAddress />);
    const link = screen.getByRole('link');
    expect(link).toHaveAttribute('href', '/Bob?address=0xabc');
  });

  it('copies wallet address on click with userEvent', async () => {
    render(<WalletAddress wallet="0xabc" display="display" />);
    await userEvent.click(screen.getByLabelText('copy-toggle'));
    expect(navigator.clipboard.writeText).toHaveBeenCalledWith('0xabc');
  });

  it('copies address when toggle clicked with fireEvent', () => {
    render(<WalletAddress wallet="0xabc" display="Bob" />);
    fireEvent.click(screen.getByLabelText('copy-toggle'));
    expect((navigator.clipboard.writeText as jest.Mock).mock.calls[0][0]).toBe('0xabc');
  });

  it('parses emoji display names', () => {
    render(<WalletAddress wallet="0x1" display="U+1F60A" hideCopy />);
    expect(parseEmojis).toHaveBeenCalledWith('U+1F60A');
  });
});
