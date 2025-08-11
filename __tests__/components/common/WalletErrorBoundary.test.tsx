import React from 'react';
import { render, screen } from '@testing-library/react';
import { WalletErrorBoundary } from '../../../components/common/WalletErrorBoundary';
import { WalletInitializationError } from '../../../src/errors/wallet';

// Component that throws an error when shouldThrow is true
const ThrowError: React.FC<{ shouldThrow: boolean; error?: Error }> = ({ shouldThrow, error }) => {
  if (shouldThrow) {
    throw error || new Error('Test error');
  }
  return <div>No error</div>;
};

describe('WalletErrorBoundary', () => {
  // Suppress console.error for these tests since we're intentionally throwing errors
  let consoleSpy: jest.SpyInstance;

  beforeEach(() => {
    consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    consoleSpy.mockRestore();
  });

  it('renders children when no error occurs', () => {
    render(
      <WalletErrorBoundary>
        <ThrowError shouldThrow={false} />
      </WalletErrorBoundary>
    );

    expect(screen.getByText('No error')).toBeInTheDocument();
  });

  it('catches WalletInitializationError and shows specific error UI', () => {
    const walletError = new WalletInitializationError(
      'Test wallet initialization error',
      undefined,
      '0xinvalid...'
    );

    render(
      <WalletErrorBoundary>
        <ThrowError shouldThrow={true} error={walletError} />
      </WalletErrorBoundary>
    );

    expect(screen.getByText('Wallet Connection Error')).toBeInTheDocument();
    expect(screen.getByText(/We detected an issue with your stored wallet information/)).toBeInTheDocument();
    expect(screen.getByText(/Please reconnect your wallet to continue/)).toBeInTheDocument();
    expect(screen.getByText('Retry Connection')).toBeInTheDocument();
  });

  it('catches generic errors and shows default error UI', () => {
    const genericError = new Error('Generic test error');

    render(
      <WalletErrorBoundary>
        <ThrowError shouldThrow={true} error={genericError} />
      </WalletErrorBoundary>
    );

    expect(screen.getByText('Application Error')).toBeInTheDocument();
    expect(screen.getByText(/Something went wrong. Please try refreshing the page/)).toBeInTheDocument();
    expect(screen.getByText('Try Again')).toBeInTheDocument();
    expect(screen.getByText('Refresh Page')).toBeInTheDocument();
  });

  it('shows custom fallback UI when provided', () => {
    const customFallback = <div>Custom error UI</div>;

    render(
      <WalletErrorBoundary fallback={customFallback}>
        <ThrowError shouldThrow={true} />
      </WalletErrorBoundary>
    );

    expect(screen.getByText('Custom error UI')).toBeInTheDocument();
  });

  it('calls onError callback when error occurs', () => {
    const onErrorMock = jest.fn();
    const testError = new Error('Test error');

    render(
      <WalletErrorBoundary onError={onErrorMock}>
        <ThrowError shouldThrow={true} error={testError} />
      </WalletErrorBoundary>
    );

    expect(onErrorMock).toHaveBeenCalledWith(testError, expect.any(Object));
  });

  it('logs WalletInitializationError with sanitized data in production', () => {
    const originalEnv = process.env.NODE_ENV;
    process.env.NODE_ENV = 'production';

    const walletError = new WalletInitializationError(
      'Test wallet initialization error',
      undefined,
      '0x1234567890123456789012345678901234567890'
    );

    render(
      <WalletErrorBoundary>
        <ThrowError shouldThrow={true} error={walletError} />
      </WalletErrorBoundary>
    );

    expect(consoleSpy).toHaveBeenCalledWith(
      '[WALLET_ERROR_BOUNDARY] WalletInitializationError caught:',
      expect.objectContaining({
        errorType: 'WalletInitializationError',
        message: 'Test wallet initialization error',
        addressAttempt: '***REDACTED***',
        stack: undefined, // Should be undefined in production
      })
    );

    process.env.NODE_ENV = originalEnv;
  });

  it('logs WalletInitializationError with full data in development', () => {
    const originalEnv = process.env.NODE_ENV;
    process.env.NODE_ENV = 'development';

    const walletError = new WalletInitializationError(
      'Test wallet initialization error',
      undefined,
      '0x1234567890123456789012345678901234567890'
    );

    render(
      <WalletErrorBoundary>
        <ThrowError shouldThrow={true} error={walletError} />
      </WalletErrorBoundary>
    );

    expect(consoleSpy).toHaveBeenCalledWith(
      '[WALLET_ERROR_BOUNDARY] WalletInitializationError caught:',
      expect.objectContaining({
        errorType: 'WalletInitializationError',
        message: 'Test wallet initialization error',
        addressAttempt: '0x1234567890123456789012345678901234567890',
        stack: expect.any(String), // Should include stack in development
      })
    );

    process.env.NODE_ENV = originalEnv;
  });

  it('retries and clears error state when retry button is clicked', () => {
    const { rerender } = render(
      <WalletErrorBoundary>
        <ThrowError shouldThrow={true} />
      </WalletErrorBoundary>
    );

    // Error UI should be visible
    expect(screen.getByText('Application Error')).toBeInTheDocument();

    // Click retry button
    const retryButton = screen.getByText('Try Again');
    retryButton.click();

    // Re-render with no error
    rerender(
      <WalletErrorBoundary>
        <ThrowError shouldThrow={false} />
      </WalletErrorBoundary>
    );

    // Should show normal content
    expect(screen.getByText('No error')).toBeInTheDocument();
  });

  it('shows error details in development mode only', () => {
    const originalEnv = process.env.NODE_ENV;
    
    // Test in development
    process.env.NODE_ENV = 'development';
    const { unmount } = render(
      <WalletErrorBoundary>
        <ThrowError shouldThrow={true} />
      </WalletErrorBoundary>
    );

    expect(screen.getByText('Error Details (Development Only)')).toBeInTheDocument();
    unmount();

    // Test in production
    process.env.NODE_ENV = 'production';
    render(
      <WalletErrorBoundary>
        <ThrowError shouldThrow={true} />
      </WalletErrorBoundary>
    );

    expect(screen.queryByText('Error Details (Development Only)')).not.toBeInTheDocument();

    process.env.NODE_ENV = originalEnv;
  });
});