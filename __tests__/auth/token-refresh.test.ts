import {
  AuthenticationRoleError,
  InvalidRoleStateError,
  MissingActiveProfileError,
  RoleValidationError,
  TokenRefreshCancelledError,
  TokenRefreshError,
  TokenRefreshNetworkError,
  TokenRefreshServerError,
} from "@/errors/authentication";
import { redeemRefreshTokenWithRetries } from "@/services/auth/token-refresh.utils";

const originalFetch = global.fetch;
let fetchMock: jest.Mock;
const validAddress = "0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045";
const refreshToken = "refresh-token";

beforeEach(() => {
  jest.clearAllMocks();
  fetchMock = jest.fn();
  global.fetch = fetchMock as unknown as typeof fetch;
});

afterEach(() => {
  global.fetch = originalFetch;
});

describe("Token refresh error hierarchy", () => {
  it("creates TokenRefreshError with message and cause", () => {
    const error = new TokenRefreshError("boom", "cause");
    expect(error).toBeInstanceOf(Error);
    expect(error.name).toBe("TokenRefreshError");
    expect(error.message).toBe("boom");
    expect(error.cause).toBe("cause");
  });

  it("creates TokenRefreshCancelledError with default message", () => {
    const error = new TokenRefreshCancelledError();
    expect(error).toBeInstanceOf(TokenRefreshError);
    expect(error.message).toBe("Token refresh operation was cancelled");
  });

  it("preserves status information on TokenRefreshServerError", () => {
    const response = { error: "bad token" };
    const error = new TokenRefreshServerError("server", 401, response, "cause");
    expect(error).toBeInstanceOf(TokenRefreshError);
    expect(error.statusCode).toBe(401);
    expect(error.serverResponse).toBe(response);
    expect(error.cause).toBe("cause");
  });

  it("creates authentication role errors", () => {
    const roleError = new AuthenticationRoleError("msg", "cause");
    expect(roleError).toBeInstanceOf(Error);
    expect(roleError.cause).toBe("cause");

    const validationError = new RoleValidationError("admin", "user");
    expect(validationError.message).toBe(
      "Role validation failed: expected admin, got user",
    );

    const missingProfileError = new MissingActiveProfileError();
    expect(missingProfileError.message).toBe(
      "Active profile proxy is required for role-based authentication but is null",
    );

    const invalidState = new InvalidRoleStateError("missing role", "cause");
    expect(invalidState).toBeInstanceOf(Error);
    expect(invalidState.message).toBe("Invalid role state: missing role");
    expect(invalidState.cause).toBe("cause");
  });
});

describe("redeemRefreshTokenWithRetries", () => {
  it("rejects when wallet address is empty", async () => {
    await expect(
      redeemRefreshTokenWithRetries("", refreshToken, null),
    ).rejects.toThrow("Invalid walletAddress: must be non-empty string");
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("rejects when refresh token is missing", async () => {
    await expect(
      redeemRefreshTokenWithRetries(validAddress, "" as any, null),
    ).rejects.toThrow("Invalid refreshToken: must be non-empty string");
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("rejects when retry count is outside allowed range", async () => {
    await expect(
      redeemRefreshTokenWithRetries(validAddress, refreshToken, null, 0),
    ).rejects.toThrow("Invalid retryCount: must be between 1 and 10");
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("returns the server payload on success and forwards parameters", async () => {
    const payload = { token: "new-token", address: validAddress };
    fetchMock.mockResolvedValue({
      ok: true,
      json: async () => payload,
    });

    const result = await redeemRefreshTokenWithRetries(
      validAddress,
      refreshToken,
      "user-role",
      2,
    );

    expect(result).toEqual(payload);
    expect(fetchMock).toHaveBeenCalledTimes(1);
    const [url, options] = fetchMock.mock.calls[0] as [string, RequestInit];
    expect(url).toBe("https://api.test.6529.io/api/auth/redeem-refresh-token");
    expect(options).toMatchObject({
      method: "POST",
      body: JSON.stringify({
        address: validAddress,
        token: refreshToken,
        role: "user-role",
      }),
    });
    expect(options.signal).toBeUndefined();
    expect(options.headers).toEqual(
      expect.objectContaining({ "Content-Type": "application/json" }),
    );
  });

  it("wraps network failures in TokenRefreshNetworkError", async () => {
    const networkError = Object.assign(new Error("connection lost"), {
      code: "ECONNREFUSED",
    });
    fetchMock.mockRejectedValue(networkError);

    await expect(
      redeemRefreshTokenWithRetries(validAddress, refreshToken, null, 1),
    ).rejects.toThrow(TokenRefreshNetworkError);
  });

  it("wraps HTTP failures in TokenRefreshServerError with status", async () => {
    const serverError = { status: 401, message: "Unauthorized", response: {} };
    fetchMock.mockRejectedValue(serverError);

    await expect(
      redeemRefreshTokenWithRetries(validAddress, refreshToken, null, 1),
    ).rejects.toThrow("Server error 401 on attempt 1: Unauthorized");

    // Ensure the instance includes response metadata
    const error = await redeemRefreshTokenWithRetries(
      validAddress,
      refreshToken,
      null,
      1,
    ).catch((err) => err as TokenRefreshServerError);

    expect(error).toBeInstanceOf(TokenRefreshServerError);
    expect(error.statusCode).toBe(401);
    expect(error.serverResponse).toBe(serverError.response);
  });

  it("throws TokenRefreshCancelledError when aborted before start", async () => {
    const controller = new AbortController();
    controller.abort();

    await expect(
      redeemRefreshTokenWithRetries(
        validAddress,
        refreshToken,
        null,
        3,
        controller.signal,
      ),
    ).rejects.toThrow(TokenRefreshCancelledError);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("surfaces response validation issues as TokenRefreshServerError", async () => {
    fetchMock.mockResolvedValue({
      ok: true,
      json: async () => ({ token: null, address: validAddress }),
    });

    await expect(
      redeemRefreshTokenWithRetries(validAddress, refreshToken, null, 1),
    ).rejects.toThrow("Server returned invalid token");
  });

  it("retries transient errors up to retry count", async () => {
    const transient = new Error("temporary");
    fetchMock
      .mockRejectedValueOnce(transient)
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ token: "second", address: validAddress }),
      });

    const result = await redeemRefreshTokenWithRetries(
      validAddress,
      refreshToken,
      null,
      2,
    );

    expect(result.token).toBe("second");
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  it("falls back to TokenRefreshError for unknown issues", async () => {
    fetchMock.mockRejectedValue({ message: "boom" });

    await expect(
      redeemRefreshTokenWithRetries(validAddress, refreshToken, null, 1),
    ).rejects.toThrow(TokenRefreshError);
  });
});
