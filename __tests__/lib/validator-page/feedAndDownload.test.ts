/** @jest-environment node */
import type { BucketObject } from "@/lib/validator-page/releasesBucket";
import { TEST_FEED } from "./fixtures";

const mockRead = jest.fn<Promise<BucketObject>, [string]>();
const mockPresign = jest.fn(
  async (key: string, options: { responseParams?: Record<string, string> }) =>
    `https://bucket.example/${key}?${new URLSearchParams(options.responseParams).toString()}`
);

jest.mock("@/lib/validator-page/releasesBucket", () => ({
  FEED_OBJECT_KEY: "feed/releases.json",
  FEED_SIGNATURE_OBJECT_KEY: "feed/releases.json.sig",
  getReleaseObjectKey: (version: string, name: string) =>
    `releases/${version}/${name}`,
  readReleaseObject: (key: string) => mockRead(key),
  presignReleaseObject: (
    key: string,
    options: { responseParams?: Record<string, string> }
  ) => mockPresign(key, options),
}));

import { serveFeedObject } from "@/lib/validator-page/feedResponse";
import { resolveReleaseDownload } from "@/lib/validator-page/releaseDownload";
import { resetReleaseFeedCacheForTests } from "@/lib/validator-page/releaseFeed";

const FEED_BYTES = new TextEncoder().encode(JSON.stringify(TEST_FEED));
const SIG_BYTES = new Uint8Array([0x30, 0x45, 0x02, 0x21]);

function found(body: Uint8Array<ArrayBuffer>, etag: string): BucketObject {
  return {
    state: "found",
    body,
    etag,
    lastModified: "Mon, 02 Nov 2026 09:00:00 GMT",
  };
}

function storeHas(objects: Record<string, BucketObject>) {
  mockRead.mockImplementation(
    async (key) => objects[key] ?? { state: "missing" }
  );
}

describe("release feed endpoints and downloads", () => {
  beforeEach(() => {
    resetReleaseFeedCacheForTests();
    mockRead.mockReset();
    mockPresign.mockClear();
  });

  it("serves the feed and signature byte for byte, public, for five minutes", async () => {
    storeHas({
      "feed/releases.json": found(FEED_BYTES, '"feed-etag"'),
      "feed/releases.json.sig": found(SIG_BYTES, '"sig-etag"'),
    });
    const feed = await serveFeedObject(
      new Request("https://6529.io/x"),
      "feed"
    );
    expect(feed.status).toBe(200);
    expect(feed.headers.get("content-type")).toBe(
      "application/json; charset=utf-8"
    );
    expect(feed.headers.get("cache-control")).toBe("public, max-age=300");
    expect(feed.headers.get("etag")).toBe('"feed-etag"');
    expect(new Uint8Array(await feed.arrayBuffer())).toEqual(FEED_BYTES);

    const sig = await serveFeedObject(
      new Request("https://6529.io/x"),
      "signature"
    );
    expect(sig.headers.get("content-type")).toBe("application/octet-stream");
    expect(new Uint8Array(await sig.arrayBuffer())).toEqual(SIG_BYTES);

    const cached = await serveFeedObject(
      new Request("https://6529.io/x", {
        headers: { "if-none-match": '"feed-etag"' },
      }),
      "feed"
    );
    expect(cached.status).toBe(304);
    // Both answers came from one read of the bucket.
    expect(mockRead).toHaveBeenCalledTimes(2);
  });

  it("answers 404 before the first feed and 503 when S3 fails", async () => {
    storeHas({});
    const missing = await serveFeedObject(
      new Request("https://6529.io/x"),
      "feed"
    );
    expect(missing.status).toBe(404);

    resetReleaseFeedCacheForTests();
    mockRead.mockResolvedValue({ state: "error", reason: "S3 answered 500" });
    const failed = await serveFeedObject(
      new Request("https://6529.io/x"),
      "feed"
    );
    expect(failed.status).toBe(503);
    expect(failed.headers.get("cache-control")).toBe("no-store");
  });

  it("keeps serving the last good feed when S3 fails later", async () => {
    storeHas({ "feed/releases.json": found(FEED_BYTES, '"e"') });
    const nowSpy = jest.spyOn(Date, "now");
    nowSpy.mockReturnValue(1_000_000);
    expect(
      (await serveFeedObject(new Request("https://6529.io/x"), "feed")).status
    ).toBe(200);
    mockRead.mockResolvedValue({ state: "error", reason: "timeout" });
    nowSpy.mockReturnValue(1_000_000 + 2 * 60 * 1000);
    expect(
      (await serveFeedObject(new Request("https://6529.io/x"), "feed")).status
    ).toBe(200);
    nowSpy.mockRestore();
  });

  it("presigns only files the feed lists", async () => {
    storeHas({ "feed/releases.json": found(FEED_BYTES, '"e"') });
    const latest = await resolveReleaseDownload(["6529-Validator-0.1.0.dmg"]);
    expect(latest).toEqual({
      state: "found",
      url: expect.stringContaining(
        "releases/0.1.0-test.2/6529-Validator-0.1.0.dmg"
      ),
    });
    const pinned = await resolveReleaseDownload([
      "0.1.0-test.1",
      "6529-Validator-0.1.0.dmg",
    ]);
    expect(pinned).toEqual({
      state: "found",
      url: expect.stringContaining("releases/0.1.0-test.1/"),
    });
    expect(mockPresign).toHaveBeenLastCalledWith(
      "releases/0.1.0-test.1/6529-Validator-0.1.0.dmg",
      expect.objectContaining({
        expiresInSeconds: 300,
        responseParams: {
          "response-content-disposition":
            'attachment; filename="6529-Validator-0.1.0.dmg"',
        },
      })
    );
    const sums = await resolveReleaseDownload(["0.1.0-test.2", "SHA256SUMS"]);
    expect(sums.state).toBe("found");
    expect(mockPresign).toHaveBeenLastCalledWith(
      "releases/0.1.0-test.2/SHA256SUMS",
      expect.objectContaining({
        responseParams: expect.objectContaining({
          "response-content-disposition": "inline",
        }),
      })
    );

    mockPresign.mockClear();
    for (const path of [
      ["feed", "releases.json"],
      ["0.1.0-test.1", "SHA256SUMS"],
      ["..", "..", "secret"],
      ["unknown.bin"],
      [],
    ]) {
      expect(await resolveReleaseDownload(path)).toEqual({
        state: "not-found",
      });
    }
    expect(mockPresign).not.toHaveBeenCalled();
  });
});
