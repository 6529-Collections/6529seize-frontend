/** @jest-environment node */
import type {
  BucketLocation,
  BucketObject,
} from "@/lib/validator-page/releasesBucket";

const mockRead = jest.fn<Promise<BucketObject>, [BucketLocation, string]>();

jest.mock("@/lib/validator-page/releasesBucket", () => ({
  readBucketObject: (location: BucketLocation, key: string) =>
    mockRead(location, key),
}));

import { GET as getList } from "@/app/desktop/releases.json/route";
import { GET as getSignature } from "@/app/desktop/releases.json.sig/route";
import {
  DESKTOP_BUNDLE_OBJECT_KEY,
  resetDesktopReleaseListCacheForTests,
} from "@/lib/desktop-releases/releaseList";
import { RELEASE_LIST_PAIR_HEADER } from "@/lib/validator-page/feedResponse";

const LIST_URL = "https://6529.io/desktop/releases.json";
const SIGNATURE_URL = "https://6529.io/desktop/releases.json.sig";
// Opaque bytes: the site serves them as stored and never parses the list.
const LIST_BYTES = new TextEncoder().encode('{"sequence":1,"releases":[]}\n');
const SIGNATURE_BYTES = new Uint8Array([0x30, 0x45, 0x02, 0x21, 0x00, 0x01]);
const ENV_NAMES = ["DESKTOP_RELEASES_BUCKET", "DESKTOP_RELEASES_REGION"];
const PAIR_ID = /^[0-9a-f]{32}$/;

const b64 = (bytes: Uint8Array) => Buffer.from(bytes).toString("base64");

function bundleBytes(fields: Record<string, unknown>): Uint8Array<ArrayBuffer> {
  return new TextEncoder().encode(JSON.stringify(fields));
}

function validBundle(
  signature: Uint8Array = SIGNATURE_BYTES
): Record<string, unknown> {
  return { version: 1, list: b64(LIST_BYTES), signature: b64(signature) };
}

function storeHasBundle(body: Uint8Array<ArrayBuffer> | null) {
  mockRead.mockImplementation(async (_location, key) =>
    body && key === DESKTOP_BUNDLE_OBJECT_KEY
      ? {
          state: "found",
          body,
          etag: '"bundle-etag"',
          lastModified: "Sat, 14 Nov 2026 09:00:00 GMT",
        }
      : { state: "missing" }
  );
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

  it("reads the production bucket built into the code when no setting overrides it", async () => {
    delete process.env["DESKTOP_RELEASES_BUCKET"];
    storeHasBundle(null);

    for (const response of await fetchBoth()) {
      expect(response.status).toBe(404);
      expect(response.headers.get("content-type")).toBe(
        "text/plain; charset=utf-8"
      );
      expect(response.headers.get("cache-control")).toBe("public, max-age=60");
      expect(await response.text()).toBe("No release list yet.\n");
    }
    expect(mockRead).toHaveBeenCalledTimes(1);
    expect(mockRead).toHaveBeenCalledWith(
      { bucket: "6529-desktop-releases-06c6aa2e", region: "us-east-1" },
      "feed/releases.bundle.json"
    );
  });

  it("answers 404 for both before the first bundle", async () => {
    storeHasBundle(null);

    for (const response of await fetchBoth()) {
      expect(response.status).toBe(404);
    }
  });

  it("serves both parts of one bundle byte for byte, public, for five minutes", async () => {
    storeHasBundle(bundleBytes(validBundle()));

    const [list, signature] = await fetchBoth();

    expect(list.status).toBe(200);
    expect(list.headers.get("content-type")).toBe(
      "application/json; charset=utf-8"
    );
    expect(list.headers.get("cache-control")).toBe("public, max-age=300");
    expect(list.headers.get("access-control-allow-origin")).toBe("*");
    expect(list.headers.get("x-content-type-options")).toBe("nosniff");
    expect(list.headers.get("last-modified")).toBe(
      "Sat, 14 Nov 2026 09:00:00 GMT"
    );
    expect(new Uint8Array(await list.arrayBuffer())).toEqual(LIST_BYTES);

    expect(signature.status).toBe(200);
    expect(signature.headers.get("content-type")).toBe(
      "application/octet-stream"
    );
    expect(new Uint8Array(await signature.arrayBuffer())).toEqual(
      SIGNATURE_BYTES
    );

    // One read of one object served both answers, from the default region.
    expect(mockRead.mock.calls).toEqual([
      [
        { bucket: "desktop-releases.example", region: "us-east-1" },
        "feed/releases.bundle.json",
      ],
    ]);
  });

  it("names the pair on both answers and in their ETags", async () => {
    storeHasBundle(bundleBytes(validBundle()));
    const [list, signature] = await fetchBoth();
    const pair = list.headers.get(RELEASE_LIST_PAIR_HEADER) ?? "";

    expect(pair).toMatch(PAIR_ID);
    expect(signature.headers.get(RELEASE_LIST_PAIR_HEADER)).toBe(pair);
    expect(list.headers.get("etag")).toBe(`"${pair}-list"`);
    expect(signature.headers.get("etag")).toBe(`"${pair}-sig"`);
    expect(list.headers.get("access-control-expose-headers")).toBe(
      RELEASE_LIST_PAIR_HEADER
    );

    // A new signature over the same list is a new pair.
    resetDesktopReleaseListCacheForTests();
    storeHasBundle(bundleBytes(validBundle(new Uint8Array([0x30, 0x46]))));
    const resigned = await getList(new Request(LIST_URL));
    expect(resigned.headers.get(RELEASE_LIST_PAIR_HEADER)).not.toBe(pair);
  });

  it("answers 304 with the pair name when the ETag matches", async () => {
    storeHasBundle(bundleBytes(validBundle()));
    const first = await getList(new Request(LIST_URL));

    const response = await getList(
      new Request(LIST_URL, {
        headers: { "if-none-match": first.headers.get("etag") ?? "" },
      })
    );

    expect(response.status).toBe(304);
    expect(response.body).toBeNull();
    expect(response.headers.get(RELEASE_LIST_PAIR_HEADER)).toMatch(PAIR_ID);
  });

  it("reads the bucket's region when one is set", async () => {
    process.env["DESKTOP_RELEASES_REGION"] = "eu-west-1";
    storeHasBundle(bundleBytes(validBundle()));

    await getList(new Request(LIST_URL));

    expect(mockRead).toHaveBeenCalledWith(
      { bucket: "desktop-releases.example", region: "eu-west-1" },
      "feed/releases.bundle.json"
    );
  });

  it("reads afresh when the bucket changes", async () => {
    storeHasBundle(bundleBytes(validBundle()));
    await getList(new Request(LIST_URL));
    process.env["DESKTOP_RELEASES_BUCKET"] = "other-releases.example";

    await getList(new Request(LIST_URL));

    expect(mockRead).toHaveBeenLastCalledWith(
      { bucket: "other-releases.example", region: "us-east-1" },
      "feed/releases.bundle.json"
    );
  });

  describe("when reads overlap", () => {
    const BUCKET_A = "desktop-releases.example";
    const BUCKET_B = "other-releases.example";
    const SIGNATURE_B = new Uint8Array([0x30, 0x46, 0x07]);
    // Each S3 read waits until the test settles it, in any order.
    let reads: { bucket: string; settle: (object: BucketObject) => void }[];

    const foundWith = (signature: Uint8Array): BucketObject => ({
      state: "found",
      body: bundleBytes(validBundle(signature)),
      etag: null,
      lastModified: null,
    });
    const setBucket = (bucket: string | null) => {
      if (bucket === null) {
        delete process.env["DESKTOP_RELEASES_BUCKET"];
      } else {
        process.env["DESKTOP_RELEASES_BUCKET"] = bucket;
      }
    };
    // Lets pending promise callbacks run before the next step.
    const flush = () => new Promise((resolve) => setImmediate(resolve));

    beforeEach(() => {
      reads = [];
      mockRead.mockImplementation(
        (location) =>
          new Promise((resolve) => {
            reads.push({ bucket: location.bucket, settle: resolve });
          })
      );
    });

    it("lets concurrent requests for one setting share one read", async () => {
      const first = getList(new Request(LIST_URL));
      const second = getSignature(new Request(SIGNATURE_URL));
      await flush();
      reads[0]?.settle(foundWith(SIGNATURE_BYTES));

      expect((await first).status).toBe(200);
      expect((await second).status).toBe(200);
      expect(reads).toHaveLength(1);
    });

    it("reads a new bucket itself and never caches the old bucket's read", async () => {
      const first = getSignature(new Request(SIGNATURE_URL));
      setBucket(BUCKET_B);
      const second = getSignature(new Request(SIGNATURE_URL));
      await flush();
      reads[1]?.settle(foundWith(SIGNATURE_B));
      const secondBytes = new Uint8Array(await (await second).arrayBuffer());
      reads[0]?.settle(foundWith(SIGNATURE_BYTES));
      await first;
      const third = await getSignature(new Request(SIGNATURE_URL));

      expect(secondBytes).toEqual(SIGNATURE_B);
      expect(new Uint8Array(await third.arrayBuffer())).toEqual(SIGNATURE_B);
      expect(reads.map(({ bucket }) => bucket)).toEqual([BUCKET_A, BUCKET_B]);
    });

    it.each([
      ["the first A read finishes last", [2, 1, 0]],
      ["the first A read finishes first", [0, 1, 2]],
    ])(
      "keeps the newest A read's answer after A, B, A when %s",
      async (_name, order) => {
        // The first A read finds a list; by the second A read it was deleted.
        const answers: BucketObject[] = [
          foundWith(SIGNATURE_BYTES),
          foundWith(SIGNATURE_B),
          { state: "missing" },
        ];
        const requests = [getList(new Request(LIST_URL))];
        setBucket(BUCKET_B);
        requests.push(getList(new Request(LIST_URL)));
        setBucket(BUCKET_A);
        requests.push(getList(new Request(LIST_URL)));
        await flush();
        expect(reads.map(({ bucket }) => bucket)).toEqual([
          BUCKET_A,
          BUCKET_B,
          BUCKET_A,
        ]);
        for (const index of order) {
          reads[index]?.settle(answers[index] as BucketObject);
          await flush();
        }
        await Promise.all(requests);

        const after = await getList(new Request(LIST_URL));

        expect(after.status).toBe(404);
        expect(reads).toHaveLength(3);
      }
    );

    it("keeps the built-in bucket's answer after unset, A, unset, whenever A's read ends", async () => {
      const BUILT_IN = "6529-desktop-releases-06c6aa2e";
      setBucket(null);
      const first = getList(new Request(LIST_URL));
      await flush();
      reads[0]?.settle({ state: "missing" });
      expect((await first).status).toBe(404);
      setBucket(BUCKET_A);
      const inFlight = getList(new Request(LIST_URL));
      setBucket(null);
      const second = getList(new Request(LIST_URL));
      await flush();
      reads[2]?.settle({ state: "missing" });
      expect((await second).status).toBe(404);
      reads[1]?.settle(foundWith(SIGNATURE_BYTES));
      expect((await inFlight).status).toBe(200);

      expect((await getList(new Request(LIST_URL))).status).toBe(404);
      expect(reads.map(({ bucket }) => bucket)).toEqual([
        BUILT_IN,
        BUCKET_A,
        BUILT_IN,
      ]);
    });
  });

  const sig = b64(SIGNATURE_BYTES);
  const list = b64(LIST_BYTES);
  it.each<[string, Uint8Array<ArrayBuffer>]>([
    ["not JSON", new TextEncoder().encode("{")],
    ["not UTF-8", new Uint8Array([0xff, 0xfe])],
    ["an array", bundleBytes([] as unknown as Record<string, unknown>)],
    ["no signature", bundleBytes({ version: 1, list })],
    ["an empty signature", bundleBytes({ version: 1, list, signature: "" })],
    ["no list", bundleBytes({ version: 1, signature: sig })],
    ["an extra field", bundleBytes({ ...validBundle(), extra: 1 })],
    ["another version", bundleBytes({ ...validBundle(), version: 2 })],
    ["URL-safe base64", bundleBytes({ ...validBundle(), list: "-_8=" })],
    ["unpadded base64", bundleBytes({ ...validBundle(), list: "AAE" })],
    ["base64 with spaces", bundleBytes({ ...validBundle(), list: "AA E=" })],
    ["non-canonical base64", bundleBytes({ ...validBundle(), list: "AAF=" })],
    [
      "a list over 56 KiB",
      bundleBytes({ ...validBundle(), list: b64(new Uint8Array(57_345)) }),
    ],
    [
      "a signature over 1 KiB",
      bundleBytes({ ...validBundle(), signature: b64(new Uint8Array(1025)) }),
    ],
  ])("serves neither part of a bundle with %s", async (_name, body) => {
    storeHasBundle(body);

    for (const response of await fetchBoth()) {
      expect(response.status).toBe(503);
      expect(response.headers.get("cache-control")).toBe("no-store");
      expect(await response.text()).toBe("The release list is unavailable.\n");
    }
  });

  it("accepts parts at the size limits", async () => {
    storeHasBundle(
      bundleBytes({
        version: 1,
        list: b64(new Uint8Array(57_344)),
        signature: b64(new Uint8Array(1024)),
      })
    );

    const [listResponse, signature] = await fetchBoth();

    expect(listResponse.status).toBe(200);
    expect((await listResponse.arrayBuffer()).byteLength).toBe(57_344);
    expect((await signature.arrayBuffer()).byteLength).toBe(1024);
  });

  it("answers 503 when the bucket fails before any list was served", async () => {
    mockRead.mockResolvedValue({ state: "error", reason: "S3 answered 500" });

    const response = await getList(new Request(LIST_URL));

    expect(response.status).toBe(503);
    expect(response.headers.get("retry-after")).toBe("60");
  });

  it.each<[string, () => void]>([
    [
      "the bucket fails",
      () =>
        mockRead.mockResolvedValue({
          state: "error",
          reason: "S3 answered 500",
        }),
    ],
    [
      "the bundle turns malformed",
      () => storeHasBundle(bundleBytes({ version: 1, list })),
    ],
  ])(
    "answers 503, not 404, when %s after no bundle",
    async (_name, breakIt) => {
      const now = jest.spyOn(Date, "now").mockReturnValue(1_000_000);
      storeHasBundle(null);
      expect((await getList(new Request(LIST_URL))).status).toBe(404);

      now.mockReturnValue(1_000_000 + 61_000);
      breakIt();

      expect((await getList(new Request(LIST_URL))).status).toBe(503);
    }
  );

  it("withdraws the list when the bundle is deleted, keeping nothing to fall back on", async () => {
    const now = jest.spyOn(Date, "now").mockReturnValue(1_000_000);
    storeHasBundle(bundleBytes(validBundle()));
    expect((await getList(new Request(LIST_URL))).status).toBe(200);

    now.mockReturnValue(1_000_000 + 61_000);
    storeHasBundle(null);
    expect((await getList(new Request(LIST_URL))).status).toBe(404);

    now.mockReturnValue(1_000_000 + 122_000);
    mockRead.mockResolvedValue({ state: "error", reason: "S3 answered 500" });
    expect((await getList(new Request(LIST_URL))).status).toBe(503);
  });

  it.each<[string, () => void]>([
    [
      "the bucket fails",
      () =>
        mockRead.mockResolvedValue({
          state: "error",
          reason: "S3 answered 500",
        }),
    ],
    [
      "the bundle turns malformed",
      () => storeHasBundle(bundleBytes({ version: 1, list })),
    ],
  ])("keeps serving the last good pair when %s", async (_name, breakIt) => {
    const now = jest.spyOn(Date, "now").mockReturnValue(1_000_000);
    storeHasBundle(bundleBytes(validBundle()));
    expect((await getList(new Request(LIST_URL))).status).toBe(200);

    now.mockReturnValue(1_000_000 + 61_000);
    breakIt();
    const [staleList, staleSignature] = await fetchBoth();

    expect(staleList.status).toBe(200);
    expect(new Uint8Array(await staleList.arrayBuffer())).toEqual(LIST_BYTES);
    expect(new Uint8Array(await staleSignature.arrayBuffer())).toEqual(
      SIGNATURE_BYTES
    );
    expect(mockRead).toHaveBeenCalledTimes(2);
  });
});
