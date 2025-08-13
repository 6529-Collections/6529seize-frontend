/**
 * Comprehensive tests for token refresh functionality
 * 
 * Tests the fail-fast authentication system to ensure:
 * 1. All error conditions throw appropriate errors
 * 2. No silent failures or null returns
 * 3. Proper error classification and handling
 * 4. Race condition and cancellation handling
 */

// Import error classes directly
import { 
  TokenRefreshError,
  TokenRefreshCancelledError,
  TokenRefreshNetworkError,
  TokenRefreshServerError 
} from '../../errors/authentication';

// Mock the API functions
jest.mock('../../services/api/common-api', () => ({
  commonApiPost: jest.fn(),
}));

// Mock auth utilities
jest.mock('../../services/auth/auth.utils', () => ({
  getAuthJwt: jest.fn(),
  getRefreshToken: jest.fn(),
  getWalletAddress: jest.fn(),
  getWalletRole: jest.fn(),
  setAuthJwt: jest.fn(),
  removeAuthJwt: jest.fn(),
}));

// Mock jwt-decode
jest.mock('jwt-decode', () => ({
  jwtDecode: jest.fn(),
}));

// Mock helpers
jest.mock('../../helpers/Helpers', () => ({
  areEqualAddresses: jest.fn(),
}));

import { commonApiPost } from '../../services/api/common-api';
import { 
  getAuthJwt, 
  getRefreshToken, 
  getWalletAddress, 
  getWalletRole,
  setAuthJwt 
} from '../../services/auth/auth.utils';
import { jwtDecode } from 'jwt-decode';
import { areEqualAddresses } from '../../helpers/Helpers';
import { redeemRefreshTokenWithRetries } from '../../services/auth/token-refresh.utils';

describe('Token Refresh Error Classes', () => {
  test('TokenRefreshError base class', () => {
    const error = new TokenRefreshError('Test error', 'cause');
    expect(error).toBeInstanceOf(Error);
    expect(error.name).toBe('TokenRefreshError');
    expect(error.message).toBe('Test error');
    expect(error.cause).toBe('cause');
  });

  test('TokenRefreshCancelledError', () => {
    const error = new TokenRefreshCancelledError('Custom message');
    expect(error).toBeInstanceOf(Error);
    expect(error.name).toBe('TokenRefreshCancelledError');
    expect(error.message).toBe('Custom message');
  });

  test('TokenRefreshNetworkError', () => {
    const cause = new Error('Network failure');
    const error = new TokenRefreshNetworkError('Network error', cause);
    expect(error).toBeInstanceOf(Error);
    expect(error.name).toBe('TokenRefreshNetworkError');
    expect(error.cause).toBe(cause);
  });

  test('TokenRefreshServerError with status code', () => {
    const serverResponse = { error: 'Invalid token' };
    const error = new TokenRefreshServerError(
      'Server error', 
      401, 
      serverResponse, 
      'cause'
    );
    expect(error).toBeInstanceOf(Error);
    expect(error.name).toBe('TokenRefreshServerError');
    expect(error.statusCode).toBe(401);
    expect(error.serverResponse).toBe(serverResponse);
  });
});

describe('redeemRefreshTokenWithRetries - Input Validation', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('throws TokenRefreshError for empty walletAddress', async () => {
    await expect(redeemRefreshTokenWithRetries('', 'token', null))
      .rejects.toThrow('Invalid walletAddress: must be non-empty string');
  });

  test('throws TokenRefreshError for non-string walletAddress', async () => {
    await expect(redeemRefreshTokenWithRetries(123 as any, 'token', null))
      .rejects.toThrow('Invalid walletAddress: must be non-empty string');
  });

  test('throws TokenRefreshError for invalid address format', async () => {
    await expect(redeemRefreshTokenWithRetries('0x123', 'token', null))
      .rejects.toThrow('Invalid wallet address format: 0x123');
  });

  test('throws TokenRefreshError for empty refreshToken', async () => {
    await expect(redeemRefreshTokenWithRetries('0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045', '', null))
      .rejects.toThrow('Invalid refreshToken: must be non-empty string');
  });

  test('throws TokenRefreshError for invalid retryCount', async () => {
    await expect(redeemRefreshTokenWithRetries('0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045', 'token', null, 0))
      .rejects.toThrow('Invalid retryCount: must be between 1 and 10');
    
    await expect(redeemRefreshTokenWithRetries('0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045', 'token', null, 11))
      .rejects.toThrow('Invalid retryCount: must be between 1 and 10');
  });

  test('throws TokenRefreshCancelledError when aborted before starting', async () => {
    const controller = new AbortController();
    controller.abort();
    
    await expect(redeemRefreshTokenWithRetries('0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045', 'token', null, 3, controller.signal))
      .rejects.toThrow('Operation cancelled before starting');
  });
});

describe('redeemRefreshTokenWithRetries - Network Error Handling', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('classifies network errors correctly', async () => {
    const networkError = new Error('Connection failed') as any;
    networkError.code = 'ECONNREFUSED';
    
    (commonApiPost as jest.Mock).mockRejectedValue(networkError);

    await expect(redeemRefreshTokenWithRetries('0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045', 'token', null, 1))
      .rejects.toThrow('Network error on attempt 1: Connection failed');
  });

  test('retries on network errors', async () => {
    const networkError = new Error('DNS lookup failed') as any;
    networkError.code = 'ENOTFOUND';
    
    (commonApiPost as jest.Mock)
      .mockRejectedValueOnce(networkError)
      .mockRejectedValueOnce(networkError)
      .mockResolvedValueOnce({
        token: 'new-token',
        address: '0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045'
      });

    const result = await redeemRefreshTokenWithRetries('0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045', 'token', null, 3);
    expect(result.token).toBe('new-token');
    expect(commonApiPost).toHaveBeenCalledTimes(3);
  });

  test('fails after max retries with network error', async () => {
    const networkError = new Error('Timeout') as any;
    networkError.code = 'ETIMEDOUT';
    
    (commonApiPost as jest.Mock).mockRejectedValue(networkError);

    await expect(redeemRefreshTokenWithRetries('0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045', 'token', null, 2))
      .rejects.toThrow('Network error on attempt 2: Timeout');
    
    expect(commonApiPost).toHaveBeenCalledTimes(2);
  });
});

describe('redeemRefreshTokenWithRetries - Server Error Handling', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('classifies server errors correctly', async () => {
    const serverError = new Error('Unauthorized') as any;
    serverError.status = 401;
    serverError.response = { error: 'Invalid token' };
    
    (commonApiPost as jest.Mock).mockRejectedValue(serverError);

    await expect(redeemRefreshTokenWithRetries('0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045', 'token', null, 1))
      .rejects.toThrow('Server error 401 on attempt 1: Unauthorized');
    
    const error = await redeemRefreshTokenWithRetries('0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045', 'token', null, 1)
      .catch(e => e);
    expect(error.statusCode).toBe(401);
    expect(error.serverResponse).toEqual({ error: 'Invalid token' });
  });

  test('handles 5xx server errors', async () => {
    const serverError = new Error('Internal Server Error') as any;
    serverError.status = 500;
    
    (commonApiPost as jest.Mock).mockRejectedValue(serverError);

    await expect(redeemRefreshTokenWithRetries('0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045', 'token', null, 1))
      .rejects.toThrow('Server error 500 on attempt 1: Internal Server Error');
  });
});

describe('redeemRefreshTokenWithRetries - Response Validation', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('throws TokenRefreshServerError for null response', async () => {
    (commonApiPost as jest.Mock).mockResolvedValue(null);

    await expect(redeemRefreshTokenWithRetries('0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045', 'token', null, 1))
      .rejects.toThrow('Server returned null/undefined response');
  });

  test('throws TokenRefreshServerError for invalid token in response', async () => {
    (commonApiPost as jest.Mock).mockResolvedValue({
      token: null,
      address: '0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045'
    });

    await expect(redeemRefreshTokenWithRetries('0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045', 'token', null, 1))
      .rejects.toThrow('Server returned invalid token');
  });

  test('throws TokenRefreshServerError for invalid address in response', async () => {
    (commonApiPost as jest.Mock).mockResolvedValue({
      token: 'valid-token',
      address: ''
    });

    await expect(redeemRefreshTokenWithRetries('0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045', 'token', null, 1))
      .rejects.toThrow('Server returned invalid address');
  });

  test('accepts valid response', async () => {
    (commonApiPost as jest.Mock).mockResolvedValue({
      token: 'valid-token',
      address: '0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045'
    });

    const result = await redeemRefreshTokenWithRetries('0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045', 'token', null, 1);
    expect(result.token).toBe('valid-token');
    expect(result.address).toBe('0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045');
  });
});

describe('redeemRefreshTokenWithRetries - Cancellation Handling', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('handles cancellation during request', async () => {
    const controller = new AbortController();
    
    (commonApiPost as jest.Mock).mockImplementation(() => {
      const error = new Error('Request aborted');
      error.name = 'AbortError';
      throw error;
    });

    await expect(redeemRefreshTokenWithRetries('0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045', 'token', null, 3, controller.signal))
      .rejects.toThrow(TokenRefreshCancelledError);
  });

  test('handles cancellation between retries', async () => {
    const controller = new AbortController();
    let callCount = 0;
    
    (commonApiPost as jest.Mock).mockImplementation(async () => {
      callCount++;
      if (callCount === 1) {
        // Fail the first attempt, then abort the controller
        controller.abort();
        throw new Error('First attempt fails');
      }
      // This should not be reached as the controller is aborted
      throw new Error('This should not be reached');
    });

    await expect(redeemRefreshTokenWithRetries('0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045', 'token', null, 3, controller.signal))
      .rejects.toThrow(TokenRefreshCancelledError);
  });
});

describe('redeemRefreshTokenWithRetries - Success Cases', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('succeeds on first attempt', async () => {
    (commonApiPost as jest.Mock).mockResolvedValue({
      token: 'success-token',
      address: '0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045'
    });

    const result = await redeemRefreshTokenWithRetries('0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045', 'refresh-token', 'user-role');
    
    expect(result.token).toBe('success-token');
    expect(result.address).toBe('0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045');
    expect(commonApiPost).toHaveBeenCalledWith({
      endpoint: 'auth/redeem-refresh-token',
      body: {
        address: '0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045',
        token: 'refresh-token',
        role: 'user-role',
      },
      signal: undefined,
    });
  });

  test('succeeds after retries', async () => {
    (commonApiPost as jest.Mock)
      .mockRejectedValueOnce(new Error('First fail'))
      .mockRejectedValueOnce(new Error('Second fail'))
      .mockResolvedValueOnce({
        token: 'retry-success-token',
        address: '0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045'
      });

    const result = await redeemRefreshTokenWithRetries('0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045', 'retry-token', null, 3);
    
    expect(result.token).toBe('retry-success-token');
    expect(result.address).toBe('0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045');
    expect(commonApiPost).toHaveBeenCalledTimes(3);
  });

  test('handles null role correctly', async () => {
    (commonApiPost as jest.Mock).mockResolvedValue({
      token: 'null-role-token',
      address: '0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045'
    });

    await redeemRefreshTokenWithRetries('0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045', 'token', null);
    
    expect(commonApiPost).toHaveBeenCalledWith({
      endpoint: 'auth/redeem-refresh-token',
      body: {
        address: '0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045',
        token: 'token',
        role: undefined,
      },
      signal: undefined,
    });
  });
});

describe('redeemRefreshTokenWithRetries - Type Safety', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('enforces string types for parameters', async () => {
    // TypeScript should catch these at compile time, but we test runtime behavior
    await expect(redeemRefreshTokenWithRetries(null as any, 'token', null))
      .rejects.toThrow('Invalid walletAddress: must be non-empty string');
    
    await expect(redeemRefreshTokenWithRetries('0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045', undefined as any, null))
      .rejects.toThrow('Invalid refreshToken: must be non-empty string');
  });

  test('returns strongly typed response', async () => {
    (commonApiPost as jest.Mock).mockResolvedValue({
      token: 'typed-token',
      address: '0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045'
    });

    const result = await redeemRefreshTokenWithRetries('0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045', 'token', null);
    
    // TypeScript should infer these properties exist
    expect(typeof result.token).toBe('string');
    expect(typeof result.address).toBe('string');
  });
});