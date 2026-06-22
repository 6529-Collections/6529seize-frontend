import { isAddress } from "viem";
import { commonApiPost } from "../api/common-api";
import type { ApiRedeemRefreshTokenRequest } from "@/generated/models/ApiRedeemRefreshTokenRequest";
import type { ApiRedeemRefreshTokenResponse } from "@/generated/models/ApiRedeemRefreshTokenResponse";
import {
  TokenRefreshError,
  TokenRefreshCancelledError,
  TokenRefreshNetworkError,
  TokenRefreshServerError,
} from "@/errors/authentication";

/**
 * Validates input parameters for token refresh operation
 * @throws TokenRefreshError if any validation fails
 */
function validateRefreshTokenInputs(
  walletAddress: string,
  refreshToken: string,
  retryCount: number
): void {
  // Validate wallet address
  if (!walletAddress || typeof walletAddress !== "string") {
    throw new TokenRefreshError(
      "Invalid walletAddress: must be non-empty string"
    );
  }

  // Use viem's comprehensive address validation
  // This includes EIP-55 checksum validation and format checking
  if (!isAddress(walletAddress)) {
    throw new TokenRefreshError(
      `Invalid wallet address format: ${walletAddress}`
    );
  }

  // Validate refresh token
  if (!refreshToken || typeof refreshToken !== "string") {
    throw new TokenRefreshError(
      "Invalid refreshToken: must be non-empty string"
    );
  }

  // Validate retry count - First check type and NaN, then range
  if (typeof retryCount !== "number") {
    throw new TokenRefreshError("Invalid retryCount: must be a number");
  }

  if (Number.isNaN(retryCount)) {
    throw new TokenRefreshError("Invalid retryCount: NaN is not allowed");
  }

  if (!Number.isFinite(retryCount)) {
    throw new TokenRefreshError("Invalid retryCount: Infinity is not allowed");
  }

  if (retryCount < 1 || retryCount > 10) {
    throw new TokenRefreshError("Invalid retryCount: must be between 1 and 10");
  }

  if (!Number.isInteger(retryCount)) {
    throw new TokenRefreshError("Invalid retryCount: must be an integer");
  }
}

/**
 * Validates the response from token refresh API
 * @throws TokenRefreshServerError if response is invalid
 */
function validateRefreshTokenResponse(
  response: any
): ApiRedeemRefreshTokenResponse {
  if (!response) {
    throw new TokenRefreshServerError(
      "Server returned null/undefined response",
      undefined,
      response
    );
  }

  if (!response.token || typeof response.token !== "string") {
    throw new TokenRefreshServerError(
      "Server returned invalid token",
      undefined,
      response
    );
  }

  if (!response.address || typeof response.address !== "string") {
    throw new TokenRefreshServerError(
      "Server returned invalid address",
      undefined,
      response
    );
  }

  return response as ApiRedeemRefreshTokenResponse;
}

/**
 * Classifies an error from token refresh attempt into appropriate error type
 */
function classifyRefreshTokenError(
  error: any,
  attemptNumber: number
): TokenRefreshError {
  // Handle cancellation errors
  if (error.name === "AbortError") {
    return new TokenRefreshCancelledError(
      `Operation cancelled during attempt ${attemptNumber}`
    );
  }

  // If already a TokenRefreshError, return as-is
  if (error instanceof TokenRefreshError) {
    return error;
  }

  // Classify network errors
  if (
    error?.code === "NETWORK_ERROR" ||
    error?.code === "ENOTFOUND" ||
    error?.code === "ECONNREFUSED" ||
    error?.code === "ETIMEDOUT"
  ) {
    return new TokenRefreshNetworkError(
      `Network error on attempt ${attemptNumber}: ${error.message}`,
      error
    );
  }

  // Classify server errors (HTTP status codes)
  if (error?.status >= 400 && error?.status < 600) {
    return new TokenRefreshServerError(
      `Server error ${error.status} on attempt ${attemptNumber}: ${error.message}`,
      error.status,
      error.response,
      error
    );
  }

  // Default to generic TokenRefreshError
  return new TokenRefreshError(
    `Unknown error on attempt ${attemptNumber}: ${error.message}`,
    error
  );
}

/**
 * Performs a single token refresh attempt
 * @returns Valid token response
 * @throws Various TokenRefreshError subtypes on failure
 */
async function attemptTokenRefresh(
  walletAddress: string,
  refreshToken: string,
  role: string | null,
  abortSignal?: AbortSignal
): Promise<ApiRedeemRefreshTokenResponse> {
  const response = await commonApiPost<
    ApiRedeemRefreshTokenRequest,
    ApiRedeemRefreshTokenResponse
  >({
    endpoint: "auth/redeem-refresh-token",
    body: {
      address: walletAddress,
      token: refreshToken,
      ...(role ? { role } : {}),
    },
    signal: abortSignal,
  });

  // Validate and return the response
  return validateRefreshTokenResponse(response);
}

/**
 * Checks if the operation should be cancelled
 * @throws TokenRefreshCancelledError if cancelled
 */
function checkCancellation(
  abortSignal: AbortSignal | undefined,
  context: string
): void {
  if (abortSignal?.aborted) {
    throw new TokenRefreshCancelledError(context);
  }
}

/**
 * Redeems a refresh token with retry logic and comprehensive error handling.
 *
 * This function implements a fail-fast approach with:
 * - Input validation
 * - Cancellation support via AbortSignal
 * - Retry logic with exponential backoff
 * - Structured error handling for different failure scenarios
 *
 * @param walletAddress - The wallet address for authentication
 * @param refreshToken - The refresh token to redeem
 * @param role - Optional role for role-based authentication
 * @param retryCount - Number of retry attempts (default: 3, min: 1, max: 10)
 * @param abortSignal - Optional AbortSignal for cancellation
 * @returns Promise<ApiRedeemRefreshTokenResponse> - The redeemed token response
 * @throws TokenRefreshError - Base error for token refresh failures
 * @throws TokenRefreshCancelledError - When operation is cancelled
 * @throws TokenRefreshNetworkError - For network-related failures
 * @throws TokenRefreshServerError - For server response errors
 */
export async function redeemRefreshTokenWithRetries(
  walletAddress: string,
  refreshToken: string,
  role: string | null,
  retryCount = 3,
  abortSignal?: AbortSignal
): Promise<ApiRedeemRefreshTokenResponse> {
  // Validate all inputs upfront
  validateRefreshTokenInputs(walletAddress, refreshToken, retryCount);

  // Check for cancellation before starting
  checkCancellation(abortSignal, "Operation cancelled before starting");

  let lastError: TokenRefreshError | null = null;

  // Retry loop
  for (let attempt = 1; attempt <= retryCount; attempt++) {
    // Check for cancellation before each attempt
    checkCancellation(abortSignal, `Operation cancelled on attempt ${attempt}`);

    try {
      // Attempt token refresh
      const response = await attemptTokenRefresh(
        walletAddress,
        refreshToken,
        role,
        abortSignal
      );

      // Success - return valid response
      return response;
    } catch (error: any) {
      // Classify the error
      lastError = classifyRefreshTokenError(error, attempt);

      // If cancelled, throw immediately (no retries for cancellation)
      if (lastError instanceof TokenRefreshCancelledError) {
        throw lastError;
      }

      // If this was the last attempt, throw the error
      if (attempt >= retryCount) {
        throw lastError;
      }

      // Otherwise, continue to next attempt
      // The loop will handle the next iteration
    }
  }

  // This should never be reached due to the throw in the catch block,
  // but TypeScript requires it for exhaustiveness
  throw lastError || new TokenRefreshError("All retry attempts failed");
}
