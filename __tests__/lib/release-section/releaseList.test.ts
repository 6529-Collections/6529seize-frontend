/** @jest-environment node */
import {
  createReleaseListReader,
  type ReleaseListConfig,
  type ReleaseListReader,
} from "@/lib/release-section/releaseList";
import { RELEASE_LIST_PAIR_HEADER } from "@/lib/validator-page/feedResponse";
import type {
  BucketLocation,
  BucketObject,
} from "@/lib/validator-page/releasesBucket";

import {
  AI_DOMAIN,
  aiList,
  aiListEntry,
  bundleBytes,
  DESKTOP_DOMAIN,
  listBytes,
  signedBundle,
  signFeed,
  TEST_FEED_SIGNING_KEY,
  VALIDATOR_DOMAIN,
} from "./listSigning";

const mockRead = jest.fn<Promise<BucketObject>, [BucketLocation, string]>();
const LOCATION = { bucket: "releases.example", region: "us-east-1" };
const BUNDLE_KEY = "feed/releases.bundle.json";
const UNAVAILABLE = "The release list is unavailable.\n";
const PAIR_ID = /^[0-9a-f]{32}$/;
const HOUR = 60 * 60 * 1000;

function config(
  domain: string,
  fields: Partial<ReleaseListConfig> = {}
): ReleaseListConfig {
  return {
    logName: "test",
    domain,
    signers: [TEST_FEED_SIGNING_KEY],
    bundleKey: BUNDLE_KEY,
    routes: {
      list: "/p/releases.json",
      signature: "/p/releases.json.sig",
      releases: "/p/releases",
    },
    location: () => LOCATION,
    read: (location, key) => mockRead(location, key),
    text: {
      unavailable: UNAVAILABLE,
      missing: "No release list yet.\n",
      signatureContentType: "application/json; charset=utf-8",
    },
    missingAfterServed: "withdrawn",
    ...fields,
  };
}

function storeHas(body: Uint8Array<ArrayBuffer> | null) {
  mockRead.mockImplementation(async (_location, key) =>
    body && key === BUNDLE_KEY
      ? {
          state: "found",
          body,
          etag: '"bundle"',
          lastModified: "Fri, 20 Nov 2026 10:00:00 GMT",
        }
      : { state: "missing" }
  );
}

async function fetchBoth(
  reader: ReleaseListReader
): Promise<[Response, Response]> {
  return [
    await reader.serve(new Request("https://6529.io/p/releases.json"), "feed"),
    await reader.serve(
      new Request("https://6529.io/p/releases.json.sig"),
      "signature"
    ),
  ];
}

const LIST = listBytes(aiList());

describe("a product's signed release list", () => {
  let now: jest.SpyInstance<number, []>;

  beforeEach(() => {
    mockRead.mockReset();
    now = jest.spyOn(Date, "now").mockReturnValue(1_000_000);
    jest.spyOn(console, "warn").mockImplementation(() => undefined);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it("serves both parts of a verified bundle byte for byte, named by one pair", async () => {
    const reader = createReleaseListReader(config(AI_DOMAIN));
    const bundle = signedBundle(LIST);
    storeHas(bundle);

    const [list, signature] = await fetchBoth(reader);
    const pair = list.headers.get(RELEASE_LIST_PAIR_HEADER) ?? "";

    expect(list.status).toBe(200);
    expect(new Uint8Array(await list.arrayBuffer())).toEqual(LIST);
    expect(signature.status).toBe(200);
    expect(new TextDecoder().decode(await signature.arrayBuffer())).toContain(
      TEST_FEED_SIGNING_KEY.address
    );
    expect(pair).toMatch(PAIR_ID);
    expect(signature.headers.get(RELEASE_LIST_PAIR_HEADER)).toBe(pair);
    expect(list.headers.get("etag")).toBe(`"${pair}-list"`);
    expect(signature.headers.get("etag")).toBe(`"${pair}-sig"`);
    expect(signature.headers.get("content-type")).toBe(
      "application/json; charset=utf-8"
    );
    expect(mockRead.mock.calls).toEqual([[LOCATION, BUNDLE_KEY]]);
  });

  it("reads the list's releases, newest first, once its signature verified", async () => {
    const reader = createReleaseListReader(config(AI_DOMAIN));
    storeHas(signedBundle(LIST));

    const snapshot = await reader.snapshot();

    expect(snapshot.list?.sequence).toBe(1_795_000_000);
    expect(snapshot.list?.releases.map((release) => release.version)).toEqual([
      "0.1.0-rc.3",
      "0.1.0-rc.2",
    ]);
    expect(reader.releaseHref("0.1.0-rc.3")).toBe("/p/releases#0.1.0-rc.3");
  });

  it("serves the list's bytes as received, never re-encoded", async () => {
    // Spaces, another key order and an escaped character: a re-encoded list
    // would differ, and its signature would no longer verify.
    const text = `{ "releases": [], "sequence": 7, "format": 1, "note": "caf\\u00e9" }\r\n`;
    const list = new TextEncoder().encode(text);
    const reader = createReleaseListReader(config(AI_DOMAIN));
    storeHas(signedBundle(list));

    const [served] = await fetchBoth(reader);

    expect(new Uint8Array(await served.arrayBuffer())).toEqual(list);
  });

  describe("checks", () => {
    it("the sizes before the signature, and the signature before the list is parsed", async () => {
      const verify = jest.spyOn(
        jest.requireActual<typeof import("@/lib/validator-page/feedSignature")>(
          "@/lib/validator-page/feedSignature"
        ),
        "isFeedSignatureValid"
      );
      const parse = jest.spyOn(JSON, "parse");
      const reader = createReleaseListReader(
        config(AI_DOMAIN, { maxListBytes: 100 })
      );
      // Signed, but over this product's limit: refused unverified.
      storeHas(signedBundle(LIST));
      expect((await reader.snapshot()).state).toBe("error");
      expect(verify).not.toHaveBeenCalled();

      // A list whose signature fails is never parsed.
      const other = createReleaseListReader(config(AI_DOMAIN));
      const changed = LIST.slice();
      changed[20] = changed[20]! ^ 1;
      storeHas(bundleBytes(changed, signFeed(LIST, undefined, AI_DOMAIN)));
      expect((await other.snapshot()).state).toBe("error");
      expect(verify).toHaveBeenCalledTimes(1);
      const listText = new TextDecoder().decode(changed);
      expect(parse.mock.calls.some(([text]) => text === listText)).toBe(false);

      // One that verifies is.
      const good = createReleaseListReader(config(AI_DOMAIN));
      storeHas(signedBundle(LIST));
      expect((await good.snapshot()).state).toBe("ok");
      expect(parse.mock.calls.some(([text]) => text === listText)).toBe(false);
      expect(
        parse.mock.calls.some(
          ([text]) => text === new TextDecoder().decode(LIST)
        )
      ).toBe(true);
    });
  });

  it.each<[string, () => Uint8Array<ArrayBuffer>]>([
    [
      "a list over 56 KiB",
      () =>
        bundleBytes(
          new Uint8Array(56 * 1024 + 1),
          signFeed(LIST, undefined, AI_DOMAIN)
        ),
    ],
    ["a signature over 1 KiB", () => bundleBytes(LIST, new Uint8Array(1025))],
    [
      "a list changed after it was signed",
      () => {
        const changed = LIST.slice();
        changed[30] = changed[30]! ^ 1;
        return bundleBytes(changed, signFeed(LIST, undefined, AI_DOMAIN));
      },
    ],
    [
      "another list's signature",
      () =>
        bundleBytes(
          LIST,
          signFeed(listBytes(aiList({ sequence: 1 })), undefined, AI_DOMAIN)
        ),
    ],
    [
      "a signature naming a key it doesn't trust",
      () => signedBundle(LIST, AI_DOMAIN, `0x${"12".repeat(20)}`),
    ],
    ["6529 Desktop's domain", () => signedBundle(LIST, DESKTOP_DOMAIN)],
    ["the validator's domain", () => signedBundle(LIST, VALIDATOR_DOMAIN)],
    [
      "a list in another format",
      () => signedBundle(listBytes(aiList({ format: 2 }))),
    ],
    [
      "a list with no sequence",
      () => signedBundle(listBytes(aiList({ sequence: undefined }))),
    ],
    [
      "a list with no releases",
      () => signedBundle(listBytes({ format: 1, sequence: 3 })),
    ],
    [
      "a list that isn't JSON",
      () => signedBundle(new TextEncoder().encode("not json\n")),
    ],
    [
      "an extra field in the bundle",
      () => {
        const fields = JSON.parse(
          new TextDecoder().decode(signedBundle(LIST))
        ) as Record<string, unknown>;
        return new TextEncoder().encode(JSON.stringify({ ...fields, x: 1 }));
      },
    ],
  ])(
    "serves neither part of a bundle with %s, under 6529 AI's domain",
    async (_name, body) => {
      const reader = createReleaseListReader(config(AI_DOMAIN));
      storeHas(body());

      for (const response of await fetchBoth(reader)) {
        expect(response.status).toBe(503);
        expect(await response.text()).toBe(UNAVAILABLE);
      }
      expect((await reader.snapshot()).list).toBeNull();
    }
  );

  it("accepts a list of exactly 56 KiB and a signature of exactly 1 KiB", async () => {
    const base = JSON.stringify(aiList({ padding: "" }));
    const list = new TextEncoder().encode(
      base.replace(
        '"padding":""',
        `"padding":"${"x".repeat(56 * 1024 - base.length)}"`
      )
    );
    expect(list.byteLength).toBe(56 * 1024);
    const signature = signFeed(list, undefined, AI_DOMAIN);
    // The signature file may carry more than its four fields; it is read
    // as JSON, and its length is what the limit counts.
    const padded = new Uint8Array(1024).fill(0x20);
    padded.set(signature);
    const reader = createReleaseListReader(config(AI_DOMAIN));
    storeHas(bundleBytes(list, padded));

    const [served, sig] = await fetchBoth(reader);

    expect(served.status).toBe(200);
    expect((await served.arrayBuffer()).byteLength).toBe(56 * 1024);
    expect((await sig.arrayBuffer()).byteLength).toBe(1024);
  });

  it("refuses an empty list of trusted keys, as 6529 AI's is until its key exists", async () => {
    const reader = createReleaseListReader(config(AI_DOMAIN, { signers: [] }));
    storeHas(signedBundle(LIST));

    expect((await reader.snapshot()).state).toBe("error");
  });

  it.each([
    [AI_DOMAIN, DESKTOP_DOMAIN],
    [AI_DOMAIN, VALIDATOR_DOMAIN],
    [DESKTOP_DOMAIN, AI_DOMAIN],
    [VALIDATOR_DOMAIN, AI_DOMAIN],
  ])(
    "refuses, under %s, a list signed under %s, by the same key",
    async (product, signedUnder) => {
      const reader = createReleaseListReader(config(product));
      storeHas(signedBundle(LIST, signedUnder));
      expect((await reader.snapshot()).state).toBe("error");

      const own = createReleaseListReader(config(product));
      storeHas(signedBundle(LIST, product));
      expect((await own.snapshot()).state).toBe("ok");
    }
  );

  describe("the sequence floor", () => {
    it("keeps the higher list when a lower one replaces it, then answers 503", async () => {
      const reader = createReleaseListReader(config(AI_DOMAIN));
      const newer = listBytes(aiList({ sequence: 1_795_000_005 }));
      storeHas(signedBundle(newer));
      expect((await reader.snapshot()).list?.sequence).toBe(1_795_000_005);

      storeHas(signedBundle(listBytes(aiList({ sequence: 1_795_000_004 }))));
      now.mockReturnValue(1_000_000 + 61_000);
      const [stale] = await fetchBoth(reader);
      expect(new Uint8Array(await stale.arrayBuffer())).toEqual(newer);

      now.mockReturnValue(1_000_000 + HOUR + 1);
      expect((await fetchBoth(reader))[0].status).toBe(503);
    });

    it("serves the same list again, and a higher one", async () => {
      const reader = createReleaseListReader(config(AI_DOMAIN));
      storeHas(signedBundle(LIST));
      expect((await reader.snapshot()).state).toBe("ok");

      now.mockReturnValue(1_000_000 + 61_000);
      expect((await reader.snapshot()).state).toBe("ok");

      const higher = listBytes(aiList({ sequence: 1_795_000_001 }));
      storeHas(signedBundle(higher));
      now.mockReturnValue(1_000_000 + 122_000);
      expect((await reader.snapshot()).list?.sequence).toBe(1_795_000_001);
    });
  });

  describe("the pair", () => {
    it("names a new signature over the same list as a new pair", async () => {
      const reader = createReleaseListReader(config(AI_DOMAIN));
      storeHas(signedBundle(LIST));
      const [first] = await fetchBoth(reader);

      // The same list, re-signed (ECDSA here is deterministic, so with
      // another key name) after the minute.
      const resigned = bundleBytes(
        LIST,
        signFeed(
          LIST,
          TEST_FEED_SIGNING_KEY.address.toUpperCase().replace("0X", "0x"),
          AI_DOMAIN
        )
      );
      storeHas(resigned);
      now.mockReturnValue(1_000_000 + 61_000);
      const [list, signature] = await fetchBoth(reader);

      expect(list.headers.get(RELEASE_LIST_PAIR_HEADER)).not.toBe(
        first.headers.get(RELEASE_LIST_PAIR_HEADER)
      );
      expect(signature.headers.get(RELEASE_LIST_PAIR_HEADER)).toBe(
        list.headers.get(RELEASE_LIST_PAIR_HEADER)
      );
    });

    it("gives a list and a signature read a minute apart different names", async () => {
      const reader = createReleaseListReader(config(AI_DOMAIN));
      storeHas(signedBundle(LIST));
      const list = await reader.serve(new Request("https://6529.io/l"), "feed");

      storeHas(signedBundle(listBytes(aiList({ sequence: 1_795_000_009 }))));
      now.mockReturnValue(1_000_000 + 61_000);
      const signature = await reader.serve(
        new Request("https://6529.io/s"),
        "signature"
      );

      // A client that sees two names fetches again past the cache.
      expect(list.headers.get(RELEASE_LIST_PAIR_HEADER)).not.toBe(
        signature.headers.get(RELEASE_LIST_PAIR_HEADER)
      );
    });
  });

  describe("a bundle that reads as missing after a served list", () => {
    it("withdraws the list where the role may list the bucket", async () => {
      const reader = createReleaseListReader(config(DESKTOP_DOMAIN));
      storeHas(signedBundle(LIST, DESKTOP_DOMAIN));
      expect((await reader.snapshot()).state).toBe("ok");

      storeHas(null);
      now.mockReturnValue(1_000_000 + 61_000);
      expect((await reader.snapshot()).state).toBe("missing");
    });

    it("keeps the list for an hour where it may not", async () => {
      const reader = createReleaseListReader(
        config(AI_DOMAIN, { missingAfterServed: "failed" })
      );
      storeHas(signedBundle(LIST));
      expect((await reader.snapshot()).state).toBe("ok");

      storeHas(null);
      now.mockReturnValue(1_000_000 + 61_000);
      expect((await reader.snapshot()).state).toBe("ok");

      now.mockReturnValue(1_000_000 + HOUR + 1);
      expect((await reader.snapshot()).state).toBe("missing");
    });
  });

  it("keeps the last good list through a bucket error, for an hour", async () => {
    const reader = createReleaseListReader(config(AI_DOMAIN));
    storeHas(signedBundle(LIST));
    expect((await reader.snapshot()).state).toBe("ok");

    mockRead.mockResolvedValue({ state: "error", reason: "S3 answered 500" });
    now.mockReturnValue(1_000_000 + 61_000);
    expect((await fetchBoth(reader))[0].status).toBe(200);

    now.mockReturnValue(1_000_000 + HOUR + 61_000);
    expect((await fetchBoth(reader))[0].status).toBe(503);
  });

  it("answers 404 for both parts before the first bundle", async () => {
    const reader = createReleaseListReader(config(AI_DOMAIN));
    storeHas(null);

    for (const response of await fetchBoth(reader)) {
      expect(response.status).toBe(404);
    }
  });

  describe("reads what the list gives and ignores the rest", () => {
    it("takes unknown fields at the top, in a release and in a file", async () => {
      const [entry] = [aiListEntry("0.1.0-rc.3")];
      const list = listBytes(
        aiList({
          checkpoints: [{ epoch: 1 }],
          future_field: { any: "shape" },
          releases: [
            {
              ...entry,
              software_id: `0x${"ab".repeat(32)}`,
              new_release_field: [1, 2, 3],
              files: [
                {
                  name: "6529-ai-0.1.0-rc.3-macos-arm64.dmg",
                  size: 1,
                  sha256: "1".repeat(64),
                  new_file_field: true,
                },
              ],
            },
          ],
        })
      );
      const reader = createReleaseListReader(config(AI_DOMAIN));
      storeHas(signedBundle(list));

      const snapshot = await reader.snapshot();

      expect(snapshot.state).toBe("ok");
      expect(snapshot.list?.releases[0]?.files).toEqual([
        {
          name: "6529-ai-0.1.0-rc.3-macos-arm64.dmg",
          size: 1,
          sha256: "1".repeat(64),
        },
      ]);
    });

    it("keeps old entries the producer shortened: short or no notes, few or no files", async () => {
      const list = listBytes(
        aiList({
          releases: [
            aiListEntry("0.1.0-rc.3"),
            {
              version: "0.1.0-rc.2",
              channel: "test",
              date: "2026-11-17",
              notes: "Short.",
            },
            {
              version: "0.1.0-rc.1",
              channel: "test",
              date: "2026-11-16",
              files: [],
            },
            {
              version: "0.0.9",
              channel: "test",
              date: "2026-11-01",
              files: [
                { name: "SHA256SUMS", size: 900, sha256: "9".repeat(64) },
              ],
            },
          ],
        })
      );
      const reader = createReleaseListReader(config(AI_DOMAIN));
      storeHas(signedBundle(list));

      const releases = (await reader.snapshot()).list?.releases ?? [];

      expect(
        releases.map(({ version, notes, files }) => [
          version,
          notes,
          files.length,
        ])
      ).toEqual([
        ["0.1.0-rc.3", "Made-up notes for 0.1.0-rc.3.", 10],
        ["0.1.0-rc.2", "Short.", 0],
        ["0.1.0-rc.1", null, 0],
        ["0.0.9", null, 1],
      ]);
    });
  });
});
