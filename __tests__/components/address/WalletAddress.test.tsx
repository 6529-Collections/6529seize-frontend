import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import React from 'react';
import { WalletAddress } from '@/components/address/WalletAddress';

jest.mock('next/link', () => ({ __esModule: true, default: ({ href, children }: any) => <a href={href}>{children}</a> }));


const parseEmojis = jest.fn((s: string) => 'parsed');
const formatAddress = jest.fn((v: string) => `fmt-${v}`);

jest.mock('@/helpers/Helpers', () => ({
  containsEmojis: jest.fn((s: string) => s.includes('U+')),
  parseEmojis: (s: string) => parseEmojis(s),
  formatAddress: (v: string) => formatAddress(v)
}));

describe('WalletAddress', () => {
  beforeEach(() => {
    Object.defineProperty(globalThis.navigator, 'clipboard', {
      configurable: true,
      value: { writeText: jest.fn().mockResolvedValue(undefined) },
    });
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
    await userEvent.click(
      screen.getByRole('button', { name: 'Copy wallet address' })
    );
    expect(navigator.clipboard.writeText).toHaveBeenCalledWith('0xabc');
  });

  it('copies address when toggle clicked with fireEvent', () => {
    render(<WalletAddress wallet="0xabc" display="Bob" />);
    fireEvent.click(
      screen.getByRole('button', { name: 'Copy wallet address' })
    );
    expect((navigator.clipboard.writeText as jest.Mock).mock.calls[0][0]).toBe('0xabc');
  });

  it('parses emoji display names', () => {
    render(<WalletAddress wallet="0x1" display="U+1F60A" hideCopy />);
    expect(parseEmojis).toHaveBeenCalledWith('U+1F60A');
  });

  it('keeps tooltip ids stable across rerenders', () => {
    const { rerender } = render(
      <WalletAddress wallet="0xabc" display="display" />
    );
    const copyButton = screen.getByRole('button', {
      name: 'Copy wallet address',
    });
    const tooltipId = copyButton.getAttribute('data-tooltip-id');

    rerender(<WalletAddress wallet="0xabc" display="display" />);

    expect(
      screen
        .getByRole('button', { name: 'Copy wallet address' })
        .getAttribute('data-tooltip-id')
    ).toBe(tooltipId);
  });

  it('renders accessible ENS copy choices', async () => {
    render(
      <WalletAddress
        wallet="0xabc"
        display="vitalik.eth"
        displayEns="vitalik.eth"
      />
    );

    const copyOptions = screen.getByLabelText('Copy wallet options');
    expect(copyOptions.tagName.toLowerCase()).toBe('summary');

    await userEvent.click(copyOptions);
    fireEvent.click(screen.getByLabelText('Copy ENS name'));

    expect(navigator.clipboard.writeText).toHaveBeenCalledWith('vitalik.eth');
    expect(screen.getByLabelText('Copy wallet address')).toBeInTheDocument();
  });

  it('does not emit max update depth errors for copyable addresses', () => {
    const errorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

    try {
      const { rerender } = render(
        <WalletAddress wallet="0xabc" display="display" />
      );

      rerender(<WalletAddress wallet="0xabc" display="display" />);
      fireEvent.click(
        screen.getByRole('button', { name: 'Copy wallet address' })
      );

      const maxDepthErrors = errorSpy.mock.calls.filter(([message]) =>
        String(message).includes('Maximum update depth exceeded')
      );

      expect(maxDepthErrors).toHaveLength(0);
    } finally {
      errorSpy.mockRestore();
    }
  });
});
