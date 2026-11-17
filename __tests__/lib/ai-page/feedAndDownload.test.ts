/** @jest-environment node */
import type { AiBucketObject } from "@/lib/ai-page/releasesBucket";
import { aiFeedEntry, AI_TEST_FEED, feedBytes } from "./fixtures";
import { signAiFeed } from "./feedSigning";

const mockRead = jest.fn<Promise<AiBucketObject>, [string]>();
const mockPresign = jest.fn(
  async (key: string, options: { responseParams?: Record<string, string> }) =>
    `https://bucket.example/${key}?${new URLSearchParams(options.responseParams).toString()}`
);

jest.mock("@/lib/ai-page/releasesBucket", () => ({
  AI_FEED_OBJECT_KEY: "feed/releases.json",
  AI_FEED_SIGNATURE_OBJECT_KEY: "feed/releases.json.sig",
  getAiReleaseObjectKey: (version: string, name: string) =>
    `releases/${version}/${name}`,
  readAiReleaseObject: (key: string) => mockRead(key),
  presignAiReleaseObject: (
    key: string,
    options: { responseParams?: Record<string, string> }
  ) => mockPresign(key, options),
}));
jest.mock("@/lib/ai-page/feedSigningKeys", () => ({
  AI_FEED_SIGNING_KEYS: [jest.requireActual("./feedSigning").TEST_AI_FEED_KEY],
}));

import { GET as downloadRoute } from "@/app/ai/download/[...path]/route";
import { GET as feedRoute } from "@/app/ai/releases.json/route";
import { GET as signatureRoute } from "@/app/ai/releases.json.sig/route";
import { resetAiReleaseFeedCacheForTests } from "@/lib/ai-page/releaseFeed";
import { resolveAiReleaseDownload } from "@/lib/ai-page/releaseDownload";

const FEED_BYTES = feedBytes();
const SIG_BYTES = signAiFeed(FEED_BYTES);
const DMG = "6529-ai-0.1.0-macos-arm64.dmg";

function found(body: Uint8Array<ArrayBuffer>, etag: string): AiBucketObject {
  return {
    state: "found",
    body,
    etag,
    lastModified: "Tue, 17 Nov 2026 12:00:00 GMT",
  };
}

function storeHas(objects: Record<string, AiBucketObject>) {
  mockRead.mockImplementation(
    async (key) => objects[key] ?? { state: "missing" }
  );
}

/** The feed and its signature, as 6529 AI's release tool uploads them. */
function storeHasSigned(feed: Uint8Array<ArrayBuffer> = FEED_BYTES) {
  storeHas({
    "feed/releases.json": found(feed, '"e"'),
    "feed/releases.json.sig": found(signAiFeed(feed), '"s"'),
  });
}

function download(...path: string[]) {
  return downloadRoute(new Request("https://6529.io/ai/download"), {
    params: Promise.resolve({ path }),
  });
}

describe("6529 AI's release feed endpoints", () => {
  beforeEach(() => {
    resetAiReleaseFeedCacheForTests();
    mockRead.mockReset();
    mockPresign.mockClear();
  });

  it("serves the feed and its signature byte for byte, public, for five minutes", async () => {
    storeHas({
      "feed/releases.json": found(FEED_BYTES, '"feed-etag"'),
      "feed/releases.json.sig": found(SIG_BYTES, '"sig-etag"'),
    });
    const feed = await feedRoute(
      new Request("https://6529.io/ai/releases.json")
    );
    expect(feed.status).toBe(200);
    expect(feed.headers.get("content-type")).toBe(
      "application/json; charset=utf-8"
    );
    expect(feed.headers.get("cache-control")).toBe("public, max-age=300");
    expect(feed.headers.get("x-robots-tag")).toBe("noindex, nofollow");
    expect(feed.headers.get("etag")).toBe('"feed-etag"');
    expect(new Uint8Array(await feed.arrayBuffer())).toEqual(FEED_BYTES);

    const sig = await signatureRoute(
      new Request("https://6529.io/ai/releases.json.sig")
    );
    expect(sig.status).toBe(200);
    expect(new Uint8Array(await sig.arrayBuffer())).toEqual(SIG_BYTES);

    const cached = await feedRoute(
      new Request("https://6529.io/ai/releases.json", {
        headers: { "if-none-match": '"feed-etag"' },
      })
    );
    expect(cached.status).toBe(304);
    // Every answer came from one read of the two objects.
    expect(mockRead).toHaveBeenCalledTimes(2);
  });

  it("answers 404 before the first feed and 503 when S3 fails", async () => {
    storeHas({});
    const missing = await feedRoute(new Request("https://6529.io/x"));
    expect(missing.status).toBe(404);
    expect(await missing.text()).toBe("No release yet.\n");

    resetAiReleaseFeedCacheForTests();
    mockRead.mockResolvedValue({ state: "error", reason: "S3 answered 500" });
    const failed = await feedRoute(new Request("https://6529.io/x"));
    expect(failed.status).toBe(503);
    expect(failed.headers.get("cache-control")).toBe("no-store");
  });

  it.each([
    ["no signature", {}],
    [
      "a signature over other bytes",
      {
        "feed/releases.json.sig": found(signAiFeed(new Uint8Array([1])), '"s"'),
      },
    ],
    [
      "a signature naming an untrusted key",
      {
        "feed/releases.json.sig": found(
          signAiFeed(FEED_BYTES, { public_key: "12".repeat(32) }),
          '"s"'
        ),
      },
    ],
  ])(
    "serves nothing and offers no file for a feed with %s",
    async (_name, sig) => {
      storeHas({ "feed/releases.json": found(FEED_BYTES, '"e"'), ...sig });
      expect((await feedRoute(new Request("https://6529.io/x"))).status).toBe(
        503
      );
      expect((await download(DMG)).status).toBe(503);
      expect(mockPresign).not.toHaveBeenCalled();
    }
  );

  it("refuses a signed feed in another format", async () => {
    storeHasSigned(
      feedBytes({ ...AI_TEST_FEED, format: "6529-ai-releases/2" })
    );
    expect((await feedRoute(new Request("https://6529.io/x"))).status).toBe(
      503
    );
  });

  it("keeps the newer feed when an older signed one replaces it", async () => {
    const newer = feedBytes({ ...AI_TEST_FEED, sequence: 5 });
    storeHasSigned(newer);
    const nowSpy = jest.spyOn(Date, "now");
    nowSpy.mockReturnValue(1_000_000);
    const first = await feedRoute(new Request("https://6529.io/x"));
    expect(new Uint8Array(await first.arrayBuffer())).toEqual(newer);

    storeHasSigned(feedBytes({ ...AI_TEST_FEED, sequence: 4 }));
    nowSpy.mockReturnValue(1_000_000 + 2 * 60 * 1000);
    const second = await feedRoute(new Request("https://6529.io/x"));
    expect(new Uint8Array(await second.arrayBuffer())).toEqual(newer);
    nowSpy.mockRestore();
  });

  it("keeps a verified feed for an hour when it then reads as missing", async () => {
    // The role can't list the bucket, so a read it is refused looks like a
    // key that isn't there.
    storeHasSigned();
    const nowSpy = jest.spyOn(Date, "now");
    nowSpy.mockReturnValue(1_000_000);
    expect((await feedRoute(new Request("https://6529.io/x"))).status).toBe(
      200
    );
    storeHas({});
    nowSpy.mockReturnValue(1_000_000 + 2 * 60 * 1000);
    expect((await feedRoute(new Request("https://6529.io/x"))).status).toBe(
      200
    );
    expect((await download(DMG)).status).toBe(302);
    nowSpy.mockReturnValue(1_000_000 + 61 * 60 * 1000);
    expect((await feedRoute(new Request("https://6529.io/x"))).status).toBe(
      404
    );
    expect((await download(DMG)).status).toBe(404);
    nowSpy.mockRestore();
  });

  it("keeps serving the last good feed when S3 fails later", async () => {
    storeHasSigned();
    const nowSpy = jest.spyOn(Date, "now");
    nowSpy.mockReturnValue(1_000_000);
    expect((await feedRoute(new Request("https://6529.io/x"))).status).toBe(
      200
    );
    mockRead.mockResolvedValue({ state: "error", reason: "timeout" });
    nowSpy.mockReturnValue(1_000_000 + 2 * 60 * 1000);
    expect((await feedRoute(new Request("https://6529.io/x"))).status).toBe(
      200
    );
    nowSpy.mockRestore();
  });
});

describe("6529 AI downloads", () => {
  beforeEach(() => {
    resetAiReleaseFeedCacheForTests();
    mockRead.mockReset();
    mockPresign.mockClear();
  });

  it("redirects a listed file of the newest release to a five-minute presigned URL", async () => {
    storeHasSigned();
    for (const path of [[DMG], ["0.1.0", DMG]]) {
      const response = await download(...path);
      expect(response.status).toBe(302);
      expect(response.headers.get("location")).toContain(
        `https://bucket.example/releases/0.1.0/${DMG}`
      );
      expect(response.headers.get("cache-control")).toBe("no-store");
      expect(response.headers.get("referrer-policy")).toBe("no-referrer");
    }
    expect(mockPresign).toHaveBeenLastCalledWith(
      `releases/0.1.0/${DMG}`,
      expect.objectContaining({
        expiresInSeconds: 300,
        responseParams: {
          "response-content-disposition": `attachment; filename="${DMG}"`,
        },
      })
    );
    expect((await download("SHA256SUMS")).status).toBe(302);
    expect(mockPresign).toHaveBeenLastCalledWith(
      "releases/0.1.0/SHA256SUMS",
      expect.objectContaining({
        responseParams: {
          "response-content-type": "text/plain; charset=utf-8",
          "response-content-disposition": "inline",
        },
      })
    );
    expect((await download("SHA256SUMS.sig")).status).toBe(302);
    expect(mockPresign).toHaveBeenLastCalledWith(
      "releases/0.1.0/SHA256SUMS.sig",
      expect.objectContaining({
        responseParams: {
          "response-content-disposition":
            'attachment; filename="SHA256SUMS.sig"',
        },
      })
    );
  });

  it("refuses every file the newest release doesn't list", async () => {
    storeHasSigned();
    for (const path of [
      ["unknown.bin"],
      ["feed", "releases.json"],
      ["releases.json"],
      // The older candidate stays in the feed, but its files are not
      // handed out, even the ones with the newest release's names.
      ["0.1.0-rc.1", "6529-ai-0.1.0-rc.1-macos-arm64.dmg"],
      ["0.1.0-rc.1", "SHA256SUMS"],
      ["6529-ai-0.1.0-rc.1-macos-arm64.dmg"],
      ["0.2.0", DMG],
      ["..", "..", "feed", "releases.json"],
      ["..", DMG],
      ["0.1.0", "..", DMG],
      ["%2e%2e", DMG],
      ["0.1.0", DMG, "extra"],
      ["%E0%A4%A"],
      [],
    ]) {
      const response = await download(...path);
      expect(response.status).toBe(404);
      expect(response.headers.get("location")).toBeNull();
      expect(await response.text()).toBe(
        "The newest release has no file by that name.\n"
      );
    }
    expect(mockPresign).not.toHaveBeenCalled();
  });

  it("hands out nothing before the first feed", async () => {
    storeHas({});
    expect((await download(DMG)).status).toBe(404);
    expect(await resolveAiReleaseDownload(["0.1.0", DMG])).toEqual({
      state: "not-found",
    });
    expect(mockPresign).not.toHaveBeenCalled();
  });

  it("answers 503 when the release list can't be read", async () => {
    mockRead.mockResolvedValue({ state: "error", reason: "S3 answered 500" });
    const response = await download(DMG);
    expect(response.status).toBe(503);
    expect(mockPresign).not.toHaveBeenCalled();
  });

  it("offers the newest by version, whatever the feed's order", async () => {
    storeHasSigned(
      feedBytes({
        ...AI_TEST_FEED,
        releases: [aiFeedEntry("0.1.0"), aiFeedEntry("0.1.1-rc.1")],
      })
    );
    expect((await download("6529-ai-0.1.1-rc.1-macos-arm64.dmg")).status).toBe(
      302
    );
    expect((await download(DMG)).status).toBe(404);
  });
});
