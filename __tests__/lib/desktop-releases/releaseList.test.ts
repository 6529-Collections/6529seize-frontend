/** @jest-environment node */
import type {
  BucketLocation,
  BucketObject,
} from "@/lib/validator-page/releasesBucket";

const mockRead = jest.fn<Promise<BucketObject>, [BucketLocation, string]>();

jest.mock("@/lib/validator-page/releasesBucket", () => ({
  FEED_OBJECT_KEY: "feed/releases.json",
  FEED_SIGNATURE_OBJECT_KEY: "feed/releases.json.sig",
  readBucketObject: (location: BucketLocation, key: string) =>
    mockRead(location, key),
}));

import { GET as getList } from "@/app/desktop/releases.json/route";
import { GET as getSignature } from "@/app/desktop/releases.json.sig/route";
import { resetDesktopReleaseListCacheForTests } from "@/lib/desktop-releases/releaseList";

const LIST_URL = "https://6529.io/desktop/releases.json";
const SIGNATURE_URL = "https://6529.io/desktop/releases.json.sig";
// Opaque bytes: the site serves them as stored and never parses them.
const LIST_BYTES = new TextEncoder().encode('{"sequence":1,"releases":[]}\n');
const SIGNATURE_BYTES = new Uint8Array([0x30, 0x45, 0x02, 0x21, 0x00, 0x01]);
const ENV_NAMES = ["DESKTOP_RELEASES_BUCKET", "DESKTOP_RELEASES_REGION"];

function found(body: Uint8Array<ArrayBuffer>, etag: string): BucketObject {
  return {
    state: "found",
    body,
    etag,
    lastModified: "Sat, 14 Nov 2026 09:00:00 GMT",
  };
}

function storeHas(objects: Record<string, BucketObject>) {
  mockRead.mockImplementation(
    async (_location, key) => objects[key] ?? { state: "missing" }
  );
}

function storeHasSignedList() {
  storeHas({
    "feed/releases.json": found(LIST_BYTES, '"list-etag"'),
    "feed/releases.json.sig": found(SIGNATURE_BYTES, '"sig-etag"'),
  });
}

async function fetchBoth(): Promise<[Response, Response]> {
  return [
    await getList(new Request(LIST_URL)),
    await getSignature(new Request(SIGNATURE_URL)),
  ];
}

describe("6529 Desktop release list routes", () => {
  const savedEnv = Object.fromEntries(
    ENV_NAMES.map((name) => [name, process.env[name]])
  );

  beforeEach(() => {
    resetDesktopReleaseListCacheForTests();
    mockRead.mockReset();
    process.env["DESKTOP_RELEASES_BUCKET"] = "desktop-releases.example";
    delete process.env["DESKTOP_RELEASES_REGION"];
    jest.spyOn(console, "warn").mockImplementation(() => undefined);
  });

  afterEach(() => {
    jest.restoreAllMocks();
    for (const name of ENV_NAMES) {
      if (savedEnv[name] === undefined) {
        delete process.env[name];
      } else {
        process.env[name] = savedEnv[name];
      }
    }
  });

  it("answers 404 without reading anything while no bucket is set", async () => {
    delete process.env["DESKTOP_RELEASES_BUCKET"];

    for (const response of await fetchBoth()) {
      expect(response.status).toBe(404);
      expect(response.headers.get("content-type")).toBe(
        "text/plain; charset=utf-8"
      );
      expect(response.headers.get("cache-control")).toBe("public, max-age=60");
      expect(await response.text()).toBe("No release list yet.\n");
    }
    expect(mockRead).not.toHaveBeenCalled();
  });

  it("serves the list and signature byte for byte, public, for five minutes", async () => {
    storeHasSignedList();

    const [list, signature] = await fetchBoth();

    expect(list.status).toBe(200);
    expect(list.headers.get("content-type")).toBe(
      "application/json; charset=utf-8"
    );
    expect(list.headers.get("cache-control")).toBe("public, max-age=300");
    expect(list.headers.get("access-control-allow-origin")).toBe("*");
    expect(list.headers.get("x-content-type-options")).toBe("nosniff");
    expect(list.headers.get("etag")).toBe('"list-etag"');
    expect(new Uint8Array(await list.arrayBuffer())).toEqual(LIST_BYTES);

    expect(signature.status).toBe(200);
    expect(signature.headers.get("content-type")).toBe(
      "application/octet-stream"
    );
    expect(signature.headers.get("etag")).toBe('"sig-etag"');
    expect(new Uint8Array(await signature.arrayBuffer())).toEqual(
      SIGNATURE_BYTES
    );

    // One read of each object served both answers, from the default region.
    expect(mockRead.mock.calls).toEqual([
      [
        { bucket: "desktop-releases.example", region: "us-east-1" },
        "feed/releases.json",
      ],
      [
        { bucket: "desktop-releases.example", region: "us-east-1" },
        "feed/releases.json.sig",
      ],
    ]);
  });

  it("answers 304 when the ETag matches", async () => {
    storeHasSignedList();

    const response = await getList(
      new Request(LIST_URL, { headers: { "if-none-match": '"list-etag"' } })
    );

    expect(response.status).toBe(304);
    expect(response.body).toBeNull();
  });

  it("reads the bucket's region when one is set", async () => {
    process.env["DESKTOP_RELEASES_REGION"] = "eu-west-1";
    storeHasSignedList();

    await getList(new Request(LIST_URL));

    expect(mockRead).toHaveBeenCalledWith(
      { bucket: "desktop-releases.example", region: "eu-west-1" },
      "feed/releases.json"
    );
  });

  it("answers 404 for both before the first list, even with a stray signature", async () => {
    storeHas({
      "feed/releases.json.sig": found(SIGNATURE_BYTES, '"sig-etag"'),
    });

    for (const response of await fetchBoth()) {
      expect(response.status).toBe(404);
    }
  });

  it("never serves a list without its signature", async () => {
    storeHas({ "feed/releases.json": found(LIST_BYTES, '"list-etag"') });

    for (const response of await fetchBoth()) {
      expect(response.status).toBe(503);
      expect(response.headers.get("cache-control")).toBe("no-store");
      expect(await response.text()).toBe("The release list is unavailable.\n");
    }
  });

  it("answers 503 when the bucket fails before any list was served", async () => {
    mockRead.mockResolvedValue({ state: "error", reason: "S3 answered 500" });

    const response = await getList(new Request(LIST_URL));

    expect(response.status).toBe(503);
    expect(response.headers.get("retry-after")).toBe("60");
  });

  it("keeps serving the last good pair when the bucket fails later", async () => {
    const now = jest.spyOn(Date, "now").mockReturnValue(1_000_000);
    storeHasSignedList();
    expect((await getList(new Request(LIST_URL))).status).toBe(200);

    now.mockReturnValue(1_000_000 + 61_000);
    mockRead.mockResolvedValue({ state: "error", reason: "S3 answered 500" });
    const stale = await getList(new Request(LIST_URL));

    expect(stale.status).toBe(200);
    expect(new Uint8Array(await stale.arrayBuffer())).toEqual(LIST_BYTES);
    expect(mockRead).toHaveBeenCalledTimes(4);
  });
});
