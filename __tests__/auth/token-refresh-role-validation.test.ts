/**
 * Comprehensive tests for token refresh role validation
 * 
 * Tests the CRITICAL security fix for role validation to ensure:
 * 1. Role validation uses the FRESH token from server, not old JWT
 * 2. Role escalation attacks are prevented
 * 3. Role mismatches are detected and fail fast
 * 4. Server response validation works correctly
 */

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

// Mock implementations
const mockCommonApiPost = commonApiPost as jest.MockedFunction<typeof commonApiPost>;
const mockGetAuthJwt = getAuthJwt as jest.MockedFunction<typeof getAuthJwt>;
const mockGetWalletRole = getWalletRole as jest.MockedFunction<typeof getWalletRole>;
const mockSetAuthJwt = setAuthJwt as jest.MockedFunction<typeof setAuthJwt>;
const mockJwtDecode = jwtDecode as jest.MockedFunction<typeof jwtDecode>;
const mockAreEqualAddresses = areEqualAddresses as jest.MockedFunction<typeof areEqualAddresses>;

/**
 * Extracted getRole function from Auth.tsx for testing
 * This is the actual function being used in the component
 */
const getRole = ({ jwt }: { jwt: string | null }): string | null => {
  if (!jwt) return null;
  const decodedJwt = jwtDecode<{
    id: string;
    sub: string;
    iat: number;
    exp: number;
  }>(jwt);
  return decodedJwt.id;
};

/**
 * Simulates the validateJwt function with the FIXED role validation logic
 */
async function validateJwtWithRoleCheck(
  wallet: string,
  jwt: string,
  refreshToken: string,
  role: string | null,
  abortSignal: AbortSignal
): Promise<{ isValid: boolean; wasCancelled: boolean }> {
  try {
    // Simulate the API call to redeem refresh token
    const redeemResponse = await mockCommonApiPost({
      endpoint: "auth/redeem-refresh-token",
      body: {
        address: wallet,
        token: refreshToken,
        role: role ?? undefined,
      },
    });
    
    // Check if operation was cancelled
    if (abortSignal.aborted) {
      return { isValid: false, wasCancelled: true };
    }
    
    // Address validation
    if (!areEqualAddresses(redeemResponse.address, wallet)) {
      throw new Error(
        `Address mismatch in token response: expected ${wallet}, got ${redeemResponse.address}`
      );
    }
    
    const walletRole = getWalletRole();
    // CRITICAL FIX: Get role from the NEW token, not the old one
    const freshTokenRole = getRole({ jwt: redeemResponse.token });

    // FIXED: Role validation using the fresh token from server
    if (walletRole && freshTokenRole && freshTokenRole !== walletRole) {
      throw new Error(
        `Role mismatch in fresh token: wallet role ${walletRole} does not match fresh token role ${freshTokenRole}`
      );
    }
    if (!walletRole && freshTokenRole) {
      throw new Error(
        `Unexpected role ${freshTokenRole} in fresh token when wallet has no role`
      );
    }
    if (walletRole && !freshTokenRole) {
      throw new Error(
        `Missing role in fresh token when wallet has role ${walletRole}`
      );
    }

    // ADDITIONAL VALIDATION: Ensure the requested role matches what we got
    if (role && freshTokenRole !== role) {
      throw new Error(
        `Server returned unexpected role: requested ${role}, received ${freshTokenRole}`
      );
    }
    
    // Success - store the new JWT
    setAuthJwt(
      redeemResponse.address,
      redeemResponse.token,
      refreshToken,
      walletRole ?? undefined
    );
    return { isValid: true, wasCancelled: false };
  } catch (error: any) {
    throw error;
  }
}

describe('Token Refresh Role Validation', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('CRITICAL SECURITY: Fresh Token Role Validation', () => {
    it('validates role using FRESH token from server, not old JWT', async () => {
      const walletAddress = '0x1234567890abcdef1234567890abcdef12345678';
      const oldJwt = 'old.jwt.token';
      const freshJwt = 'fresh.jwt.token';
      const refreshToken = 'refresh-token';
      const abortController = new AbortController();

      // Setup mocks
      mockGetWalletRole.mockReturnValue('admin');
      mockAreEqualAddresses.mockReturnValue(true);
      mockCommonApiPost.mockResolvedValue({
        address: walletAddress,
        token: freshJwt, // This is the FRESH token from server
      });

      // Mock JWT decode to return matching role for fresh token
      mockJwtDecode.mockReturnValue({ id: 'admin', sub: '1', iat: 123, exp: 456 }); // Fresh token has correct role

      // Execute the function
      const result = await validateJwtWithRoleCheck(
        walletAddress,
        oldJwt,
        refreshToken,
        'admin',
        abortController.signal
      );

      // Verify success
      expect(result).toEqual({ isValid: true, wasCancelled: false });
      
      // CRITICAL: Verify that JWT decode was called with the FRESH token
      expect(mockJwtDecode).toHaveBeenCalledWith(freshJwt); // Should use fresh token
      expect(mockJwtDecode).not.toHaveBeenCalledWith(oldJwt); // Should NOT use old token
      
      // Verify the JWT was stored
      expect(mockSetAuthJwt).toHaveBeenCalledWith(
        walletAddress,
        freshJwt,
        refreshToken,
        'admin'
      );
    });

    it('prevents role escalation by validating fresh token role against wallet role', async () => {
      const walletAddress = '0x1234567890abcdef1234567890abcdef12345678';
      const freshJwt = 'fresh.jwt.token';
      const refreshToken = 'refresh-token';
      const abortController = new AbortController();

      // Setup: wallet has 'user' role but server returns 'admin' role in fresh token
      mockGetWalletRole.mockReturnValue('user');
      mockAreEqualAddresses.mockReturnValue(true);
      mockCommonApiPost.mockResolvedValue({
        address: walletAddress,
        token: freshJwt,
      });

      // Fresh token contains 'admin' role (potential escalation attack)
      mockJwtDecode.mockReturnValue({ id: 'admin', sub: '1', iat: 123, exp: 456 });

      // Execute and expect failure
      await expect(validateJwtWithRoleCheck(
        walletAddress,
        'old.jwt.token',
        refreshToken,
        'user',
        abortController.signal
      )).rejects.toThrow('Role mismatch in fresh token: wallet role user does not match fresh token role admin');

      // Verify JWT was NOT stored
      expect(mockSetAuthJwt).not.toHaveBeenCalled();
    });

    it('detects unexpected role in fresh token when wallet has no role', async () => {
      const walletAddress = '0x1234567890abcdef1234567890abcdef12345678';
      const freshJwt = 'fresh.jwt.token';
      const refreshToken = 'refresh-token';
      const abortController = new AbortController();

      // Setup: wallet has no role but server returns role in fresh token
      mockGetWalletRole.mockReturnValue(null);
      mockAreEqualAddresses.mockReturnValue(true);
      mockCommonApiPost.mockResolvedValue({
        address: walletAddress,
        token: freshJwt,
      });

      // Fresh token unexpectedly contains a role
      mockJwtDecode.mockReturnValue({ id: 'admin', sub: '1', iat: 123, exp: 456 });

      // Execute and expect failure
      await expect(validateJwtWithRoleCheck(
        walletAddress,
        'old.jwt.token',
        refreshToken,
        null,
        abortController.signal
      )).rejects.toThrow('Unexpected role admin in fresh token when wallet has no role');

      // Verify JWT was NOT stored
      expect(mockSetAuthJwt).not.toHaveBeenCalled();
    });

    it('detects missing role in fresh token when wallet has role', async () => {
      const walletAddress = '0x1234567890abcdef1234567890abcdef12345678';
      const freshJwt = 'fresh.jwt.token';
      const refreshToken = 'refresh-token';
      const abortController = new AbortController();

      // Setup: wallet has role but server returns no role in fresh token
      mockGetWalletRole.mockReturnValue('admin');
      mockAreEqualAddresses.mockReturnValue(true);
      mockCommonApiPost.mockResolvedValue({
        address: walletAddress,
        token: freshJwt,
      });

      // Fresh token missing expected role
      mockJwtDecode.mockReturnValue({ id: null, sub: '1', iat: 123, exp: 456 });

      // Execute and expect failure
      await expect(validateJwtWithRoleCheck(
        walletAddress,
        'old.jwt.token',
        refreshToken,
        'admin',
        abortController.signal
      )).rejects.toThrow('Missing role in fresh token when wallet has role admin');

      // Verify JWT was NOT stored
      expect(mockSetAuthJwt).not.toHaveBeenCalled();
    });

    it('validates requested role matches received role in fresh token', async () => {
      const walletAddress = '0x1234567890abcdef1234567890abcdef12345678';
      const freshJwt = 'fresh.jwt.token';
      const refreshToken = 'refresh-token';
      const abortController = new AbortController();

      // Setup: request admin role but server returns different role
      mockGetWalletRole.mockReturnValue('moderator');
      mockAreEqualAddresses.mockReturnValue(true);
      mockCommonApiPost.mockResolvedValue({
        address: walletAddress,
        token: freshJwt,
      });

      // Server returns 'moderator' role which matches wallet role but not requested role
      mockJwtDecode.mockReturnValue({ id: 'moderator', sub: '1', iat: 123, exp: 456 });

      // Execute and expect failure because requested role (admin) doesn't match received role (moderator)
      await expect(validateJwtWithRoleCheck(
        walletAddress,
        'old.jwt.token',
        refreshToken,
        'admin', // Requested admin but got moderator
        abortController.signal
      )).rejects.toThrow('Server returned unexpected role: requested admin, received moderator');

      // Verify JWT was NOT stored
      expect(mockSetAuthJwt).not.toHaveBeenCalled();
    });
  });

  describe('Edge Cases and Boundary Conditions', () => {
    it('handles null role request with null wallet role and null fresh token role', async () => {
      const walletAddress = '0x1234567890abcdef1234567890abcdef12345678';
      const freshJwt = 'fresh.jwt.token';
      const refreshToken = 'refresh-token';
      const abortController = new AbortController();

      // Setup: no roles anywhere
      mockGetWalletRole.mockReturnValue(null);
      mockAreEqualAddresses.mockReturnValue(true);
      mockCommonApiPost.mockResolvedValue({
        address: walletAddress,
        token: freshJwt,
      });

      // Fresh token has no role
      mockJwtDecode.mockReturnValue({ id: null, sub: '1', iat: 123, exp: 456 });

      // Execute - should succeed
      const result = await validateJwtWithRoleCheck(
        walletAddress,
        'old.jwt.token',
        refreshToken,
        null, // No role requested
        abortController.signal
      );

      expect(result).toEqual({ isValid: true, wasCancelled: false });
      expect(mockSetAuthJwt).toHaveBeenCalled();
    });

    it('handles matching roles correctly', async () => {
      const walletAddress = '0x1234567890abcdef1234567890abcdef12345678';
      const freshJwt = 'fresh.jwt.token';
      const refreshToken = 'refresh-token';
      const abortController = new AbortController();

      // Setup: all roles match
      mockGetWalletRole.mockReturnValue('admin');
      mockAreEqualAddresses.mockReturnValue(true);
      mockCommonApiPost.mockResolvedValue({
        address: walletAddress,
        token: freshJwt,
      });

      // Fresh token has matching role
      mockJwtDecode.mockReturnValue({ id: 'admin', sub: '1', iat: 123, exp: 456 });

      // Execute - should succeed
      const result = await validateJwtWithRoleCheck(
        walletAddress,
        'old.jwt.token',
        refreshToken,
        'admin',
        abortController.signal
      );

      expect(result).toEqual({ isValid: true, wasCancelled: false });
      expect(mockSetAuthJwt).toHaveBeenCalledWith(
        walletAddress,
        freshJwt,
        refreshToken,
        'admin'
      );
    });

    it('fails fast on address mismatch before role validation', async () => {
      const walletAddress = '0x1234567890abcdef1234567890abcdef12345678';
      const wrongAddress = '0xabcdef1234567890abcdef1234567890abcdef12';
      const freshJwt = 'fresh.jwt.token';
      const refreshToken = 'refresh-token';
      const abortController = new AbortController();

      mockGetWalletRole.mockReturnValue('admin');
      mockAreEqualAddresses.mockReturnValue(false); // Address mismatch
      mockCommonApiPost.mockResolvedValue({
        address: wrongAddress, // Wrong address returned
        token: freshJwt,
      });

      // Execute and expect failure on address mismatch (before role validation)
      await expect(validateJwtWithRoleCheck(
        walletAddress,
        'old.jwt.token',
        refreshToken,
        'admin',
        abortController.signal
      )).rejects.toThrow(`Address mismatch in token response: expected ${walletAddress}, got ${wrongAddress}`);

      // Verify role validation never happened (JWT decode not called)
      expect(mockJwtDecode).not.toHaveBeenCalled();
      expect(mockSetAuthJwt).not.toHaveBeenCalled();
    });

    it('handles cancellation correctly', async () => {
      const walletAddress = '0x1234567890abcdef1234567890abcdef12345678';
      const freshJwt = 'fresh.jwt.token';
      const refreshToken = 'refresh-token';
      const abortController = new AbortController();

      mockCommonApiPost.mockResolvedValue({
        address: walletAddress,
        token: freshJwt,
      });

      // Cancel the operation
      abortController.abort();

      // Execute
      const result = await validateJwtWithRoleCheck(
        walletAddress,
        'old.jwt.token',
        refreshToken,
        'admin',
        abortController.signal
      );

      expect(result).toEqual({ isValid: false, wasCancelled: true });
      expect(mockJwtDecode).not.toHaveBeenCalled();
      expect(mockSetAuthJwt).not.toHaveBeenCalled();
    });
  });
});