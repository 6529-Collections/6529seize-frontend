import { jwtDecode } from 'jwt-decode';
import {
  getRole,
  doJWTValidation,
  validateJwt,
  validateJwtInputs,
  validateProxyRole,
  synchronizeRoles,
  handleTokenRefresh,
} from '../../../services/auth/jwt-validation.utils';
import {
  getAuthJwt,
  getRefreshToken,
  getWalletAddress,
  getWalletRole,
  setAuthJwt,
  syncWalletRoleWithServer,
} from '../../../services/auth/auth.utils';
import { redeemRefreshTokenWithRetries } from '../../../services/auth/token-refresh.utils';
import { areEqualAddresses } from '../../../helpers/Helpers';
import { validateRoleForAuthentication } from '../../../utils/role-validation';
import { logErrorSecurely } from '../../../utils/error-sanitizer';
import {
  TokenRefreshCancelledError,
  AuthenticationRoleError,
  RoleValidationError,
  MissingActiveProfileError,
  InvalidRoleStateError,
} from '../../../errors/authentication';
import { ApiProfileProxy } from '../../../generated/models/ApiProfileProxy';

// Mock all dependencies
jest.mock('jwt-decode');
jest.mock('../../../services/auth/auth.utils');
jest.mock('../../../services/auth/token-refresh.utils');
jest.mock('../../../helpers/Helpers');
jest.mock('../../../utils/role-validation');
jest.mock('../../../utils/error-sanitizer');

const mockedJwtDecode = jwtDecode as jest.MockedFunction<typeof jwtDecode>;
const mockedGetAuthJwt = getAuthJwt as jest.MockedFunction<typeof getAuthJwt>;
const mockedGetRefreshToken = getRefreshToken as jest.MockedFunction<typeof getRefreshToken>;
const mockedGetWalletAddress = getWalletAddress as jest.MockedFunction<typeof getWalletAddress>;
const mockedGetWalletRole = getWalletRole as jest.MockedFunction<typeof getWalletRole>;
const mockedSetAuthJwt = setAuthJwt as jest.MockedFunction<typeof setAuthJwt>;
const mockedSyncWalletRoleWithServer = syncWalletRoleWithServer as jest.MockedFunction<typeof syncWalletRoleWithServer>;
const mockedRedeemRefreshTokenWithRetries = redeemRefreshTokenWithRetries as jest.MockedFunction<typeof redeemRefreshTokenWithRetries>;
const mockedAreEqualAddresses = areEqualAddresses as jest.MockedFunction<typeof areEqualAddresses>;
const mockedValidateRoleForAuthentication = validateRoleForAuthentication as jest.MockedFunction<typeof validateRoleForAuthentication>;
const mockedLogErrorSecurely = logErrorSecurely as jest.MockedFunction<typeof logErrorSecurely>;

describe('jwt-validation.utils', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.spyOn(Date, 'now').mockReturnValue(1000000 * 1000); // Mock current time
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('getRole', () => {
    it('should return null when JWT is null', () => {
      const result = getRole(null);
      expect(result).toBeNull();
    });

    it('should extract role from valid JWT', () => {
      const mockPayload = {
        id: 'user-id',
        sub: '0x123',
        iat: 1000000,
        exp: 2000000,
        role: 'admin'
      };
      mockedJwtDecode.mockReturnValue(mockPayload);

      const result = getRole('valid-jwt-token');

      expect(jwtDecode).toHaveBeenCalledWith('valid-jwt-token');
      expect(result).toBe('admin');
    });

    it('should throw error for invalid JWT', () => {
      mockedJwtDecode.mockImplementation(() => {
        throw new Error('Invalid token');
      });

      expect(() => getRole('invalid-jwt')).toThrow('Invalid token');
    });

    it('should handle JWT without role field', () => {
      const mockPayload = {
        id: 'user-id',
        sub: '0x123',
        iat: 1000000,
        exp: 2000000,
        role: undefined as any
      };
      mockedJwtDecode.mockReturnValue(mockPayload);

      const result = getRole('jwt-without-role');

      expect(result).toBeUndefined();
    });
  });

  describe('doJWTValidation', () => {
    it('should return false when JWT is null', () => {
      const result = doJWTValidation({
        jwt: null,
        wallet: '0x123',
        role: null
      });
      expect(result).toBe(false);
    });

    it('should return true for valid, non-expired token with matching wallet', () => {
      const mockPayload = {
        id: 'user-id',
        sub: '0x123',
        iat: 900000,
        exp: 1100000, // Not expired (current time is 1000000)
        role: 'user'
      };
      mockedJwtDecode.mockReturnValue(mockPayload);

      const result = doJWTValidation({
        jwt: 'valid-jwt',
        wallet: '0x123',
        role: null
      });

      expect(result).toBe(true);
    });

    it('should return false for expired token', () => {
      const mockPayload = {
        id: 'user-id',
        sub: '0x123',
        iat: 800000,
        exp: 900000, // Expired (current time is 1000000)
        role: 'user'
      };
      mockedJwtDecode.mockReturnValue(mockPayload);

      const result = doJWTValidation({
        jwt: 'expired-jwt',
        wallet: '0x123',
        role: null
      });

      expect(result).toBe(false);
    });

    it('should return false when wallet address does not match', () => {
      const mockPayload = {
        id: 'user-id',
        sub: '0x456',
        iat: 900000,
        exp: 1100000,
        role: 'user'
      };
      mockedJwtDecode.mockReturnValue(mockPayload);

      const result = doJWTValidation({
        jwt: 'valid-jwt',
        wallet: '0x123',
        role: null
      });

      expect(result).toBe(false);
    });

    it('should handle wallet address case-insensitively', () => {
      const mockPayload = {
        id: 'user-id',
        sub: '0xabc',
        iat: 900000,
        exp: 1100000,
        role: 'user'
      };
      mockedJwtDecode.mockReturnValue(mockPayload);

      const result = doJWTValidation({
        jwt: 'valid-jwt',
        wallet: '0xABC',
        role: null
      });

      expect(result).toBe(true);
    });

    it('should return false when role does not match expected role', () => {
      const mockPayload = {
        id: 'user-id',
        sub: '0x123',
        iat: 900000,
        exp: 1100000,
        role: 'user'
      };
      mockedJwtDecode.mockReturnValue(mockPayload);

      const result = doJWTValidation({
        jwt: 'valid-jwt',
        wallet: '0x123',
        role: 'admin'
      });

      expect(result).toBe(false);
    });

    it('should return true when role matches expected role', () => {
      const mockPayload = {
        id: 'user-id',
        sub: '0x123',
        iat: 900000,
        exp: 1100000,
        role: 'admin'
      };
      mockedJwtDecode.mockReturnValue(mockPayload);

      const result = doJWTValidation({
        jwt: 'valid-jwt',
        wallet: '0x123',
        role: 'admin'
      });

      expect(result).toBe(true);
    });
  });

  describe('validateJwtInputs', () => {
    it('should not throw for valid inputs', () => {
      expect(() => validateJwtInputs('0x123', 'test-operation')).not.toThrow();
    });

    it('should throw for null wallet', () => {
      expect(() => validateJwtInputs(null as any, 'test-operation')).toThrow('Invalid wallet address: must be non-empty string');
    });

    it('should throw for empty wallet', () => {
      expect(() => validateJwtInputs('', 'test-operation')).toThrow('Invalid wallet address: must be non-empty string');
    });

    it('should throw for non-string wallet', () => {
      expect(() => validateJwtInputs(123 as any, 'test-operation')).toThrow('Invalid wallet address: must be non-empty string');
    });

    it('should throw for null operationId', () => {
      expect(() => validateJwtInputs('0x123', null as any)).toThrow('Invalid operationId: must be non-empty string');
    });

    it('should throw for empty operationId', () => {
      expect(() => validateJwtInputs('0x123', '')).toThrow('Invalid operationId: must be non-empty string');
    });
  });

  describe('validateProxyRole', () => {
    const createMockProfileProxy = (createdById: string): ApiProfileProxy => ({
      id: 'proxy-1',
      target_id: 'target-1',
      created_by: { id: createdById },
      granted_by: { id: 'granter-1' },
      actions: [],
      credit_amount: 0,
      credit_spent: 0,
      status: 'ACTIVE',
      created_at: 1000000,
      updated_at: 1000000
    } as ApiProfileProxy);

    it('should not throw for valid proxy role', () => {
      const validProxy = createMockProfileProxy('admin-role');
      
      expect(() => validateProxyRole({
        role: 'admin-role',
        activeProfileProxy: validProxy,
        freshTokenRole: 'admin-role'
      })).not.toThrow();
    });

    it('should throw MissingActiveProfileError when no active profile proxy', () => {
      expect(() => validateProxyRole({
        role: 'admin-role',
        activeProfileProxy: null,
        freshTokenRole: 'admin-role'
      })).toThrow(MissingActiveProfileError);
    });

    it('should throw AuthenticationRoleError for invalid proxy structure', () => {
      const invalidProxy = {
        id: 'proxy-1',
        created_by: null
      } as any;

      expect(() => validateProxyRole({
        role: 'admin-role',
        activeProfileProxy: invalidProxy,
        freshTokenRole: 'admin-role'
      })).toThrow(AuthenticationRoleError);
    });

    it('should throw InvalidRoleStateError for role mismatch with proxy creator', () => {
      const validProxy = createMockProfileProxy('creator-123');

      expect(() => validateProxyRole({
        role: 'different-role',
        activeProfileProxy: validProxy,
        freshTokenRole: 'different-role'
      })).toThrow(InvalidRoleStateError);
    });

    it('should throw RoleValidationError for fresh token role mismatch', () => {
      const validProxy = createMockProfileProxy('admin-role');

      expect(() => validateProxyRole({
        role: 'admin-role',
        activeProfileProxy: validProxy,
        freshTokenRole: 'wrong-role'
      })).toThrow(RoleValidationError);
    });
  });

  describe('synchronizeRoles', () => {
    beforeEach(() => {
      jest.clearAllMocks();
    });

    it('should log role change when roles differ', () => {
      synchronizeRoles({
        walletRole: 'old-role',
        freshTokenRole: 'new-role',
        address: '0x123',
        refreshToken: 'refresh-token',
        newToken: 'new-jwt-token'
      });

      expect(mockedLogErrorSecurely).toHaveBeenCalledWith('JWT_ROLE_UPDATE', {
        message: 'Updating local wallet role from old-role to new-role',
        oldRole: 'old-role',
        newRole: 'new-role',
        address: '0x123'
      });
      expect(setAuthJwt).toHaveBeenCalledWith('0x123', 'new-jwt-token', 'refresh-token', 'new-role');
      expect(syncWalletRoleWithServer).toHaveBeenCalledWith('new-role', '0x123');
    });

    it('should not log when roles are the same', () => {
      synchronizeRoles({
        walletRole: 'same-role',
        freshTokenRole: 'same-role',
        address: '0x123',
        refreshToken: 'refresh-token',
        newToken: 'new-jwt-token'
      });

      expect(mockedLogErrorSecurely).not.toHaveBeenCalledWith('JWT_ROLE_UPDATE', expect.anything());
      expect(setAuthJwt).toHaveBeenCalledWith('0x123', 'new-jwt-token', 'refresh-token', 'same-role');
      expect(syncWalletRoleWithServer).toHaveBeenCalledWith('same-role', '0x123');
    });

    it('should handle null roles', () => {
      synchronizeRoles({
        walletRole: null,
        freshTokenRole: null,
        address: '0x123',
        refreshToken: 'refresh-token',
        newToken: 'new-jwt-token'
      });

      expect(setAuthJwt).toHaveBeenCalledWith('0x123', 'new-jwt-token', 'refresh-token', undefined);
      expect(syncWalletRoleWithServer).toHaveBeenCalledWith(null, '0x123');
    });
  });

  describe('handleTokenRefresh', () => {
    const mockAbortController = new AbortController();
    const refreshParams = {
      wallet: '0x123',
      role: null,
      abortSignal: mockAbortController.signal,
      activeProfileProxy: null
    };

    beforeEach(() => {
      jest.clearAllMocks();
    });

    it('should return false for first-time sign-in (no refresh token)', async () => {
      mockedGetRefreshToken.mockReturnValue(null);

      const result = await handleTokenRefresh(refreshParams);

      expect(result).toEqual({ isValid: false, wasCancelled: false });
    });

    it('should throw error when refresh token exists but no wallet address', async () => {
      mockedGetRefreshToken.mockReturnValue('refresh-token');
      mockedGetWalletAddress.mockReturnValue(null);

      await expect(handleTokenRefresh(refreshParams)).rejects.toThrow('No wallet address available for JWT renewal');
    });

    it('should return cancelled when aborted', async () => {
      const abortController = new AbortController();
      abortController.abort();

      mockedGetRefreshToken.mockReturnValue('refresh-token');
      mockedGetWalletAddress.mockReturnValue('0x123');

      const result = await handleTokenRefresh({
        ...refreshParams,
        abortSignal: abortController.signal
      });

      expect(result).toEqual({ isValid: false, wasCancelled: true });
    });

    it('should successfully refresh token and synchronize roles', async () => {
      mockedGetRefreshToken.mockReturnValue('refresh-token');
      mockedGetWalletAddress.mockReturnValue('0x123');
      mockedGetWalletRole.mockReturnValue('old-role');
      
      const mockRefreshResponse = {
        address: '0x123',
        token: 'new-jwt-token'
      };
      mockedRedeemRefreshTokenWithRetries.mockResolvedValue(mockRefreshResponse);
      mockedAreEqualAddresses.mockReturnValue(true);
      mockedJwtDecode.mockReturnValue({
        id: 'user-id',
        sub: '0x123',
        iat: 900000,
        exp: 1100000,
        role: 'new-role'
      });

      const result = await handleTokenRefresh(refreshParams);

      expect(result).toEqual({ isValid: true, wasCancelled: false });
      expect(setAuthJwt).toHaveBeenCalledWith('0x123', 'new-jwt-token', 'refresh-token', 'new-role');
      expect(syncWalletRoleWithServer).toHaveBeenCalledWith('new-role', '0x123');
    });
  });

  describe('validateJwt', () => {
    const mockAbortController = new AbortController();
    const validParams = {
      jwt: 'valid-jwt',
      wallet: '0x123',
      role: null,
      operationId: 'test-operation',
      abortSignal: mockAbortController.signal,
      activeProfileProxy: null
    };

    describe('Input validation', () => {
      it('should throw error for invalid wallet address (null)', async () => {
        await expect(validateJwt({
          ...validParams,
          wallet: null as any
        })).rejects.toThrow('Invalid wallet address: must be non-empty string');
      });

      it('should throw error for invalid wallet address (empty)', async () => {
        await expect(validateJwt({
          ...validParams,
          wallet: ''
        })).rejects.toThrow('Invalid wallet address: must be non-empty string');
      });

      it('should throw error for invalid wallet address (non-string)', async () => {
        await expect(validateJwt({
          ...validParams,
          wallet: 123 as any
        })).rejects.toThrow('Invalid wallet address: must be non-empty string');
      });

      it('should throw error for invalid operationId (null)', async () => {
        await expect(validateJwt({
          ...validParams,
          operationId: null as any
        })).rejects.toThrow('Invalid operationId: must be non-empty string');
      });

      it('should throw error for invalid operationId (empty)', async () => {
        await expect(validateJwt({
          ...validParams,
          operationId: ''
        })).rejects.toThrow('Invalid operationId: must be non-empty string');
      });
    });

    describe('Abort signal handling', () => {
      it('should return wasCancelled=true when signal already aborted', async () => {
        const abortController = new AbortController();
        abortController.abort();

        const result = await validateJwt({
          ...validParams,
          abortSignal: abortController.signal
        });

        expect(result).toEqual({ isValid: false, wasCancelled: true });
      });

      it('should check abort signal before token refresh', async () => {
        const abortController = new AbortController();
        
        // Mock invalid JWT to trigger refresh flow
        const mockPayload = {
          id: 'user-id',
          sub: '0x123',
          iat: 800000,
          exp: 900000, // Expired
          role: 'user'
        };
        mockedJwtDecode.mockReturnValue(mockPayload);
        mockedGetRefreshToken.mockReturnValue('refresh-token');
        mockedGetWalletAddress.mockReturnValue('0x123');

        // Abort immediately to test cancellation check
        abortController.abort();

        const result = await validateJwt({
          ...validParams,
          abortSignal: abortController.signal
        });

        expect(result).toEqual({ isValid: false, wasCancelled: true });
      });
    });

    describe('Token validation flow', () => {
      it('should return isValid=true for valid JWT', async () => {
        const mockPayload = {
          id: 'user-id',
          sub: '0x123',
          iat: 900000,
          exp: 1100000,
          role: 'user'
        };
        mockedJwtDecode.mockReturnValue(mockPayload);

        const result = await validateJwt(validParams);

        expect(result).toEqual({ isValid: true, wasCancelled: false });
      });

      it('should return isValid=false without throwing for first-time sign-in (no refresh token)', async () => {
        // Mock expired JWT
        const mockPayload = {
          id: 'user-id',
          sub: '0x123',
          iat: 800000,
          exp: 900000,
          role: 'user'
        };
        mockedJwtDecode.mockReturnValue(mockPayload);
        mockedGetRefreshToken.mockReturnValue(null);

        const result = await validateJwt(validParams);

        expect(result).toEqual({ isValid: false, wasCancelled: false });
      });

      it('should throw error when refresh token exists but no wallet address', async () => {
        const mockPayload = {
          id: 'user-id',
          sub: '0x123',
          iat: 800000,
          exp: 900000,
          role: 'user'
        };
        mockedJwtDecode.mockReturnValue(mockPayload);
        mockedGetRefreshToken.mockReturnValue('refresh-token');
        mockedGetWalletAddress.mockReturnValue(null);

        await expect(validateJwt(validParams)).rejects.toThrow('No wallet address available for JWT renewal');
      });

      it('should successfully refresh token and update storage', async () => {
        // Mock expired JWT
        const mockPayload = {
          id: 'user-id',
          sub: '0x123',
          iat: 800000,
          exp: 900000,
          role: 'user'
        };
        mockedJwtDecode.mockReturnValue(mockPayload);
        
        // Mock refresh flow
        mockedGetRefreshToken.mockReturnValue('refresh-token');
        mockedGetWalletAddress.mockReturnValue('0x123');
        mockedGetWalletRole.mockReturnValue('user');
        
        const mockRefreshResponse = {
          address: '0x123',
          token: 'new-jwt-token'
        };
        mockedRedeemRefreshTokenWithRetries.mockResolvedValue(mockRefreshResponse);
        mockedAreEqualAddresses.mockReturnValue(true);
        
        // Mock the new token's role extraction
        mockedJwtDecode.mockReturnValueOnce(mockPayload) // First call for initial validation
          .mockReturnValueOnce({ ...mockPayload, role: 'admin' }); // Second call for new token role

        const result = await validateJwt(validParams);

        expect(result).toEqual({ isValid: true, wasCancelled: false });
        expect(setAuthJwt).toHaveBeenCalledWith('0x123', 'new-jwt-token', 'refresh-token', 'admin');
        expect(syncWalletRoleWithServer).toHaveBeenCalledWith('admin', '0x123');
      });

      it('should throw error when refresh response address does not match', async () => {
        const mockPayload = {
          id: 'user-id',
          sub: '0x123',
          iat: 800000,
          exp: 900000,
          role: 'user'
        };
        mockedJwtDecode.mockReturnValue(mockPayload);
        mockedGetRefreshToken.mockReturnValue('refresh-token');
        mockedGetWalletAddress.mockReturnValue('0x123');
        
        const mockRefreshResponse = {
          address: '0x456', // Different address
          token: 'new-jwt-token'
        };
        mockedRedeemRefreshTokenWithRetries.mockResolvedValue(mockRefreshResponse);
        mockedAreEqualAddresses.mockReturnValue(false);

        await expect(validateJwt(validParams)).rejects.toThrow(
          'Address mismatch in token response: expected 0x123, got 0x456'
        );
      });
    });

    describe('Role-based authentication tests', () => {
      const createMockProfileProxy = (createdById: string): ApiProfileProxy => ({
        id: 'proxy-1',
        target_id: 'target-1',
        created_by: { id: createdById },
        granted_by: { id: 'granter-1' },
        granted_to: { id: 'granted-to' },
        actions: [],
        credit_amount: 0,
        credit_spent: 0,
        status: 'ACTIVE',
        created_at: 1000000,
        updated_at: 1000000
      } as ApiProfileProxy);

      it('should throw MissingActiveProfileError when role required but no active profile proxy', async () => {
        const mockPayload = {
          id: 'user-id',
          sub: '0x123',
          iat: 800000,
          exp: 900000,
          role: 'user'
        };
        mockedJwtDecode.mockReturnValue(mockPayload);
        mockedGetRefreshToken.mockReturnValue('refresh-token');
        mockedGetWalletAddress.mockReturnValue('0x123');
        
        const mockRefreshResponse = {
          address: '0x123',
          token: 'new-jwt-token'
        };
        mockedRedeemRefreshTokenWithRetries.mockResolvedValue(mockRefreshResponse);
        mockedAreEqualAddresses.mockReturnValue(true);

        await expect(validateJwt({
          ...validParams,
          role: 'admin',
          activeProfileProxy: null
        })).rejects.toThrow(MissingActiveProfileError);
      });

      it('should throw AuthenticationRoleError for invalid proxy structure (no created_by)', async () => {
        const mockPayload = {
          id: 'user-id',
          sub: '0x123',
          iat: 800000,
          exp: 900000,
          role: 'user'
        };
        mockedJwtDecode.mockReturnValue(mockPayload);
        mockedGetRefreshToken.mockReturnValue('refresh-token');
        mockedGetWalletAddress.mockReturnValue('0x123');
        
        const mockRefreshResponse = {
          address: '0x123',
          token: 'new-jwt-token'
        };
        mockedRedeemRefreshTokenWithRetries.mockResolvedValue(mockRefreshResponse);
        mockedAreEqualAddresses.mockReturnValue(true);

        const invalidProxy = {
          id: 'proxy-1',
          created_by: null
        } as any;

        await expect(validateJwt({
          ...validParams,
          role: 'admin',
          activeProfileProxy: invalidProxy
        })).rejects.toThrow(AuthenticationRoleError);
      });

      it('should throw AuthenticationRoleError for invalid proxy creator id (empty string)', async () => {
        const mockPayload = {
          id: 'user-id',
          sub: '0x123',
          iat: 800000,
          exp: 900000,
          role: 'user'
        };
        mockedJwtDecode.mockReturnValue(mockPayload);
        mockedGetRefreshToken.mockReturnValue('refresh-token');
        mockedGetWalletAddress.mockReturnValue('0x123');
        
        const mockRefreshResponse = {
          address: '0x123',
          token: 'new-jwt-token'
        };
        mockedRedeemRefreshTokenWithRetries.mockResolvedValue(mockRefreshResponse);
        mockedAreEqualAddresses.mockReturnValue(true);

        const invalidProxy = createMockProfileProxy('  '); // Whitespace only

        await expect(validateJwt({
          ...validParams,
          role: 'admin',
          activeProfileProxy: invalidProxy
        })).rejects.toThrow(AuthenticationRoleError);
      });

      it('should throw InvalidRoleStateError when role does not match proxy creator', async () => {
        const mockPayload = {
          id: 'user-id',
          sub: '0x123',
          iat: 800000,
          exp: 900000,
          role: 'user'
        };
        mockedJwtDecode.mockReturnValue(mockPayload);
        mockedGetRefreshToken.mockReturnValue('refresh-token');
        mockedGetWalletAddress.mockReturnValue('0x123');
        
        const mockRefreshResponse = {
          address: '0x123',
          token: 'new-jwt-token'
        };
        mockedRedeemRefreshTokenWithRetries.mockResolvedValue(mockRefreshResponse);
        mockedAreEqualAddresses.mockReturnValue(true);

        const validProxy = createMockProfileProxy('creator-123');

        await expect(validateJwt({
          ...validParams,
          role: 'different-role', // Different from proxy creator
          activeProfileProxy: validProxy
        })).rejects.toThrow(InvalidRoleStateError);
      });

      it('should throw RoleValidationError when server provides incorrect role', async () => {
        const mockPayload = {
          id: 'user-id',
          sub: '0x123',
          iat: 800000,
          exp: 900000,
          role: 'user'
        };
        mockedJwtDecode
          .mockReturnValueOnce(mockPayload) // Initial validation
          .mockReturnValueOnce({ ...mockPayload, role: 'wrong-role' }); // New token role

        mockedGetRefreshToken.mockReturnValue('refresh-token');
        mockedGetWalletAddress.mockReturnValue('0x123');
        mockedGetWalletRole.mockReturnValue('user');
        
        const mockRefreshResponse = {
          address: '0x123',
          token: 'new-jwt-token'
        };
        mockedRedeemRefreshTokenWithRetries.mockResolvedValue(mockRefreshResponse);
        mockedAreEqualAddresses.mockReturnValue(true);

        const validProxy = createMockProfileProxy('expected-role');

        await expect(validateJwt({
          ...validParams,
          role: 'expected-role',
          activeProfileProxy: validProxy
        })).rejects.toThrow(RoleValidationError);
      });

      it('should successfully validate role-based authentication with correct proxy', async () => {
        const mockPayload = {
          id: 'user-id',
          sub: '0x123',
          iat: 800000,
          exp: 900000,
          role: 'user'
        };
        mockedJwtDecode
          .mockReturnValueOnce(mockPayload) // Initial validation
          .mockReturnValueOnce({ ...mockPayload, role: 'admin-role' }); // New token role

        mockedGetRefreshToken.mockReturnValue('refresh-token');
        mockedGetWalletAddress.mockReturnValue('0x123');
        mockedGetWalletRole.mockReturnValue('user');
        
        const mockRefreshResponse = {
          address: '0x123',
          token: 'new-jwt-token'
        };
        mockedRedeemRefreshTokenWithRetries.mockResolvedValue(mockRefreshResponse);
        mockedAreEqualAddresses.mockReturnValue(true);

        const validProxy = createMockProfileProxy('admin-role');

        const result = await validateJwt({
          ...validParams,
          role: 'admin-role',
          activeProfileProxy: validProxy
        });

        expect(result).toEqual({ isValid: true, wasCancelled: false });
        expect(setAuthJwt).toHaveBeenCalledWith('0x123', 'new-jwt-token', 'refresh-token', 'admin-role');
        expect(syncWalletRoleWithServer).toHaveBeenCalledWith('admin-role', '0x123');
      });
    });

    describe('Error handling tests', () => {
      it('should handle cancellation errors correctly', async () => {
        const mockPayload = {
          id: 'user-id',
          sub: '0x123',
          iat: 800000,
          exp: 900000,
          role: 'user'
        };
        mockedJwtDecode.mockReturnValue(mockPayload);
        mockedGetRefreshToken.mockReturnValue('refresh-token');
        mockedGetWalletAddress.mockReturnValue('0x123');
        
        // Mock an error that has the TokenRefreshCancelledError characteristics
        const mockError = {
          name: 'TokenRefreshCancelledError',
          message: 'Token refresh was cancelled'
        };
        Object.setPrototypeOf(mockError, TokenRefreshCancelledError.prototype);
        mockedRedeemRefreshTokenWithRetries.mockRejectedValue(mockError);

        const result = await validateJwt(validParams);

        expect(result).toEqual({ isValid: false, wasCancelled: true });
      });

      it('should handle AbortError correctly', async () => {
        const mockPayload = {
          id: 'user-id',
          sub: '0x123',
          iat: 800000,
          exp: 900000,
          role: 'user'
        };
        mockedJwtDecode.mockReturnValue(mockPayload);
        mockedGetRefreshToken.mockReturnValue('refresh-token');
        mockedGetWalletAddress.mockReturnValue('0x123');
        
        const abortError = new Error('Aborted');
        abortError.name = 'AbortError';
        mockedRedeemRefreshTokenWithRetries.mockRejectedValue(abortError);

        const result = await validateJwt(validParams);

        expect(result).toEqual({ isValid: false, wasCancelled: true });
      });

      it('should re-throw other refresh token errors', async () => {
        const mockPayload = {
          id: 'user-id',
          sub: '0x123',
          iat: 800000,
          exp: 900000,
          role: 'user'
        };
        mockedJwtDecode.mockReturnValue(mockPayload);
        mockedGetRefreshToken.mockReturnValue('refresh-token');
        mockedGetWalletAddress.mockReturnValue('0x123');
        
        const customError = new Error('Custom refresh error');
        mockedRedeemRefreshTokenWithRetries.mockRejectedValue(customError);

        await expect(validateJwt(validParams)).rejects.toThrow('Custom refresh error');
      });
    });

    describe('Role synchronization tests', () => {
      it('should log role changes when local differs from server', async () => {
        const mockPayload = {
          id: 'user-id',
          sub: '0x123',
          iat: 800000,
          exp: 900000,
          role: 'user'
        };
        mockedJwtDecode
          .mockReturnValueOnce(mockPayload) // Initial validation
          .mockReturnValueOnce({ ...mockPayload, role: 'admin' }); // New token role

        mockedGetRefreshToken.mockReturnValue('refresh-token');
        mockedGetWalletAddress.mockReturnValue('0x123');
        mockedGetWalletRole.mockReturnValue('user'); // Different from server role
        
        const mockRefreshResponse = {
          address: '0x123',
          token: 'new-jwt-token'
        };
        mockedRedeemRefreshTokenWithRetries.mockResolvedValue(mockRefreshResponse);
        mockedAreEqualAddresses.mockReturnValue(true);

        await validateJwt(validParams);

        expect(logErrorSecurely).toHaveBeenCalledWith('JWT_ROLE_UPDATE', {
          message: 'Updating local wallet role from user to admin',
          oldRole: 'user',
          newRole: 'admin',
          address: '0x123'
        });
      });

      it('should not log when local role matches server role', async () => {
        const mockPayload = {
          id: 'user-id',
          sub: '0x123',
          iat: 800000,
          exp: 900000,
          role: 'user'
        };
        mockedJwtDecode
          .mockReturnValueOnce(mockPayload) // Initial validation
          .mockReturnValueOnce({ ...mockPayload, role: 'admin' }); // New token role

        mockedGetRefreshToken.mockReturnValue('refresh-token');
        mockedGetWalletAddress.mockReturnValue('0x123');
        mockedGetWalletRole.mockReturnValue('admin'); // Same as server role
        
        const mockRefreshResponse = {
          address: '0x123',
          token: 'new-jwt-token'
        };
        mockedRedeemRefreshTokenWithRetries.mockResolvedValue(mockRefreshResponse);
        mockedAreEqualAddresses.mockReturnValue(true);

        await validateJwt(validParams);

        expect(logErrorSecurely).not.toHaveBeenCalledWith('JWT_ROLE_UPDATE', expect.anything());
      });

      it('should use server role for storage, not local role', async () => {
        const mockPayload = {
          id: 'user-id',
          sub: '0x123',
          iat: 800000,
          exp: 900000,
          role: 'user'
        };
        mockedJwtDecode
          .mockReturnValueOnce(mockPayload) // Initial validation
          .mockReturnValueOnce({ ...mockPayload, role: 'server-role' }); // New token role

        mockedGetRefreshToken.mockReturnValue('refresh-token');
        mockedGetWalletAddress.mockReturnValue('0x123');
        mockedGetWalletRole.mockReturnValue('local-role'); // Different from server
        
        const mockRefreshResponse = {
          address: '0x123',
          token: 'new-jwt-token'
        };
        mockedRedeemRefreshTokenWithRetries.mockResolvedValue(mockRefreshResponse);
        mockedAreEqualAddresses.mockReturnValue(true);

        await validateJwt(validParams);

        expect(setAuthJwt).toHaveBeenCalledWith('0x123', 'new-jwt-token', 'refresh-token', 'server-role');
        expect(syncWalletRoleWithServer).toHaveBeenCalledWith('server-role', '0x123');
      });

      it('should handle null server role correctly', async () => {
        const mockPayload = {
          id: 'user-id',
          sub: '0x123',
          iat: 800000,
          exp: 900000,
          role: 'user'
        };
        mockedJwtDecode
          .mockReturnValueOnce(mockPayload) // Initial validation
          .mockReturnValueOnce({ ...mockPayload, role: null as any }); // New token with null role

        mockedGetRefreshToken.mockReturnValue('refresh-token');
        mockedGetWalletAddress.mockReturnValue('0x123');
        mockedGetWalletRole.mockReturnValue('user');
        
        const mockRefreshResponse = {
          address: '0x123',
          token: 'new-jwt-token'
        };
        mockedRedeemRefreshTokenWithRetries.mockResolvedValue(mockRefreshResponse);
        mockedAreEqualAddresses.mockReturnValue(true);

        await validateJwt(validParams);

        expect(setAuthJwt).toHaveBeenCalledWith('0x123', 'new-jwt-token', 'refresh-token', undefined);
        expect(syncWalletRoleWithServer).toHaveBeenCalledWith(null, '0x123');
      });
    });

    describe('Edge cases and comprehensive scenarios', () => {
      it('should handle abort signal check after token refresh', async () => {
        const abortController = new AbortController();
        const mockPayload = {
          id: 'user-id',
          sub: '0x123',
          iat: 800000,
          exp: 900000,
          role: 'user'
        };
        mockedJwtDecode.mockReturnValue(mockPayload);
        mockedGetRefreshToken.mockReturnValue('refresh-token');
        mockedGetWalletAddress.mockReturnValue('0x123');
        
        const mockRefreshResponse = {
          address: '0x123',
          token: 'new-jwt-token'
        };
        
        // Mock successful refresh but abort after
        mockedRedeemRefreshTokenWithRetries.mockImplementation(async () => {
          abortController.abort();
          return mockRefreshResponse;
        });
        mockedAreEqualAddresses.mockReturnValue(true);

        const result = await validateJwt({
          ...validParams,
          abortSignal: abortController.signal
        });

        expect(result).toEqual({ isValid: false, wasCancelled: true });
      });

      it('should handle malformed JWT in refresh response', async () => {
        const mockPayload = {
          id: 'user-id',
          sub: '0x123',
          iat: 800000,
          exp: 900000,
          role: 'user'
        };
        mockedJwtDecode
          .mockReturnValueOnce(mockPayload) // Initial validation
          .mockImplementation(() => {
            throw new Error('Invalid JWT format');
          }); // New token role extraction fails

        mockedGetRefreshToken.mockReturnValue('refresh-token');
        mockedGetWalletAddress.mockReturnValue('0x123');
        
        const mockRefreshResponse = {
          address: '0x123',
          token: 'malformed-jwt-token'
        };
        mockedRedeemRefreshTokenWithRetries.mockResolvedValue(mockRefreshResponse);
        mockedAreEqualAddresses.mockReturnValue(true);

        await expect(validateJwt(validParams)).rejects.toThrow('Invalid JWT format');
      });

      it('should handle concurrent validation requests', async () => {
        const mockPayload = {
          id: 'user-id',
          sub: '0x123',
          iat: 900000,
          exp: 1100000,
          role: 'user'
        };
        mockedJwtDecode.mockReturnValue(mockPayload);

        // Create multiple concurrent validation requests
        const promises = [
          validateJwt(validParams),
          validateJwt({ ...validParams, operationId: 'test-operation-2' }),
          validateJwt({ ...validParams, operationId: 'test-operation-3' })
        ];

        const results = await Promise.all(promises);

        results.forEach(result => {
          expect(result).toEqual({ isValid: true, wasCancelled: false });
        });
      });

      it('should handle empty JWT token gracefully', async () => {
        // Mock no refresh token to simulate first-time sign-in scenario
        mockedGetRefreshToken.mockReturnValue(null);
        
        const result = await validateJwt({
          ...validParams,
          jwt: ''
        });

        expect(result).toEqual({ isValid: false, wasCancelled: false });
      });

      it('should handle undefined activeProfileProxy with no role', async () => {
        const mockPayload = {
          id: 'user-id',
          sub: '0x123',
          iat: 900000,
          exp: 1100000,
          role: 'user'
        };
        mockedJwtDecode.mockReturnValue(mockPayload);

        const result = await validateJwt({
          ...validParams,
          role: null,
          activeProfileProxy: undefined
        });

        expect(result).toEqual({ isValid: true, wasCancelled: false });
      });
    });
  });
});