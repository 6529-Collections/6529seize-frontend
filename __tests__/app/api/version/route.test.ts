jest.mock("next/server", () => ({
  NextResponse: {
    json: jest.fn(),
  },
}));

import { GET } from "@/app/api/version/route";
import { NextResponse } from "next/server";

const jsonMock = NextResponse.json as jest.Mock;
const NO_STORE_HEADERS = { "Cache-Control": "no-store, must-revalidate" };
const CLIENT_VERSION_HEADER = "x-6529-client-version";
const ANNOUNCED_VERSION_ENDPOINT =
  "https://dnclu2fna0b2b.cloudfront.net/web_build/current-production-version.json";

const requestWithClientVersion = (version: string) =>
  ({
    headers: {
      get: (name: string) => (name === CLIENT_VERSION_HEADER ? version : null),
    },
  }) as Request;

describe("GET version route", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    globalThis.fetch = jest.fn();
    const { publicEnv } = require("@/config/env");
    publicEnv.VERSION = "current-version";
    publicEnv.VERSION_BUILD_TIMESTAMP = "2026-07-09T10:00:00.000Z";
    publicEnv.ANNOUNCED_VERSION_ENDPOINT = undefined;
  });

  it("returns current instance version fields and disables cache", async () => {
    const expected = { foo: "bar" }; // placeholder return object
    jsonMock.mockReturnValue(expected);

    const result = await GET();
    expect(globalThis.fetch).not.toHaveBeenCalled();
    expect(jsonMock).toHaveBeenCalledWith(
      {
        announced_version: null,
        stale: false,
        version: "current-version",
      },
      { headers: NO_STORE_HEADERS }
    );
    expect(result).toBe(expected);
  });

  it("compares live instance version to the requesting bundle without an announcement endpoint", async () => {
    jsonMock.mockReturnValue({ ok: true });

    await GET(requestWithClientVersion("previous-version"));

    expect(jsonMock).toHaveBeenCalledWith(
      {
        announced_version: null,
        stale: true,
        version: "current-version",
      },
      { headers: NO_STORE_HEADERS }
    );
  });

  it("returns default version when env variable is undefined", async () => {
    const { publicEnv } = require("@/config/env");
    publicEnv.VERSION = undefined;
    const expected = { foo: "bar" };
    jsonMock.mockReturnValue(expected);

    const result = await GET();
    expect(jsonMock).toHaveBeenCalledWith(
      {
        announced_version: null,
        stale: false,
        version: "unknown",
      },
      { headers: NO_STORE_HEADERS }
    );
    expect(result).toBe(expected);
  });

  it("includes the externally announced version when it is ready", async () => {
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
      {
        announced_version: "announced-version",
        stale: true,
        version: "current-version",
      },
      { headers: NO_STORE_HEADERS }
    );
    expect(result).toBe(expected);
  });

  it("reports not stale when the ready announcement matches this instance", async () => {
    const { publicEnv } = require("@/config/env");
    publicEnv.ANNOUNCED_VERSION_ENDPOINT = ANNOUNCED_VERSION_ENDPOINT;
    jsonMock.mockReturnValue({ ok: true });
    (globalThis.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: async () => ({
        published_at: "2026-07-09T10:05:00.000Z",
        ready: true,
        version: "current-version",
      }),
    });

    await GET();

    expect(jsonMock).toHaveBeenCalledWith(
      {
        announced_version: "current-version",
        stale: false,
        version: "current-version",
      },
      { headers: NO_STORE_HEADERS }
    );
  });

  it("compares ready announcements to the requesting bundle", async () => {
    const { publicEnv } = require("@/config/env");
    publicEnv.ANNOUNCED_VERSION_ENDPOINT = ANNOUNCED_VERSION_ENDPOINT;
    jsonMock.mockReturnValue({ ok: true });
    (globalThis.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: async () => ({
        published_at: "2026-07-09T10:05:00.000Z",
        ready: true,
        version: "current-version",
      }),
    });

    await GET(requestWithClientVersion("previous-version"));

    expect(jsonMock).toHaveBeenCalledWith(
      {
        announced_version: "current-version",
        stale: true,
        version: "current-version",
      },
      { headers: NO_STORE_HEADERS }
    );
  });

  it("ignores announcements that predate this build", async () => {
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
      {
        announced_version: null,
        stale: false,
        version: "current-version",
      },
      { headers: NO_STORE_HEADERS }
    );
  });

  it("waits for a configured announcement before staling an older bundle", async () => {
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

    await GET(requestWithClientVersion("previous-version"));

    expect(jsonMock).toHaveBeenCalledWith(
      {
        announced_version: null,
        stale: false,
        version: "current-version",
      },
      { headers: NO_STORE_HEADERS }
    );
  });

  it("ignores announcements that are not explicitly ready", async () => {
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
      {
        announced_version: null,
        stale: false,
        version: "current-version",
      },
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
      {
        announced_version: "announced-version",
        stale: true,
        version: "current-version",
      },
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
      {
        announced_version: null,
        stale: false,
        version: "current-version",
      },
      { headers: NO_STORE_HEADERS }
    );
  });

  it("falls back to current instance fields when the announcement request fails", async () => {
    const { publicEnv } = require("@/config/env");
    publicEnv.ANNOUNCED_VERSION_ENDPOINT = ANNOUNCED_VERSION_ENDPOINT;
    jsonMock.mockReturnValue({ ok: true });
    (globalThis.fetch as jest.Mock).mockRejectedValue(new Error("network"));

    await GET();

    expect(jsonMock).toHaveBeenCalledWith(
      {
        announced_version: null,
        stale: false,
        version: "current-version",
      },
      { headers: NO_STORE_HEADERS }
    );
  });
});
