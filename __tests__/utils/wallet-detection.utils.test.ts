/**
 * Tests for wallet detection utilities
 */

import { detectConnectedWallet, useWalletDetection } from '../../src/utils/wallet-detection.utils';
import { renderHook } from '@testing-library/react';

// Mock window.ethereum for testing
const mockWindowEthereum = (provider: any) => {
  Object.defineProperty(window, 'ethereum', {
    writable: true,
    value: provider,
  });
};

describe('detectConnectedWallet', () => {
  beforeEach(() => {
    // Clear any existing ethereum mock
    delete (window as any).ethereum;
  });

  it('returns default wallet info when window.ethereum is not available', () => {
    const result = detectConnectedWallet();
    
    expect(result).toEqual({
      name: 'Unknown Wallet',
      isSafe: false,
    });
  });

  it('detects MetaMask correctly', () => {
    mockWindowEthereum({
      isMetaMask: true,
      selectedAddress: '0x123...',
    });

    const result = detectConnectedWallet();
    
    expect(result.name).toBe('MetaMask');
    expect(result.isSafe).toBe(false);
  });

  it('detects Coinbase Wallet correctly', () => {
    mockWindowEthereum({
      isCoinbaseWallet: true,
      selectedAddress: '0x123...',
    });

    const result = detectConnectedWallet();
    
    expect(result.name).toBe('Coinbase Wallet');
    expect(result.isSafe).toBe(false);
  });

  it('detects Safe Wallet correctly', () => {
    mockWindowEthereum({
      isSafe: true,
      selectedAddress: '0x123...',
    });

    const result = detectConnectedWallet();
    
    expect(result.name).toBe('Safe Wallet');
    expect(result.isSafe).toBe(true);
  });

  it('detects Trust Wallet correctly', () => {
    mockWindowEthereum({
      isTrust: true,
      selectedAddress: '0x123...',
    });

    const result = detectConnectedWallet();
    
    expect(result.name).toBe('Trust Wallet');
    expect(result.isSafe).toBe(false);
  });

  it('handles multiple providers array correctly', () => {
    mockWindowEthereum({
      providers: [
        { isMetaMask: true, selectedAddress: '0x123...' },
        { isCoinbaseWallet: true },
      ],
    });

    const result = detectConnectedWallet();
    
    // Should detect the first provider with selectedAddress
    expect(result.name).toBe('MetaMask');
    expect(result.isSafe).toBe(false);
  });

  it('returns Connected Wallet for unknown connected providers', () => {
    mockWindowEthereum({
      selectedAddress: '0x123...',
      // No specific wallet flags
    });

    const result = detectConnectedWallet();
    
    expect(result.name).toBe('Connected Wallet');
    expect(result.isSafe).toBe(false);
  });

  it('handles detection errors gracefully', () => {
    // Mock provider that throws on property access
    mockWindowEthereum({
      get isMetaMask() {
        throw new Error('Access denied');
      },
    });

    const consoleSpy = jest.spyOn(console, 'warn').mockImplementation();

    const result = detectConnectedWallet();
    
    expect(result).toEqual({
      name: 'Unknown Wallet',
      isSafe: false,
    });
    expect(consoleSpy).toHaveBeenCalledWith('Wallet detection failed:', expect.any(Error));

    consoleSpy.mockRestore();
  });

  it('detects Brave Wallet correctly and prioritizes over MetaMask flag', () => {
    mockWindowEthereum({
      isMetaMask: true, // Brave also sets this
      isBraveWallet: true,
      selectedAddress: '0x123...',
    });

    const result = detectConnectedWallet();
    
    expect(result.name).toBe('Brave Wallet');
    expect(result.isSafe).toBe(false);
  });

  it('detects Rabby Wallet correctly and prioritizes over MetaMask flag', () => {
    mockWindowEthereum({
      isMetaMask: true, // Rabby also sets this
      isRabby: true,
      selectedAddress: '0x123...',
    });

    const result = detectConnectedWallet();
    
    expect(result.name).toBe('Rabby Wallet');
    expect(result.isSafe).toBe(false);
  });

  it('detects Rainbow Wallet correctly', () => {
    mockWindowEthereum({
      isRainbow: true,
      selectedAddress: '0x123...',
    });

    const result = detectConnectedWallet();
    
    expect(result.name).toBe('Rainbow Wallet');
    expect(result.isSafe).toBe(false);
  });

  it('handles accounts array for connection detection', () => {
    mockWindowEthereum({
      isMetaMask: true,
      accounts: ['0x123...'],
    });

    const result = detectConnectedWallet();
    
    expect(result.name).toBe('MetaMask');
  });

  it('prioritizes Safe detection over other wallets', () => {
    mockWindowEthereum({
      isMetaMask: true,
      isSafe: true,
      selectedAddress: '0x123...',
    });

    const result = detectConnectedWallet();
    
    expect(result.name).toBe('Safe Wallet');
    expect(result.isSafe).toBe(true);
  });

  it('handles WalletConnect detection', () => {
    mockWindowEthereum({
      isWalletConnect: true,
      selectedAddress: '0x123...',
    });

    const result = detectConnectedWallet();
    
    expect(result.name).toBe('WalletConnect');
    expect(result.isSafe).toBe(false);
  });

  it('handles WalletConnect detection via connector ID', () => {
    mockWindowEthereum({
      connector: { id: 'walletConnect' },
      selectedAddress: '0x123...',
    });

    const result = detectConnectedWallet();
    
    expect(result.name).toBe('WalletConnect');
    expect(result.isSafe).toBe(false);
  });

  it('detects Coinbase Wallet via isWalletLink flag', () => {
    mockWindowEthereum({
      isWalletLink: true,
      selectedAddress: '0x123...',
    });

    const result = detectConnectedWallet();
    
    expect(result.name).toBe('Coinbase Wallet');
    expect(result.isSafe).toBe(false);
  });

  it('detects Trust Wallet via isTrustWallet flag', () => {
    mockWindowEthereum({
      isTrustWallet: true,
      selectedAddress: '0x123...',
    });

    const result = detectConnectedWallet();
    
    expect(result.name).toBe('Trust Wallet');
    expect(result.isSafe).toBe(false);
  });

  it('handles multiple providers correctly', () => {
    mockWindowEthereum({
      providers: [
        { isCoinbaseWallet: true },
        { isMetaMask: true, selectedAddress: '0x123...' },
      ],
    });

    const result = detectConnectedWallet();
    
    expect(result.name).toBe('MetaMask');
  });

  it('handles null provider in providers array gracefully', () => {
    const consoleSpy = jest.spyOn(console, 'warn').mockImplementation();
    
    mockWindowEthereum({
      providers: [
        null,
        { isMetaMask: true, selectedAddress: '0x123...' }
      ],
    });

    const result = detectConnectedWallet();
    
    // Should fail gracefully when encountering null provider and return default
    expect(result.name).toBe('Unknown Wallet');
    expect(result.isSafe).toBe(false);
    expect(consoleSpy).toHaveBeenCalledWith('Wallet detection failed:', expect.any(TypeError));

    consoleSpy.mockRestore();
  });

  it('handles server-side rendering safely', () => {
    const originalWindow = global.window;
    delete (global as any).window;

    const result = detectConnectedWallet();

    expect(result.name).toBe('Unknown Wallet');
    expect(result.isSafe).toBe(false);

    global.window = originalWindow;
  });

  it('detects Safe by _metamask.isSafe flag', () => {
    mockWindowEthereum({
      _metamask: { isSafe: true },
      selectedAddress: '0x123...',
    });

    const result = detectConnectedWallet();
    
    expect(result.name).toBe('Safe Wallet');
    expect(result.isSafe).toBe(true);
  });

  it('handles circular references without issues', () => {
    const circularProvider: any = {
      selectedAddress: '0x123...',
      isMetaMask: true,
    };
    circularProvider.self = circularProvider;

    mockWindowEthereum(circularProvider);

    const result = detectConnectedWallet();
    
    expect(result.name).toBe('MetaMask');
  });
});

describe('useWalletDetection Hook', () => {
  beforeEach(() => {
    delete (window as any).ethereum;
  });

  it('returns default info when not connected', () => {
    const { result } = renderHook(() => useWalletDetection(false));
    
    expect(result.current).toEqual({
      name: 'Unknown Wallet',
      isSafe: false,
    });
  });

  it('detects wallet when connected', () => {
    mockWindowEthereum({
      isMetaMask: true,
      selectedAddress: '0x123...',
    });

    const { result } = renderHook(() => useWalletDetection(true));
    
    expect(result.current.name).toBe('MetaMask');
    expect(result.current.isSafe).toBe(false);
  });

  it('updates when connection status changes', () => {
    mockWindowEthereum({
      isMetaMask: true,
      selectedAddress: '0x123...',
    });

    const { result, rerender } = renderHook(
      ({ connected }) => useWalletDetection(connected),
      { initialProps: { connected: false } }
    );
    
    expect(result.current.name).toBe('Unknown Wallet');
    
    rerender({ connected: true });
    expect(result.current.name).toBe('MetaMask');
    
    rerender({ connected: false });
    expect(result.current.name).toBe('Unknown Wallet');
  });

  it('handles Safe wallet detection through hook', () => {
    mockWindowEthereum({
      isSafe: true,
      selectedAddress: '0x123...',
    });

    const { result } = renderHook(() => useWalletDetection(true));
    
    expect(result.current.name).toBe('Safe Wallet');
    expect(result.current.isSafe).toBe(true);
  });
});

describe('Advanced Safe Wallet Detection', () => {
  beforeEach(() => {
    delete (window as any).ethereum;
  });

  it('detects Safe via iframe context and hostname', () => {
    // Mock iframe environment with Safe hostname
    const originalParent = window.parent;
    const originalLocation = window.location;
    
    Object.defineProperty(window, 'parent', {
      value: {}, // Different from window to simulate iframe
      writable: true,
      configurable: true
    });
    
    Object.defineProperty(window, 'location', {
      value: { hostname: 'app.safe.global' },
      writable: true,
      configurable: true
    });

    mockWindowEthereum({ 
      selectedAddress: '0x123...',
    });
    
    const result = detectConnectedWallet();
    expect(result.name).toBe('Safe Wallet');
    expect(result.isSafe).toBe(true);

    // Restore original values
    Object.defineProperty(window, 'parent', {
      value: originalParent,
      writable: true,
      configurable: true
    });
    Object.defineProperty(window, 'location', {
      value: originalLocation,
      writable: true,
      configurable: true
    });
  });

  it('detects Safe via custom safe property', () => {
    mockWindowEthereum({
      safe: {},
      selectedAddress: '0x123...',
    });

    const result = detectConnectedWallet();
    expect(result.name).toBe('Safe Wallet');
    expect(result.isSafe).toBe(true);
  });

  it('detects Safe via constructor name SafeProvider', () => {
    const mockProvider = {
      selectedAddress: '0x123...',
      constructor: { name: 'SafeProvider' }
    };
    mockWindowEthereum(mockProvider);

    const result = detectConnectedWallet();
    expect(result.name).toBe('Safe Wallet');
    expect(result.isSafe).toBe(true);
  });

  it('detects Safe via isSafeProvider flag', () => {
    mockWindowEthereum({
      isSafeProvider: true,
      selectedAddress: '0x123...',
    });

    const result = detectConnectedWallet();
    expect(result.name).toBe('Safe Wallet');
    expect(result.isSafe).toBe(true);
  });

  it('detects Safe via _safe property', () => {
    mockWindowEthereum({
      _safe: {},
      selectedAddress: '0x123...',
    });

    const result = detectConnectedWallet();
    expect(result.name).toBe('Safe Wallet');
    expect(result.isSafe).toBe(true);
  });

  it('detects Safe via user agent containing Safe', () => {
    const originalUserAgent = navigator.userAgent;
    Object.defineProperty(navigator, 'userAgent', {
      value: 'Mozilla/5.0 (Safe Wallet)',
      writable: true,
      configurable: true
    });

    mockWindowEthereum({
      selectedAddress: '0x123...',
    });

    const result = detectConnectedWallet();
    expect(result.name).toBe('Safe Wallet');
    expect(result.isSafe).toBe(true);

    // Restore original user agent
    Object.defineProperty(navigator, 'userAgent', {
      value: originalUserAgent,
      writable: true,
      configurable: true
    });
  });

  // Security tests for hostname validation
  it('rejects malicious hostname with Safe domain in path', () => {
    const originalParent = window.parent;
    const originalLocation = window.location;
    
    Object.defineProperty(window, 'parent', {
      value: {}, // Different from window to simulate iframe
      writable: true,
      configurable: true
    });
    
    Object.defineProperty(window, 'location', {
      value: { hostname: 'evil-site.com' }, // Malicious site pretending to be Safe
      writable: true,
      configurable: true
    });

    mockWindowEthereum({
      selectedAddress: '0x123...',
    });
    
    const result = detectConnectedWallet();
    expect(result.name).not.toBe('Safe Wallet');
    expect(result.isSafe).toBe(false);

    // Restore original values
    Object.defineProperty(window, 'parent', {
      value: originalParent,
      writable: true,
      configurable: true
    });
    Object.defineProperty(window, 'location', {
      value: originalLocation,
      writable: true,
      configurable: true
    });
  });

  it('rejects malicious hostname with Safe domain as prefix', () => {
    const originalParent = window.parent;
    const originalLocation = window.location;
    
    Object.defineProperty(window, 'parent', {
      value: {}, // Different from window to simulate iframe
      writable: true,
      configurable: true
    });
    
    Object.defineProperty(window, 'location', {
      value: { hostname: 'app.safe.global.malicious-site.com' }, // Subdomain attack
      writable: true,
      configurable: true
    });

    mockWindowEthereum({
      selectedAddress: '0x123...',
    });
    
    const result = detectConnectedWallet();
    expect(result.name).not.toBe('Safe Wallet');
    expect(result.isSafe).toBe(false);

    // Restore original values
    Object.defineProperty(window, 'parent', {
      value: originalParent,
      writable: true,
      configurable: true
    });
    Object.defineProperty(window, 'location', {
      value: originalLocation,
      writable: true,
      configurable: true
    });
  });

  it('accepts legitimate Safe subdomains', () => {
    const originalParent = window.parent;
    const originalLocation = window.location;
    
    Object.defineProperty(window, 'parent', {
      value: {}, // Different from window to simulate iframe
      writable: true,
      configurable: true
    });
    
    Object.defineProperty(window, 'location', {
      value: { hostname: 'staging.app.safe.global' }, // Legitimate subdomain
      writable: true,
      configurable: true
    });

    mockWindowEthereum({
      selectedAddress: '0x123...',
    });
    
    const result = detectConnectedWallet();
    expect(result.name).toBe('Safe Wallet');
    expect(result.isSafe).toBe(true);

    // Restore original values
    Object.defineProperty(window, 'parent', {
      value: originalParent,
      writable: true,
      configurable: true
    });
    Object.defineProperty(window, 'location', {
      value: originalLocation,
      writable: true,
      configurable: true
    });
  });
});