import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import HeaderUserProxyDropdown from '../../../../../components/header/user/proxy/HeaderUserProxyDropdown';
import { AuthContext } from '../../../../../components/auth/Auth';

jest.mock('../../../../../components/header/user/proxy/HeaderUserProxyDropdownItem', () => () => <div data-testid="item" />);
jest.mock('../../../../../components/header/user/proxy/HeaderUserProxyDropdownChains', () => () => <div data-testid="chains" />);
jest.mock('../../../../../components/auth/SeizeConnectContext');

const { useSeizeConnectContext: mockConnect } = require('../../../../../components/auth/SeizeConnectContext');

const profileBase = {
  handle: 'alice',
  wallets: [{ wallet: '0xabc', display: 'Alice' }],
} as any;

function renderDropdown(options: any) {
  mockConnect.mockReturnValue({
    address: options.address,
    isConnected: options.isConnected,
    seizeConnect: options.seizeConnect || jest.fn(),
    seizeDisconnect: options.seizeDisconnect || jest.fn(),
    seizeDisconnectAndLogout: jest.fn(),
  });
  const authValue = {
    activeProfileProxy: null,
    setActiveProfileProxy: jest.fn(),
    receivedProfileProxies: [],
  } as any;
  const onClose = jest.fn();
  render(
    <AuthContext.Provider value={authValue}>
      <HeaderUserProxyDropdown isOpen profile={options.profile} onClose={onClose} />
    </AuthContext.Provider>
  );
  return { onClose, ...authValue, ...mockConnect.mock.results[0].value };
}

afterEach(() => jest.clearAllMocks());

describe('HeaderUserProxyDropdown', () => {
  it('shows profile handle as label', () => {
    renderDropdown({ profile: profileBase, address: '0xabc', isConnected: true });
    expect(screen.getByText('alice')).toBeInTheDocument();
  });

  it('connects wallet when not connected', () => {
    const seizeConnect = jest.fn();
    const { onClose } = renderDropdown({ profile: profileBase, address: '0xabc', isConnected: false, seizeConnect });
    fireEvent.click(screen.getAllByRole('button', { name: /connect/i })[0]);
    expect(seizeConnect).toHaveBeenCalled();
    expect(onClose).toHaveBeenCalled();
  });

  it('disconnects wallet when connected', () => {
    const seizeDisconnect = jest.fn();
    const { onClose } = renderDropdown({ profile: profileBase, address: '0xabc', isConnected: true, seizeDisconnect });
    fireEvent.click(screen.getAllByRole('button', { name: /disconnect/i })[0]);
    expect(seizeDisconnect).toHaveBeenCalled();
    expect(onClose).toHaveBeenCalled();
  });

  it('falls back to wallet display when no handle', () => {
    const profile = { ...profileBase, handle: null };
    renderDropdown({ profile, address: '0xabc', isConnected: true });
    expect(screen.getByText('Alice')).toBeInTheDocument();
  });
});
