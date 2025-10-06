import React from 'react';
import { renderHook, act } from '@testing-library/react';
import { useAppWalletPasswordModal } from '@/hooks/useAppWalletPasswordModal';

// Mock the UnlockAppWalletModal component
const MockUnlockAppWalletModal = jest.fn(({ show, onHide, onUnlock, address, address_hashed }) => (
  show ? (
    <div data-testid="unlock-modal">
      <div data-testid="modal-address">{address}</div>
      <div data-testid="modal-address-hashed">{address_hashed}</div>
      <button data-testid="cancel-button" onClick={onHide}>
        Cancel
      </button>
      <button 
        data-testid="unlock-button" 
        onClick={() => onUnlock('test-password')}
      >
        Unlock
      </button>
    </div>
  ) : null
));

jest.mock('@/components/app-wallets/AppWalletModal', () => ({
  UnlockAppWalletModal: MockUnlockAppWalletModal,
}));

describe('useAppWalletPasswordModal', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('initializes with correct default values', () => {
    const { result } = renderHook(() => useAppWalletPasswordModal());

    expect(result.current.requestPassword).toBeDefined();
    expect(result.current.modal).toBeDefined();
    expect(typeof result.current.requestPassword).toBe('function');
  });

  it('renders modal with correct initial state (closed)', () => {
    const { result } = renderHook(() => useAppWalletPasswordModal());

    // Modal should not be shown initially
    expect(result.current.modal.props.show).toBe(false);
    expect(result.current.modal.props.address).toBe('');
    expect(result.current.modal.props.address_hashed).toBe('');
  });

  it('opens modal when requestPassword is called', async () => {
    const { result } = renderHook(() => useAppWalletPasswordModal());

    const testAddress = '0x1234567890abcdef';
    const testAddressHashed = 'hashed-address-123';

    let passwordPromise: Promise<string>;

    act(() => {
      passwordPromise = result.current.requestPassword(testAddress, testAddressHashed);
    });

    // Modal should be open with correct props
    expect(result.current.modal.props.show).toBe(true);
    expect(result.current.modal.props.address).toBe(testAddress);
    expect(result.current.modal.props.address_hashed).toBe(testAddressHashed);

    // Promise should be pending
    expect(passwordPromise!).toBeInstanceOf(Promise);
  });

  it('resolves promise with password when onUnlock is called', async () => {
    const { result } = renderHook(() => useAppWalletPasswordModal());

    const testAddress = '0x1234567890abcdef';
    const testAddressHashed = 'hashed-address-123';

    let passwordPromise: Promise<string>;

    act(() => {
      passwordPromise = result.current.requestPassword(testAddress, testAddressHashed);
    });

    act(() => {
      result.current.modal.props.onUnlock('test-password');
    });

    const resolvedPassword = await passwordPromise!;
    expect(resolvedPassword).toBe('test-password');
    
    // Modal should be closed after unlock
    expect(result.current.modal.props.show).toBe(false);
    expect(result.current.modal.props.address).toBe('');
    expect(result.current.modal.props.address_hashed).toBe('');
  });

  it('rejects promise when onHide (cancel) is called', async () => {
    const { result } = renderHook(() => useAppWalletPasswordModal());

    const testAddress = '0x1234567890abcdef';
    const testAddressHashed = 'hashed-address-123';

    let passwordPromise: Promise<string>;

    act(() => {
      passwordPromise = result.current.requestPassword(testAddress, testAddressHashed);
    });

    // Simulate cancel
    let rejectionError: Error;
    passwordPromise!.catch((error) => {
      rejectionError = error;
    });

    act(() => {
      result.current.modal.props.onHide();
    });

    await act(async () => {
      try {
        await passwordPromise!;
      } catch (error) {
        // Expected to be rejected
      }
    });

    expect(rejectionError!).toBeInstanceOf(Error);
    expect(rejectionError!.message).toBe('Password entry canceled.');
    
    // Modal should be closed after cancel
    expect(result.current.modal.props.show).toBe(false);
    expect(result.current.modal.props.address).toBe('');
    expect(result.current.modal.props.address_hashed).toBe('');
  });

  it('handles multiple sequential password requests', async () => {
    const { result } = renderHook(() => useAppWalletPasswordModal());

    // First request
    const firstAddress = '0x1111';
    const firstAddressHashed = 'hash1';
    
    let firstPromise: Promise<string>;
    act(() => {
      firstPromise = result.current.requestPassword(firstAddress, firstAddressHashed);
    });

    expect(result.current.modal.props.address).toBe(firstAddress);
    expect(result.current.modal.props.address_hashed).toBe(firstAddressHashed);

    // Resolve first request
    act(() => {
      result.current.modal.props.onUnlock('password1');
    });

    const firstPassword = await firstPromise!;
    expect(firstPassword).toBe('password1');

    // Second request
    const secondAddress = '0x2222';
    const secondAddressHashed = 'hash2';
    
    let secondPromise: Promise<string>;
    act(() => {
      secondPromise = result.current.requestPassword(secondAddress, secondAddressHashed);
    });

    expect(result.current.modal.props.address).toBe(secondAddress);
    expect(result.current.modal.props.address_hashed).toBe(secondAddressHashed);

    // Resolve second request
    act(() => {
      result.current.modal.props.onUnlock('password2');
    });

    const secondPassword = await secondPromise!;
    expect(secondPassword).toBe('password2');
  });

  it('handles rejection and subsequent success', async () => {
    const { result } = renderHook(() => useAppWalletPasswordModal());

    // First request - reject it
    let firstPromise: Promise<string>;
    act(() => {
      firstPromise = result.current.requestPassword('0x1111', 'hash1');
    });

    let firstRejected = false;
    firstPromise!.catch(() => {
      firstRejected = true;
    });

    act(() => {
      result.current.modal.props.onHide();
    });

    await act(async () => {
      try {
        await firstPromise!;
      } catch (error) {
        // Expected rejection
      }
    });

    expect(firstRejected).toBe(true);

    // Second request - succeed it
    let secondPromise: Promise<string>;
    act(() => {
      secondPromise = result.current.requestPassword('0x2222', 'hash2');
    });

    act(() => {
      result.current.modal.props.onUnlock('success-password');
    });

    const successPassword = await secondPromise!;
    expect(successPassword).toBe('success-password');
  });

  it('cleans up state correctly when modal is closed', async () => {
    const { result } = renderHook(() => useAppWalletPasswordModal());

    // Open modal
    let passwordPromise: Promise<string>;
    act(() => {
      passwordPromise = result.current.requestPassword('0x1234', 'hash1234');
    });

    expect(result.current.modal.props.show).toBe(true);
    expect(result.current.modal.props.address).toBe('0x1234');
    expect(result.current.modal.props.address_hashed).toBe('hash1234');

    // Handle the rejection when we close the modal
    passwordPromise!.catch(() => {
      // Expected rejection
    });

    // Close modal via cancel
    act(() => {
      result.current.modal.props.onHide();
    });

    // Wait for the promise to be rejected
    await act(async () => {
      try {
        await passwordPromise!;
      } catch (error) {
        // Expected rejection
      }
    });

    expect(result.current.modal.props.show).toBe(false);
    expect(result.current.modal.props.address).toBe('');
    expect(result.current.modal.props.address_hashed).toBe('');
  });

  it('provides function references that work consistently', () => {
    const { result, rerender } = renderHook(() => useAppWalletPasswordModal());

    const initialRequestPassword = result.current.requestPassword;

    rerender();

    // The function reference may change but should still be a function
    expect(typeof result.current.requestPassword).toBe('function');
    expect(typeof initialRequestPassword).toBe('function');
  });

  it('handles edge case with empty address values', async () => {
    const { result } = renderHook(() => useAppWalletPasswordModal());

    let passwordPromise: Promise<string>;
    act(() => {
      passwordPromise = result.current.requestPassword('', '');
    });

    expect(result.current.modal.props.show).toBe(true);
    expect(result.current.modal.props.address).toBe('');
    expect(result.current.modal.props.address_hashed).toBe('');

    act(() => {
      result.current.modal.props.onUnlock('empty-address-password');
    });

    const password = await passwordPromise!;
    expect(password).toBe('empty-address-password');
  });

  it('handles promise resolution without resolve function', () => {
    const { result } = renderHook(() => useAppWalletPasswordModal());

    // Manually close modal without going through normal flow
    act(() => {
      // This simulates the internal closeModal function being called
      // when resolve is undefined (edge case)
      if (result.current.modal.props.onUnlock) {
        result.current.modal.props.onUnlock('test');
      }
    });

    // Should not throw error
    expect(result.current.modal.props.show).toBe(false);
  });

  it('handles promise rejection without reject function', () => {
    const { result } = renderHook(() => useAppWalletPasswordModal());

    // Manually call onHide without active promise
    act(() => {
      if (result.current.modal.props.onHide) {
        result.current.modal.props.onHide();
      }
    });

    // Should not throw error
    expect(result.current.modal.props.show).toBe(false);
  });

  it('provides correct modal props structure', () => {
    const { result } = renderHook(() => useAppWalletPasswordModal());

    const modal = result.current.modal;

    expect(modal.props).toHaveProperty('show');
    expect(modal.props).toHaveProperty('address');
    expect(modal.props).toHaveProperty('address_hashed');
    expect(modal.props).toHaveProperty('onHide');
    expect(modal.props).toHaveProperty('onUnlock');

    expect(typeof modal.props.onHide).toBe('function');
    expect(typeof modal.props.onUnlock).toBe('function');
  });
});
