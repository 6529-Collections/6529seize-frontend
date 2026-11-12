import {
  AuthenticationNonceError,
  InvalidSignerAddressError,
  NonceResponseValidationError,
  SignInRateLimitedError,
} from "@/components/auth/authErrors";
import { getAuthNonce } from "@/components/auth/authNonce";
import type { ApiSessionNonceResponse } from "@/generated/models/ApiSessionNonceResponse";
import type { SessionNonceDeviceGrantParams } from "@/services/auth/session-v2.types";
import { getSessionNonce } from "@/services/auth/session-v2.utils";

jest.mock("@/services/auth/session-v2.utils", () => ({
  getSessionNonce: jest.fn(),
}));

const signerAddress = "0x0000000000000000000000000000000000000001";
const mockedGetSessionNonce = jest.mocked(getSessionNonce);

describe("getAuthNonce", () => {
  beforeEach(() => {
    mockedGetSessionNonce.mockReset();
  });

  it("returns a valid challenge and forwards the device grant", async () => {
    const response: ApiSessionNonceResponse = {
      signable_message: "Sign in to 6529",
      server_signature: "0xsig",
    };
    mockedGetSessionNonce.mockResolvedValue(response);
    const deviceGrant: SessionNonceDeviceGrantParams = {
      device_key: "ab".repeat(32),
      device_key_type: "ed25519",
      device_scopes: "drop.post",
    };

    await expect(getAuthNonce({ signerAddress, deviceGrant })).resolves.toBe(
      response
    );
    expect(mockedGetSessionNonce).toHaveBeenCalledWith({
      signerAddress,
      deviceGrant,
    });
  });

  it("rejects an invalid signer address without calling the API", async () => {
    await expect(
      getAuthNonce({ signerAddress: "not-an-address" })
    ).rejects.toBeInstanceOf(InvalidSignerAddressError);
    expect(mockedGetSessionNonce).not.toHaveBeenCalled();
  });

  it("treats an empty response body as a validation failure", async () => {
    // The declared type is non-null; an empty body still arrives as null.
    mockedGetSessionNonce.mockResolvedValue(
      null as unknown as ApiSessionNonceResponse
    );

    await expect(getAuthNonce({ signerAddress })).rejects.toBeInstanceOf(
      NonceResponseValidationError
    );
  });

  it("rejects a challenge without a server signature", async () => {
    mockedGetSessionNonce.mockResolvedValue({
      signable_message: "Sign in to 6529",
      server_signature: " ",
    });

    await expect(getAuthNonce({ signerAddress })).rejects.toBeInstanceOf(
      NonceResponseValidationError
    );
  });

  it("wraps transport failures as nonce errors", async () => {
    mockedGetSessionNonce.mockRejectedValue(new Error("offline"));

    await expect(getAuthNonce({ signerAddress })).rejects.toBeInstanceOf(
      AuthenticationNonceError
    );
  });

  it("reports too many sign-in attempts separately from transport failures", async () => {
    mockedGetSessionNonce.mockRejectedValue(
      Object.assign(new Error("Rate limit exceeded"), {
        status: 429,
        response: {
          status: 429,
          headers: new Headers({ "Retry-After": "6" }),
          body: '{"error":"Rate limit exceeded","retryAfter":6}',
        },
      })
    );

    await expect(getAuthNonce({ signerAddress })).rejects.toBeInstanceOf(
      SignInRateLimitedError
    );
  });

  it("keeps other HTTP failures as nonce errors", async () => {
    mockedGetSessionNonce.mockRejectedValue(
      Object.assign(new Error("Service unavailable"), { status: 503 })
    );

    await expect(getAuthNonce({ signerAddress })).rejects.toBeInstanceOf(
      AuthenticationNonceError
    );
  });
});
