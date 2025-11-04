import {
  TokenRefreshCancelledError,
  TokenRefreshError,
  TokenRefreshServerError,
} from "@/errors/authentication";
import { redeemRefreshTokenWithRetries } from "@/services/auth/token-refresh.utils";

const wallet = "0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045";
const token = "refresh-token";
const fetchMock = global.fetch as jest.Mock;

beforeEach(() => {
  jest.clearAllMocks();
  fetchMock.mockReset();
});

describe("redeemRefreshTokenWithRetries", () => {
  it("validates retry count edge cases", async () => {
    await expect(
      redeemRefreshTokenWithRetries(wallet, token, null, Number.NaN),
    ).rejects.toThrow("Invalid retryCount: NaN is not allowed");

    await expect(
      redeemRefreshTokenWithRetries(wallet, token, null, Infinity),
    ).rejects.toThrow("Invalid retryCount: Infinity is not allowed");

    await expect(
      redeemRefreshTokenWithRetries(wallet, token, null, 2.5),
    ).rejects.toThrow("Invalid retryCount: must be an integer");

    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("rejects when API returns invalid payload", async () => {
    fetchMock.mockResolvedValue({
      ok: true,
      json: async () => ({ token: null, address: wallet }),
    });

    await expect(
      redeemRefreshTokenWithRetries(wallet, token, null, 1),
    ).rejects.toThrow("Server returned invalid token");
  });

  it("surfaces invalid address in payload", async () => {
    fetchMock.mockResolvedValue({
      ok: true,
      json: async () => ({ token: "ok", address: "" }),
    });

    await expect(
      redeemRefreshTokenWithRetries(wallet, token, null, 1),
    ).rejects.toThrow("Server returned invalid address");
  });

  it("retries transient errors until limit then throws", async () => {
    fetchMock.mockRejectedValue({
      status: 500,
      message: "fail",
      response: {},
    });

    await expect(
      redeemRefreshTokenWithRetries(wallet, token, null, 2),
    ).rejects.toThrow(TokenRefreshServerError);

    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  it("returns response when a later attempt succeeds", async () => {
    fetchMock
      .mockRejectedValueOnce({ code: "NETWORK_ERROR", message: "timeout" })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ token: "new", address: wallet }),
      });

    const result = await redeemRefreshTokenWithRetries(wallet, token, null, 2);

    expect(result).toEqual({ token: "new", address: wallet });
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  it("converts AbortError from fetch into TokenRefreshCancelledError", async () => {
    const abortError = new Error("aborted");
    abortError.name = "AbortError";
    fetchMock.mockRejectedValue(abortError);

    await expect(
      redeemRefreshTokenWithRetries(wallet, token, null, 1),
    ).rejects.toThrow(TokenRefreshCancelledError);
  });

  it("wraps unexpected failures in TokenRefreshError", async () => {
    fetchMock.mockRejectedValue({ message: "boom" });

    await expect(
      redeemRefreshTokenWithRetries(wallet, token, null, 1),
    ).rejects.toThrow(TokenRefreshError);
  });
});
