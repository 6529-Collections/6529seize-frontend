import { API_AUTH_COOKIE } from "@/constants/constants";
import { getAppCommonHeaders } from "@/helpers/server.app.helpers";
import { WALLET_AUTH_COOKIE } from "@/services/auth/auth.utils";

// Mock next/headers
jest.mock("next/headers", () => ({
  cookies: jest.fn(),
}));

import { cookies } from "next/headers";

describe("getAppCommonHeaders", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("returns empty headers when no cookies are present", async () => {
    (cookies as jest.Mock).mockResolvedValue({
      get: jest.fn().mockReturnValue(undefined),
    });

    const headers = await getAppCommonHeaders();
    expect(headers).toEqual({});
  });

  it("includes x-6529-auth header when cookie exists", async () => {
    (cookies as jest.Mock).mockResolvedValue({
      get: (name: string) =>
        name === API_AUTH_COOKIE ? { value: "auth-token" } : undefined,
    });

    const headers = await getAppCommonHeaders();
    expect(headers).toEqual({ [API_AUTH_COOKIE]: "auth-token" });
  });

  it("includes Authorization header when wallet-auth cookie exists", async () => {
    (cookies as jest.Mock).mockResolvedValue({
      get: (name: string) =>
        name === WALLET_AUTH_COOKIE ? { value: "wallet-token" } : undefined,
    });

    const headers = await getAppCommonHeaders();
    expect(headers).toEqual({ Authorization: "Bearer wallet-token" });
  });

  it("includes both headers when both cookies exist", async () => {
    (cookies as jest.Mock).mockResolvedValue({
      get: (name: string) => {
        if (name === API_AUTH_COOKIE) return { value: "auth-token" };
        if (name === WALLET_AUTH_COOKIE) return { value: "wallet-token" };
        return undefined;
      },
    });

    const headers = await getAppCommonHeaders();
    expect(headers).toEqual({
      [API_AUTH_COOKIE]: "auth-token",
      Authorization: "Bearer wallet-token",
    });
  });
});
