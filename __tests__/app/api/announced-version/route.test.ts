jest.mock("next/server", () => ({
  NextResponse: {
    json: jest.fn(),
  },
}));

import { GET } from "@/app/api/announced-version/route";
import { NextResponse } from "next/server";

const jsonMock = NextResponse.json as jest.Mock;
const NO_STORE_HEADERS = { "Cache-Control": "no-store, must-revalidate" };
const ANNOUNCED_VERSION_ENDPOINT =
  "https://dnclu2fna0b2b.cloudfront.net/web_build/current-production-version.json";

describe("GET announced version route", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    globalThis.fetch = jest.fn();
    const { publicEnv } = require("@/config/env");
    publicEnv.VERSION = "current-version";
    publicEnv.VERSION_BUILD_TIMESTAMP = "2026-07-09T10:00:00.000Z";
    publicEnv.ANNOUNCED_VERSION_ENDPOINT = undefined;
  });

  it("returns the current instance version when no announcement endpoint is configured", async () => {
    const expected = { foo: "bar" };
    jsonMock.mockReturnValue(expected);

    const result = await GET();

    expect(globalThis.fetch).not.toHaveBeenCalled();
    expect(jsonMock).toHaveBeenCalledWith(
      { version: "current-version" },
      { headers: NO_STORE_HEADERS }
    );
    expect(result).toBe(expected);
  });

  it("returns the externally announced version when it is ready", async () => {
    const { publicEnv } = require("@/config/env");
    publicEnv.ANNOUNCED_VERSION_ENDPOINT = ANNOUNCED_VERSION_ENDPOINT;
    const expected = { foo: "bar" };
    jsonMock.mockReturnValue(expected);
    (globalThis.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: async () => ({
        published_at: "2026-07-09T10:05:00.000Z",
        ready: true,
        version: "announced-version",
      }),
    });

    const result = await GET();

    expect(globalThis.fetch).toHaveBeenCalledWith(
      ANNOUNCED_VERSION_ENDPOINT,
      expect.objectContaining({
        cache: "no-store",
        headers: expect.objectContaining({
          Accept: "application/json",
          "Cache-Control": "no-cache",
          Pragma: "no-cache",
        }),
      })
    );
    expect(jsonMock).toHaveBeenCalledWith(
      { version: "announced-version" },
      { headers: NO_STORE_HEADERS }
    );
    expect(result).toBe(expected);
  });

  it("keeps the current version when the announcement predates this build", async () => {
    const { publicEnv } = require("@/config/env");
    publicEnv.ANNOUNCED_VERSION_ENDPOINT = ANNOUNCED_VERSION_ENDPOINT;
    jsonMock.mockReturnValue({ ok: true });
    (globalThis.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: async () => ({
        published_at: "2026-07-09T09:55:00.000Z",
        ready: true,
        version: "previous-version",
      }),
    });

    await GET();

    expect(jsonMock).toHaveBeenCalledWith(
      { version: "current-version" },
      { headers: NO_STORE_HEADERS }
    );
  });

  it("falls back to the current version when the announcement is not ready", async () => {
    const { publicEnv } = require("@/config/env");
    publicEnv.ANNOUNCED_VERSION_ENDPOINT = ANNOUNCED_VERSION_ENDPOINT;
    jsonMock.mockReturnValue({ ok: true });
    (globalThis.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: async () => ({ ready: false, version: "announced-version" }),
    });

    await GET();

    expect(jsonMock).toHaveBeenCalledWith(
      { version: "current-version" },
      { headers: NO_STORE_HEADERS }
    );
  });

  it("falls back to the current version when ready is omitted", async () => {
    const { publicEnv } = require("@/config/env");
    publicEnv.ANNOUNCED_VERSION_ENDPOINT = ANNOUNCED_VERSION_ENDPOINT;
    jsonMock.mockReturnValue({ ok: true });
    (globalThis.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: async () => ({
        published_at: "2026-07-09T10:05:00.000Z",
        version: "announced-version",
      }),
    });

    await GET();

    expect(jsonMock).toHaveBeenCalledWith(
      { version: "current-version" },
      { headers: NO_STORE_HEADERS }
    );
  });

  it("uses a ready announcement when this build has no timestamp", async () => {
    const { publicEnv } = require("@/config/env");
    publicEnv.ANNOUNCED_VERSION_ENDPOINT = ANNOUNCED_VERSION_ENDPOINT;
    publicEnv.VERSION_BUILD_TIMESTAMP = undefined;
    jsonMock.mockReturnValue({ ok: true });
    (globalThis.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: async () => ({
        published_at: "2026-07-09T10:05:00.000Z",
        ready: true,
        version: "announced-version",
      }),
    });

    await GET();

    expect(jsonMock).toHaveBeenCalledWith(
      { version: "announced-version" },
      { headers: NO_STORE_HEADERS }
    );
  });

  it("does not fetch disallowed announcement endpoints", async () => {
    const { publicEnv } = require("@/config/env");
    publicEnv.ANNOUNCED_VERSION_ENDPOINT =
      "https://example.com/current-production-version.json";
    jsonMock.mockReturnValue({ ok: true });

    await GET();

    expect(globalThis.fetch).not.toHaveBeenCalled();
    expect(jsonMock).toHaveBeenCalledWith(
      { version: "current-version" },
      { headers: NO_STORE_HEADERS }
    );
  });

  it("falls back to the current version when the announcement request fails", async () => {
    const { publicEnv } = require("@/config/env");
    publicEnv.ANNOUNCED_VERSION_ENDPOINT = ANNOUNCED_VERSION_ENDPOINT;
    jsonMock.mockReturnValue({ ok: true });
    (globalThis.fetch as jest.Mock).mockRejectedValue(new Error("network"));

    await GET();

    expect(jsonMock).toHaveBeenCalledWith(
      { version: "current-version" },
      { headers: NO_STORE_HEADERS }
    );
  });
});
