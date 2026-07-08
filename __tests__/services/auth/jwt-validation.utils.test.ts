import { jwtDecode } from "jwt-decode";
import {
  getWalletAddress,
  getWalletRole,
  hasActiveSessionV2Auth,
  syncWalletRoleWithServer,
} from "@/services/auth/auth.utils";
import { getRole, validateJwt } from "@/services/auth/jwt-validation.utils";
import {
  persistSessionResponse,
  refreshSessionV2,
} from "@/services/auth/session-v2.utils";
import { areEqualAddresses } from "@/helpers/Helpers";
import { logErrorSecurely } from "@/utils/error-sanitizer";
import {
  MissingActiveProfileError,
  RoleValidationError,
} from "@/errors/authentication";
import type { ApiProfileProxy } from "@/generated/models/ApiProfileProxy";

jest.mock("jwt-decode");
jest.mock("@/services/auth/auth.utils");
jest.mock("@/services/auth/session-v2.utils", () => ({
  persistSessionResponse: jest.fn(),
  refreshSessionV2: jest.fn(),
}));
jest.mock("@/helpers/Helpers");
jest.mock("@/utils/error-sanitizer");

const mockedJwtDecode = jwtDecode as jest.MockedFunction<typeof jwtDecode>;
const mockedGetWalletAddress = getWalletAddress as jest.MockedFunction<
  typeof getWalletAddress
>;
const mockedGetWalletRole = getWalletRole as jest.MockedFunction<
  typeof getWalletRole
>;
const mockedHasActiveSessionV2Auth =
  hasActiveSessionV2Auth as jest.MockedFunction<typeof hasActiveSessionV2Auth>;
const mockedRefreshSessionV2 = refreshSessionV2 as jest.MockedFunction<
  typeof refreshSessionV2
>;
const mockedPersistSessionResponse =
  persistSessionResponse as jest.MockedFunction<typeof persistSessionResponse>;
const mockedAreEqualAddresses = areEqualAddresses as jest.MockedFunction<
  typeof areEqualAddresses
>;

const validParams = {
  jwt: "jwt-token",
  wallet: "0x123",
  role: null,
  operationId: "op-1",
  abortSignal: new AbortController().signal,
};

const expiredPayload = {
  id: "user-id",
  sub: "0x123",
  iat: 800000,
  exp: 900000,
  role: null,
};

const validPayload = {
  ...expiredPayload,
  exp: 1100000,
};

describe("jwt-validation.utils", () => {
  beforeEach(() => {
    jest.resetAllMocks();
    jest.spyOn(Date, "now").mockReturnValue(1000000 * 1000);
    mockedGetWalletAddress.mockReturnValue("0x123");
    mockedGetWalletRole.mockReturnValue(null);
    mockedHasActiveSessionV2Auth.mockReturnValue(false);
    mockedRefreshSessionV2.mockResolvedValue(null);
    mockedPersistSessionResponse.mockResolvedValue(true);
    mockedAreEqualAddresses.mockReturnValue(true);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it("extracts role from a JWT", () => {
    mockedJwtDecode.mockReturnValue({ ...validPayload, role: "admin" });

    expect(getRole("jwt-token")).toBe("admin");
  });

  it("requires session-v2 upgrade when a current JWT has no v2 session", async () => {
    mockedJwtDecode.mockReturnValue(validPayload);

    await expect(validateJwt(validParams)).resolves.toEqual({
      isValid: false,
      refreshOutcome: "empty",
      wasCancelled: false,
      requiresSessionUpgrade: true,
    });
    expect(mockedRefreshSessionV2).toHaveBeenCalledWith({
      address: "0x123",
      abortSignal: validParams.abortSignal,
    });
  });

  it("accepts a current session-v2 JWT when web cookie refresh is unavailable", async () => {
    mockedJwtDecode.mockReturnValue(validPayload);
    mockedHasActiveSessionV2Auth.mockReturnValue(true);

    await expect(validateJwt(validParams)).resolves.toEqual({
      isValid: true,
      refreshOutcome: "not_attempted",
      wasCancelled: false,
    });
    expect(mockedRefreshSessionV2).not.toHaveBeenCalled();
  });

  it("accepts a current session-v2 JWT without refreshing another connected account cookie", async () => {
    mockedJwtDecode.mockReturnValue(validPayload);
    mockedHasActiveSessionV2Auth.mockReturnValue(true);
    mockedRefreshSessionV2.mockResolvedValue({
      client_type: "web",
      address: "0x456",
      role: null,
      access_token: "other-account-access-token",
      access_token_expires_at: "2026-06-10T00:00:00.000Z",
    });
    mockedAreEqualAddresses.mockReturnValue(false);

    await expect(validateJwt(validParams)).resolves.toEqual({
      isValid: true,
      refreshOutcome: "not_attempted",
      wasCancelled: false,
    });
    expect(mockedRefreshSessionV2).not.toHaveBeenCalled();
    expect(mockedPersistSessionResponse).not.toHaveBeenCalled();
  });

  it("requires session-v2 upgrade when refresh transport fails but current JWT is valid", async () => {
    mockedJwtDecode.mockReturnValue(validPayload);
    mockedRefreshSessionV2.mockRejectedValue(new Error("Failed to fetch"));

    await expect(validateJwt(validParams)).resolves.toEqual({
      isValid: false,
      refreshOutcome: "failed",
      wasCancelled: false,
      requiresSessionUpgrade: true,
    });
  });

  it("throws refresh transport errors when current JWT is invalid", async () => {
    mockedJwtDecode.mockReturnValue(expiredPayload);
    mockedRefreshSessionV2.mockRejectedValue(new Error("Failed to fetch"));

    await expect(validateJwt(validParams)).rejects.toThrow("Failed to fetch");
  });

  it("migrates a currently valid JWT through session-v2 refresh", async () => {
    const refreshedSession = {
      client_type: "web" as const,
      address: "0x123",
      role: null,
      access_token: "fresh-access-token",
      access_token_expires_at: "2026-06-10T00:00:00.000Z",
    };
    mockedJwtDecode.mockReturnValue(validPayload);
    mockedRefreshSessionV2.mockResolvedValue(refreshedSession);

    await expect(validateJwt(validParams)).resolves.toEqual({
      isValid: true,
      refreshOutcome: "success",
      wasCancelled: false,
    });
    expect(mockedPersistSessionResponse).toHaveBeenCalledWith(refreshedSession);
  });

  it("refreshes expired JWTs through session-v2 and persists the rotated session", async () => {
    const refreshedSession = {
      client_type: "web" as const,
      address: "0x123",
      role: null,
      access_token: "fresh-access-token",
      access_token_expires_at: "2026-06-10T00:00:00.000Z",
    };
    mockedJwtDecode
      .mockReturnValueOnce(expiredPayload)
      .mockReturnValueOnce({ ...expiredPayload, role: null });
    mockedRefreshSessionV2.mockResolvedValue(refreshedSession);

    await expect(validateJwt(validParams)).resolves.toEqual({
      isValid: true,
      refreshOutcome: "success",
      wasCancelled: false,
    });
    expect(mockedRefreshSessionV2).toHaveBeenCalledWith({
      address: "0x123",
      abortSignal: validParams.abortSignal,
    });
    expect(mockedPersistSessionResponse).toHaveBeenCalledWith(refreshedSession);
    expect(syncWalletRoleWithServer).toHaveBeenCalledWith(null, "0x123");
  });

  it("refreshes the wallet being validated instead of another active stored account", async () => {
    const refreshedSession = {
      client_type: "native" as const,
      address: "0x123",
      role: null,
      access_token: "fresh-access-token",
      access_token_expires_at: "2026-06-10T00:00:00.000Z",
      native_refresh_token: "new-native-refresh-token",
      refresh_token_expires_at: "2026-07-10T00:00:00.000Z",
    };
    mockedGetWalletAddress.mockReturnValue("0x456");
    mockedJwtDecode
      .mockReturnValueOnce(expiredPayload)
      .mockReturnValueOnce({ ...expiredPayload, role: null });
    mockedRefreshSessionV2.mockResolvedValue(refreshedSession);

    await expect(validateJwt(validParams)).resolves.toEqual({
      isValid: true,
      refreshOutcome: "success",
      wasCancelled: false,
    });
    expect(mockedRefreshSessionV2).toHaveBeenCalledWith({
      address: "0x123",
      abortSignal: validParams.abortSignal,
    });
    expect(mockedPersistSessionResponse).toHaveBeenCalledWith(refreshedSession);
  });

  it("decodes the refreshed access token before persisting a rotated session", async () => {
    const refreshedSession = {
      client_type: "web" as const,
      address: "0x123",
      role: "fresh-role",
      access_token: "fresh-access-token",
      access_token_expires_at: "2026-06-10T00:00:00.000Z",
    };
    mockedJwtDecode
      .mockReturnValueOnce(expiredPayload)
      .mockReturnValueOnce({ ...expiredPayload, role: "fresh-role" });
    mockedRefreshSessionV2.mockResolvedValue(refreshedSession);

    await expect(validateJwt(validParams)).resolves.toEqual({
      isValid: true,
      refreshOutcome: "success",
      wasCancelled: false,
    });

    expect(mockedJwtDecode).toHaveBeenNthCalledWith(1, "jwt-token");
    expect(mockedJwtDecode).toHaveBeenNthCalledWith(2, "fresh-access-token");
    expect(mockedPersistSessionResponse).toHaveBeenCalledWith(refreshedSession);
    expect(syncWalletRoleWithServer).toHaveBeenCalledWith(
      "fresh-role",
      "0x123"
    );
  });

  it("stores rotated native refresh tokens through session persistence", async () => {
    const refreshedSession = {
      client_type: "native" as const,
      address: "0x123",
      role: null,
      access_token: "fresh-access-token",
      access_token_expires_at: "2026-06-10T00:00:00.000Z",
      native_refresh_token: "new-native-refresh-token",
      refresh_token_expires_at: "2026-07-10T00:00:00.000Z",
    };
    mockedJwtDecode
      .mockReturnValueOnce(expiredPayload)
      .mockReturnValueOnce({ ...expiredPayload, role: null });
    mockedRefreshSessionV2.mockResolvedValue(refreshedSession);

    await validateJwt(validParams);

    expect(mockedPersistSessionResponse).toHaveBeenCalledWith(
      expect.objectContaining({
        client_type: "native",
        native_refresh_token: "new-native-refresh-token",
      })
    );
  });

  it("returns invalid when session-v2 refresh has no session", async () => {
    mockedJwtDecode.mockReturnValue(expiredPayload);
    mockedRefreshSessionV2.mockResolvedValue(null);

    await expect(validateJwt(validParams)).resolves.toEqual({
      isValid: false,
      refreshOutcome: "empty",
      wasCancelled: false,
    });
  });

  it("rejects refresh responses for a different address", async () => {
    mockedJwtDecode.mockReturnValue(expiredPayload);
    mockedRefreshSessionV2.mockResolvedValue({
      client_type: "web",
      address: "0x456",
      role: null,
      access_token: "fresh-access-token",
      access_token_expires_at: "2026-06-10T00:00:00.000Z",
    });
    mockedAreEqualAddresses.mockReturnValue(false);

    await expect(validateJwt(validParams)).rejects.toThrow(
      "Address mismatch in token response: expected 0x123, got 0x456"
    );
    expect(mockedPersistSessionResponse).not.toHaveBeenCalled();
    expect(syncWalletRoleWithServer).not.toHaveBeenCalled();
  });

  it("validates requested proxy role against the refreshed JWT role", async () => {
    const proxy = {
      created_by: { id: "role-1" },
    } as ApiProfileProxy;
    mockedJwtDecode
      .mockReturnValueOnce({ ...expiredPayload, role: "role-1" })
      .mockReturnValueOnce({ ...expiredPayload, role: "role-1" });
    mockedRefreshSessionV2.mockResolvedValue({
      client_type: "web",
      address: "0x123",
      role: "role-1",
      access_token: "fresh-access-token",
      access_token_expires_at: "2026-06-10T00:00:00.000Z",
    });

    await expect(
      validateJwt({
        ...validParams,
        role: "role-1",
        activeProfileProxy: proxy,
      })
    ).resolves.toEqual({
      isValid: true,
      refreshOutcome: "success",
      wasCancelled: false,
    });
  });

  it("throws when a proxy role is requested without an active proxy", async () => {
    mockedJwtDecode
      .mockReturnValueOnce({ ...expiredPayload, role: "role-1" })
      .mockReturnValueOnce({ ...expiredPayload, role: "role-1" });
    mockedRefreshSessionV2.mockResolvedValue({
      client_type: "web",
      address: "0x123",
      role: "role-1",
      access_token: "fresh-access-token",
      access_token_expires_at: "2026-06-10T00:00:00.000Z",
    });

    await expect(
      validateJwt({ ...validParams, role: "role-1" })
    ).rejects.toThrow(MissingActiveProfileError);
  });

  it("throws when refreshed token role does not match requested role", async () => {
    const proxy = {
      created_by: { id: "role-1" },
    } as ApiProfileProxy;
    mockedJwtDecode
      .mockReturnValueOnce({ ...expiredPayload, role: "role-1" })
      .mockReturnValueOnce({ ...expiredPayload, role: "role-2" });
    mockedRefreshSessionV2.mockResolvedValue({
      client_type: "web",
      address: "0x123",
      role: "role-2",
      access_token: "fresh-access-token",
      access_token_expires_at: "2026-06-10T00:00:00.000Z",
    });

    await expect(
      validateJwt({
        ...validParams,
        role: "role-1",
        activeProfileProxy: proxy,
      })
    ).rejects.toThrow(RoleValidationError);
    expect(mockedPersistSessionResponse).not.toHaveBeenCalled();
    expect(syncWalletRoleWithServer).not.toHaveBeenCalled();
  });

  it("does not refresh or persist when validation starts with an aborted signal", async () => {
    const abortController = new AbortController();
    abortController.abort();

    await expect(
      validateJwt({
        ...validParams,
        abortSignal: abortController.signal,
      })
    ).resolves.toEqual({
      isValid: false,
      refreshOutcome: "cancelled",
      wasCancelled: true,
    });

    expect(mockedJwtDecode).not.toHaveBeenCalled();
    expect(mockedRefreshSessionV2).not.toHaveBeenCalled();
    expect(mockedPersistSessionResponse).not.toHaveBeenCalled();
    expect(syncWalletRoleWithServer).not.toHaveBeenCalled();
  });

  it("treats AbortError during persistence as cancelled", async () => {
    mockedJwtDecode
      .mockReturnValueOnce(expiredPayload)
      .mockReturnValueOnce({ ...expiredPayload, role: null });
    mockedRefreshSessionV2.mockResolvedValue({
      client_type: "web",
      address: "0x123",
      role: null,
      access_token: "fresh-access-token",
      access_token_expires_at: "2026-06-10T00:00:00.000Z",
    });
    mockedPersistSessionResponse.mockRejectedValue(
      Object.assign(new Error("aborted"), { name: "AbortError" })
    );

    await expect(validateJwt(validParams)).resolves.toEqual({
      isValid: false,
      refreshOutcome: "cancelled",
      wasCancelled: true,
    });
  });

  it("logs role changes when refreshed token role changes local role", async () => {
    mockedGetWalletRole.mockReturnValue("old-role");
    mockedJwtDecode
      .mockReturnValueOnce(expiredPayload)
      .mockReturnValueOnce({ ...expiredPayload, role: "new-role" });
    mockedRefreshSessionV2.mockResolvedValue({
      client_type: "web",
      address: "0x123",
      role: "new-role",
      access_token: "fresh-access-token",
      access_token_expires_at: "2026-06-10T00:00:00.000Z",
    });

    await validateJwt(validParams);

    expect(logErrorSecurely).toHaveBeenCalledWith("JWT_ROLE_UPDATE", {
      message: "Updating local wallet role from old-role to new-role",
      oldRole: "old-role",
      newRole: "new-role",
      address: "0x123",
    });
  });
});
