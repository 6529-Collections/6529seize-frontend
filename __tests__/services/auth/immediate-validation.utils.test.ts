import { validateAuthImmediate } from '../../../services/auth/immediate-validation.utils';
import { validateJwt } from '../../../services/auth/jwt-validation.utils';
import { validateRoleForAuthentication } from '../../../utils/role-validation';
import {
  AuthenticationRoleError,
  RoleValidationError,
  MissingActiveProfileError,
  InvalidRoleStateError
} from '../../../errors/authentication';

// Mock dependencies
jest.mock('../../../services/auth/jwt-validation.utils');
jest.mock('../../../utils/role-validation');

const mockValidateJwt = validateJwt as jest.MockedFunction<typeof validateJwt>;
const mockValidateRoleForAuthentication = validateRoleForAuthentication as jest.MockedFunction<typeof validateRoleForAuthentication>;

describe('validateAuthImmediate', () => {
  const mockCallbacks = {
    onShowSignModal: jest.fn(),
    onInvalidateCache: jest.fn(),
    onReset: jest.fn(),
    onRemoveJwt: jest.fn(),
    onLogError: jest.fn(),
  };

  const baseParams = {
    currentAddress: '0x123',
    connectionAddress: '0x123',
    jwt: 'valid-jwt-token',
    activeProfileProxy: null,
    isConnected: true,
    operationId: 'test-operation',
    abortSignal: new AbortController().signal,
  };

  beforeEach(() => {
    jest.clearAllMocks();
    mockValidateRoleForAuthentication.mockReturnValue('test-role');
  });

  describe('Address Consistency Checks', () => {
    it('should return cancelled when address changes before validation', async () => {
      const params = {
        ...baseParams,
        currentAddress: '0x123',
        connectionAddress: '0x456', // Different address
      };

      const result = await validateAuthImmediate({
        params,
        callbacks: mockCallbacks,
      });

      expect(result).toEqual({
        validationCompleted: false,
        wasCancelled: true,
        shouldShowModal: false,
      });

      // Should not call JWT validation if address changed
      expect(mockValidateJwt).not.toHaveBeenCalled();
      // Should not call any callbacks
      expect(mockCallbacks.onShowSignModal).not.toHaveBeenCalled();
    });

    it('should return cancelled when abort signal is already aborted', async () => {
      const abortController = new AbortController();
      abortController.abort();

      const params = {
        ...baseParams,
        abortSignal: abortController.signal,
      };

      const result = await validateAuthImmediate({
        params,
        callbacks: mockCallbacks,
      });

      expect(result).toEqual({
        validationCompleted: false,
        wasCancelled: true,
        shouldShowModal: false,
      });

      expect(mockValidateJwt).not.toHaveBeenCalled();
    });
  });

  describe('Successful JWT Validation', () => {
    it('should return success when JWT is valid', async () => {
      mockValidateJwt.mockResolvedValue({
        isValid: true,
        wasCancelled: false,
      });

      const result = await validateAuthImmediate({
        params: baseParams,
        callbacks: mockCallbacks,
      });

      expect(result).toEqual({
        validationCompleted: true,
        wasCancelled: false,
        shouldShowModal: false,
      });

      expect(mockValidateJwt).toHaveBeenCalledWith({
        jwt: 'valid-jwt-token',
        wallet: '0x123',
        role: null,
        operationId: 'test-operation',
        abortSignal: baseParams.abortSignal,
        activeProfileProxy: null,
      });

      // No callbacks should be called for valid JWT
      expect(mockCallbacks.onShowSignModal).not.toHaveBeenCalled();
      expect(mockCallbacks.onReset).not.toHaveBeenCalled();
    });

    it('should call validateRoleForAuthentication when activeProfileProxy exists', async () => {
      const mockProxy = {
        id: 'proxy-id',
        created_by: { id: 'creator-id' }
      };

      mockValidateJwt.mockResolvedValue({
        isValid: true,
        wasCancelled: false,
      });

      const params = {
        ...baseParams,
        activeProfileProxy: mockProxy as any,
      };

      await validateAuthImmediate({
        params,
        callbacks: mockCallbacks,
      });

      expect(mockValidateRoleForAuthentication).toHaveBeenCalledWith(mockProxy);
      expect(mockValidateJwt).toHaveBeenCalledWith({
        jwt: 'valid-jwt-token',
        wallet: '0x123',
        role: 'test-role',
        operationId: 'test-operation',
        abortSignal: baseParams.abortSignal,
        activeProfileProxy: mockProxy,
      });
    });
  });

  describe('Invalid JWT Handling', () => {
    it('should call reset when JWT is invalid and user is not connected', async () => {
      mockValidateJwt.mockResolvedValue({
        isValid: false,
        wasCancelled: false,
      });

      const params = {
        ...baseParams,
        isConnected: false,
      };

      const result = await validateAuthImmediate({
        params,
        callbacks: mockCallbacks,
      });

      expect(result).toEqual({
        validationCompleted: true,
        wasCancelled: false,
        shouldShowModal: false,
      });

      expect(mockCallbacks.onReset).toHaveBeenCalled();
      expect(mockCallbacks.onShowSignModal).not.toHaveBeenCalled();
    });

    it('should trigger re-authentication when JWT is invalid and user is connected', async () => {
      mockValidateJwt.mockResolvedValue({
        isValid: false,
        wasCancelled: false,
      });

      const result = await validateAuthImmediate({
        params: baseParams,
        callbacks: mockCallbacks,
      });

      expect(result).toEqual({
        validationCompleted: true,
        wasCancelled: false,
        shouldShowModal: true,
      });

      expect(mockCallbacks.onRemoveJwt).toHaveBeenCalled();
      expect(mockCallbacks.onInvalidateCache).toHaveBeenCalled();
      expect(mockCallbacks.onShowSignModal).toHaveBeenCalledWith(true);
    });

    it('should not process result when validation was cancelled', async () => {
      mockValidateJwt.mockResolvedValue({
        isValid: false,
        wasCancelled: true,
      });

      const result = await validateAuthImmediate({
        params: baseParams,
        callbacks: mockCallbacks,
      });

      expect(result).toEqual({
        validationCompleted: true,
        wasCancelled: true,
        shouldShowModal: false,
      });

      // No callbacks should be called when cancelled
      expect(mockCallbacks.onReset).not.toHaveBeenCalled();
      expect(mockCallbacks.onShowSignModal).not.toHaveBeenCalled();
    });
  });

  describe('Error Handling', () => {
    it('should handle MissingActiveProfileError correctly', async () => {
      const error = new MissingActiveProfileError();
      mockValidateJwt.mockRejectedValue(error);

      const result = await validateAuthImmediate({
        params: baseParams,
        callbacks: mockCallbacks,
      });

      expect(result).toEqual({
        validationCompleted: false,
        wasCancelled: false,
        shouldShowModal: true,
      });

      expect(mockCallbacks.onLogError).toHaveBeenCalledWith('validateJwt_role_error', error);
      expect(mockCallbacks.onRemoveJwt).toHaveBeenCalled();
      expect(mockCallbacks.onInvalidateCache).toHaveBeenCalled();
      expect(mockCallbacks.onShowSignModal).toHaveBeenCalledWith(true);
    });

    it('should handle RoleValidationError correctly', async () => {
      const error = new RoleValidationError('expected-role', 'actual-role');
      mockValidateJwt.mockRejectedValue(error);

      const result = await validateAuthImmediate({
        params: baseParams,
        callbacks: mockCallbacks,
      });

      expect(result).toEqual({
        validationCompleted: false,
        wasCancelled: false,
        shouldShowModal: true,
      });

      expect(mockCallbacks.onLogError).toHaveBeenCalledWith('validateJwt_role_error', error);
      expect(mockCallbacks.onRemoveJwt).toHaveBeenCalled();
      expect(mockCallbacks.onInvalidateCache).toHaveBeenCalled();
      expect(mockCallbacks.onShowSignModal).toHaveBeenCalledWith(true);
    });

    it('should handle AuthenticationRoleError correctly', async () => {
      const error = new AuthenticationRoleError('role error');
      mockValidateJwt.mockRejectedValue(error);

      const result = await validateAuthImmediate({
        params: baseParams,
        callbacks: mockCallbacks,
      });

      expect(mockCallbacks.onLogError).toHaveBeenCalledWith('validateJwt_role_error', error);
      expect(mockCallbacks.onRemoveJwt).toHaveBeenCalled();
      expect(mockCallbacks.onInvalidateCache).toHaveBeenCalled();
      expect(mockCallbacks.onShowSignModal).toHaveBeenCalledWith(true);
    });

    it('should handle InvalidRoleStateError correctly', async () => {
      const error = new InvalidRoleStateError('invalid role state');
      mockValidateJwt.mockRejectedValue(error);

      const result = await validateAuthImmediate({
        params: baseParams,
        callbacks: mockCallbacks,
      });

      expect(mockCallbacks.onLogError).toHaveBeenCalledWith('validateJwt_role_error', error);
      expect(mockCallbacks.onRemoveJwt).toHaveBeenCalled();
      expect(mockCallbacks.onInvalidateCache).toHaveBeenCalled();
      expect(mockCallbacks.onShowSignModal).toHaveBeenCalledWith(true);
    });

    it('should handle general errors correctly', async () => {
      const error = new Error('general error');
      mockValidateJwt.mockRejectedValue(error);

      const result = await validateAuthImmediate({
        params: baseParams,
        callbacks: mockCallbacks,
      });

      expect(result).toEqual({
        validationCompleted: false,
        wasCancelled: false,
        shouldShowModal: true,
      });

      expect(mockCallbacks.onLogError).toHaveBeenCalledWith('validateJwt_general_error', error);
      expect(mockCallbacks.onShowSignModal).toHaveBeenCalledWith(true);
    });

    it('should not process errors when operation is aborted', async () => {
      const abortController = new AbortController();
      const error = new Error('test error');
      
      mockValidateJwt.mockImplementation(() => {
        abortController.abort();
        throw error;
      });

      const params = {
        ...baseParams,
        abortSignal: abortController.signal,
      };

      const result = await validateAuthImmediate({
        params,
        callbacks: mockCallbacks,
      });

      expect(result).toEqual({
        validationCompleted: false,
        wasCancelled: true,
        shouldShowModal: false,
      });

      // Should not call any callbacks when aborted
      expect(mockCallbacks.onLogError).not.toHaveBeenCalled();
      expect(mockCallbacks.onShowSignModal).not.toHaveBeenCalled();
    });

    it('should not process errors when address changes during error handling', async () => {
      const error = new Error('test error');
      mockValidateJwt.mockRejectedValue(error);

      const params = {
        ...baseParams,
        currentAddress: '0x123',
        connectionAddress: '0x456', // Different address
      };

      const result = await validateAuthImmediate({
        params,
        callbacks: mockCallbacks,
      });

      expect(result).toEqual({
        validationCompleted: false,
        wasCancelled: true,
        shouldShowModal: false,
      });

      // Should not process error when address changed
      expect(mockCallbacks.onLogError).not.toHaveBeenCalled();
    });

    it('should not show modal when user is not connected on error', async () => {
      const error = new Error('test error');
      mockValidateJwt.mockRejectedValue(error);

      const params = {
        ...baseParams,
        isConnected: false,
      };

      const result = await validateAuthImmediate({
        params,
        callbacks: mockCallbacks,
      });

      expect(result).toEqual({
        validationCompleted: false,
        wasCancelled: false,
        shouldShowModal: false,
      });

      expect(mockCallbacks.onLogError).toHaveBeenCalledWith('validateJwt_general_error', error);
      // Should not show modal when not connected
      expect(mockCallbacks.onShowSignModal).not.toHaveBeenCalled();
    });
  });

  describe('Post-validation Address Checks', () => {
    it('should return cancelled when address changes after validation', async () => {
      // This test verifies that the original logic checks currentAddress !== connectionAddress
      // after validation. Since our utility gets both addresses as static values,
      // this scenario would be handled by the component calling validateAuthImmediate
      // with different currentAddress and connectionAddress values.
      
      const params = {
        ...baseParams,
        currentAddress: '0x123',
        connectionAddress: '0x456', // Different address simulates post-validation change
      };

      mockValidateJwt.mockResolvedValue({
        isValid: false,
        wasCancelled: false,
      });

      const result = await validateAuthImmediate({
        params,
        callbacks: mockCallbacks,
      });

      expect(result).toEqual({
        validationCompleted: false,
        wasCancelled: true,
        shouldShowModal: false,
      });

      // Should not process result when address changed
      expect(mockCallbacks.onShowSignModal).not.toHaveBeenCalled();
    });
  });
});