import { render, screen, fireEvent } from '@testing-library/react';
import AppUserConnect from '@/components/header/AppUserConnect';
import React from 'react';

jest.mock('@/components/header/share/HeaderQRScanner', () => () => (
  <div data-testid="scanner" />
));

jest.mock('@/components/auth/SeizeConnectContext', () => ({
  useSeizeConnectContext: jest.fn(),
}));
jest.mock('@/components/header/useChainSwitcher', () => ({
  useChainSwitcher: jest.fn(),
}));

const { useSeizeConnectContext } = require('@/components/auth/SeizeConnectContext');
const { useChainSwitcher } = require('@/components/header/useChainSwitcher');

function setup(address: string | undefined) {
  const seizeConnect = jest.fn();
  const seizeDisconnectAndLogout = jest.fn();
  (useSeizeConnectContext as jest.Mock).mockReturnValue({
    address,
    seizeConnect,
    seizeDisconnectAndLogout,
  });
  (useChainSwitcher as jest.Mock).mockReturnValue({
    chains: [],
    currentChainName: '1',
    switchToNextChain: jest.fn(),
  });
  const onNavigate = jest.fn();
  render(<AppUserConnect onNavigate={onNavigate} />);
  return { seizeConnect, seizeDisconnectAndLogout, onNavigate };
}

describe('AppUserConnect', () => {
  afterEach(() => jest.clearAllMocks());

  it('renders connect button when not connected', () => {
    const { seizeConnect, onNavigate } = setup(undefined);
    const btn = screen.getByRole('button', { name: 'Connect' });
    expect(btn).toBeInTheDocument();
    fireEvent.click(btn);
    expect(seizeConnect).toHaveBeenCalled();
    expect(onNavigate).toHaveBeenCalled();
    expect(screen.getByTestId('scanner')).toBeInTheDocument();
  });

  it('renders disconnect options when connected', () => {
    const { seizeDisconnectAndLogout, onNavigate } = setup('0xabc');
    const switchBtn = screen.getByRole('button', { name: 'Switch Account' });
    const disconnectBtn = screen.getByRole('button', { name: 'Disconnect & Logout' });

    fireEvent.click(switchBtn);
    expect(seizeDisconnectAndLogout).toHaveBeenCalledWith(true);
    expect(onNavigate).toHaveBeenCalled();

    fireEvent.click(disconnectBtn);
    expect(seizeDisconnectAndLogout).toHaveBeenCalledWith();
    expect(onNavigate).toHaveBeenCalledTimes(2);
  });
});
