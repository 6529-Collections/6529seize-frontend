import { getAppCommonHeaders } from "@/helpers/server.app.helpers";

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
        name === "x-6529-auth" ? { value: "auth-token" } : undefined,
    });

    const headers = await getAppCommonHeaders();
    expect(headers).toEqual({ "x-6529-auth": "auth-token" });
  });

  it("includes Authorization header when wallet-auth cookie exists", async () => {
    (cookies as jest.Mock).mockResolvedValue({
      get: (name: string) =>
        name === "wallet-auth" ? { value: "wallet-token" } : undefined,
    });

    const headers = await getAppCommonHeaders();
    expect(headers).toEqual({ Authorization: "Bearer wallet-token" });
  });

  it("includes both headers when both cookies exist", async () => {
    (cookies as jest.Mock).mockResolvedValue({
      get: (name: string) => {
        if (name === "x-6529-auth") return { value: "auth-token" };
        if (name === "wallet-auth") return { value: "wallet-token" };
        return undefined;
      },
    });

    const headers = await getAppCommonHeaders();
    expect(headers).toEqual({
      "x-6529-auth": "auth-token",
      Authorization: "Bearer wallet-token",
    });
  });
});
