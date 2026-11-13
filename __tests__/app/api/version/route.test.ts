jest.mock("server-only", () => ({}), { virtual: true });
jest.mock("next/server", () => ({
  NextResponse: {
    json: jest.fn(),
  },
}));

import {
  __resetAnnouncedVersionCacheForTests,
  GET,
} from "@/app/api/version/route";
import { NextResponse } from "next/server";
import { VERSION_POLL_HEADERS } from "@/lib/version/versionPoll";

const jsonMock = NextResponse.json as jest.Mock;
const NO_STORE_HEADERS = { "Cache-Control": "no-store, must-revalidate" };
const ANNOUNCED_VERSION_ENDPOINT =
  "https://dnclu2fna0b2b.cloudfront.net/web_build/current-production-version.json";

function requestWithClientVersion(version: string, order?: string): Request {
  const headers = new Headers({ [VERSION_POLL_HEADERS.version]: version });
  if (order !== undefined)
    headers.set(VERSION_POLL_HEADERS.releaseOrder, order);
  return new Request("https://6529.io/api/version", { headers });
}

describe("GET version route", () => {
  let stdoutWrite: jest.SpyInstance;

  beforeEach(() => {
    jest.clearAllMocks();
    __resetAnnouncedVersionCacheForTests();
    globalThis.fetch = jest.fn();
    const { publicEnv } = require("@/config/env");
    publicEnv.BASE_ENDPOINT = "https://staging.6529.io";
    publicEnv.VERSION = "current-version";
    publicEnv.VERSION_BUILD_TIMESTAMP = "2026-07-09T10:00:00.000Z";
    publicEnv.VERSION_RELEASE_ORDER = undefined;
    publicEnv.ANNOUNCED_VERSION_ENDPOINT = undefined;
    stdoutWrite = jest.spyOn(process.stdout, "write").mockReturnValue(true);
  });

  afterEach(() => {
    jest.restoreAllMocks();
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

  it.each([undefined, "", "https://example.com/version.json"])(
    "requires a valid announcement on production even with endpoint %s",
    async (endpoint) => {
      const { publicEnv } = require("@/config/env");
      publicEnv.BASE_ENDPOINT = "https://6529.io";
      publicEnv.ANNOUNCED_VERSION_ENDPOINT = endpoint;
      await GET(requestWithClientVersion("previous-version"));
      expect(jsonMock).toHaveBeenCalledWith(
        { announced_version: null, stale: false, version: "current-version" },
        { headers: NO_STORE_HEADERS }
      );
      expect(globalThis.fetch).not.toHaveBeenCalled();
    }
  );

  it.each(["timeout", "http", "malformed", "not-ready"])(
    "does not advertise an update after an announcement %s result",
    async (failure) => {
      const { publicEnv } = require("@/config/env");
      publicEnv.BASE_ENDPOINT = "https://6529.io";
      publicEnv.ANNOUNCED_VERSION_ENDPOINT = ANNOUNCED_VERSION_ENDPOINT;
      if (failure === "timeout") {
        (globalThis.fetch as jest.Mock).mockRejectedValue(
          new DOMException("Timed out", "AbortError")
        );
      } else {
        (globalThis.fetch as jest.Mock).mockResolvedValue({
          ok: failure !== "http",
          json: async () => {
            if (failure === "malformed") throw new SyntaxError("Invalid JSON");
            return { ready: false, version: "next-version" };
          },
        });
      }
      await GET(requestWithClientVersion("previous-version"));
      expect(jsonMock).toHaveBeenCalledWith(
        { announced_version: null, stale: false, version: "current-version" },
        { headers: NO_STORE_HEADERS }
      );
    }
  );

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

  it("coalesces concurrent announcement requests and reuses the short cache", async () => {
    const { publicEnv } = require("@/config/env");
    publicEnv.ANNOUNCED_VERSION_ENDPOINT = ANNOUNCED_VERSION_ENDPOINT;
    jsonMock.mockReturnValue({ ok: true });
    (globalThis.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: async () => ({
        published_at: "2026-07-09T10:05:00.000Z",
        ready: true,
        version: "announced-version",
      }),
    });

    await Promise.all([GET(), GET()]);
    await GET();

    expect(globalThis.fetch).toHaveBeenCalledTimes(1);
    expect(jsonMock).toHaveBeenCalledTimes(3);
    expect(jsonMock).toHaveBeenLastCalledWith(
      {
        announced_version: "announced-version",
        stale: true,
        version: "current-version",
      },
      { headers: NO_STORE_HEADERS }
    );
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

  it.each([
    ["older release", 1199, "1200", false],
    ["same order", 1200, "1200", false],
    ["newer release", 1201, "1200", true],
    ["same commit with a higher order", 1201, "1200", false, "client-version"],
    ["malformed release order", "1201junk", "1200", false],
    ["old announcement format", undefined, "1200", false],
    ["legacy tab", 1201, undefined, true],
  ])(
    "checks ordered announcements for %s",
    async (
      _case,
      order,
      clientOrder,
      stale,
      announcedVersion = "different-version"
    ) => {
      const { publicEnv } = require("@/config/env");
      publicEnv.BASE_ENDPOINT = "https://6529.io";
      publicEnv.VERSION_RELEASE_ORDER = "1199";
      publicEnv.ANNOUNCED_VERSION_ENDPOINT = ANNOUNCED_VERSION_ENDPOINT;
      (globalThis.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: async () => ({
          published_at: "2026-07-09T10:05:00.000Z",
          ready: true,
          release_order: order,
          version: announcedVersion,
        }),
      });

      await GET(requestWithClientVersion("client-version", clientOrder));

      expect(jsonMock).toHaveBeenCalledWith(
        {
          announced_version: announcedVersion,
          ...(typeof order === "number"
            ? { announced_release_order: order }
            : {}),
          stale,
          version: "current-version",
        },
        { headers: NO_STORE_HEADERS }
      );
    }
  );

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

  it("suppresses updates when the configured announcement endpoint is invalid", async () => {
    const { publicEnv } = require("@/config/env");
    publicEnv.ANNOUNCED_VERSION_ENDPOINT =
      "https://example.com/current-production-version.json";
    const warnMock = jest
      .spyOn(console, "warn")
      .mockImplementation(() => undefined);
    jsonMock.mockReturnValue({ ok: true });

    await GET(requestWithClientVersion("previous-version"));

    expect(globalThis.fetch).not.toHaveBeenCalled();
    expect(warnMock).toHaveBeenCalledWith(
      "Ignoring invalid ANNOUNCED_VERSION_ENDPOINT; update availability is unconfirmed."
    );
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

  it("suppresses updates when the announcement request fails", async () => {
    const { publicEnv } = require("@/config/env");
    const error = new Error("network");
    publicEnv.ANNOUNCED_VERSION_ENDPOINT = ANNOUNCED_VERSION_ENDPOINT;
    const warnMock = jest
      .spyOn(console, "warn")
      .mockImplementation(() => undefined);
    jsonMock.mockReturnValue({ ok: true });
    (globalThis.fetch as jest.Mock).mockRejectedValue(error);

    await GET(requestWithClientVersion("previous-version"));

    expect(warnMock).toHaveBeenCalledWith(
      "Failed to fetch announced version; update availability is unconfirmed.",
      error
    );
    expect(jsonMock).toHaveBeenCalledWith(
      {
        announced_version: null,
        stale: false,
        version: "current-version",
      },
      { headers: NO_STORE_HEADERS }
    );
  });

  it("logs a hidden tab's poll with the staleness it returned", async () => {
    jsonMock.mockReturnValue({ ok: true });
    const values: Record<string, string> = {
      [VERSION_POLL_HEADERS.version]:
        "0123456789abcdef0123456789abcdef01234567",
      "x-6529-client-hidden": "1",
      "x-6529-client-age-min": "90",
      "x-6529-client-releases-behind": "2",
    };

    await GET({
      headers: { get: (name: string) => values[name] ?? null },
    } as Request);

    expect(stdoutWrite).toHaveBeenCalledWith(
      "version_poll v=0123456789ab stale=1 behind=2 age_min=90 hidden=1 rate=1\n"
    );
  });
});
