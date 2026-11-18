/** @jest-environment node */
import { renderToStaticMarkup } from "react-dom/server";

import type { AiBucketObject } from "@/lib/ai-page/releasesBucket";
import type { FeedSigningKey } from "@/lib/validator-page/feedSigningKeys";

import {
  aiList,
  aiListEntry,
  DESKTOP_DOMAIN,
  listBytes,
  signedBundle,
  TEST_FEED_SIGNING_KEY,
} from "../release-section/listSigning";
import { AI_TEST_FEED, feedBytes } from "./fixtures";
import { signAiFeed } from "./feedSigning";

const mockRead = jest.fn<Promise<AiBucketObject>, [string]>();
const mockPresign = jest.fn(
  async (key: string) => `https://bucket.example/${key}`
);
// The trusted keys for the list of format 1: the tests add the test key.
const mockListKeys: FeedSigningKey[] = [];

jest.mock("@/lib/ai-page/releasesBucket", () => ({
  AI_FEED_OBJECT_KEY: "feed/releases.json",
  AI_FEED_SIGNATURE_OBJECT_KEY: "feed/releases.json.sig",
  getAiReleaseObjectKey: (version: string, name: string) =>
    `releases/${version}/${name}`,
  readAiReleaseObject: (key: string) => mockRead(key),
  presignAiReleaseObject: (key: string) => mockPresign(key),
}));
jest.mock("@/lib/ai-page/feedSigningKeys", () => ({
  AI_FEED_SIGNING_KEYS: [jest.requireActual("./feedSigning").TEST_AI_FEED_KEY],
}));
jest.mock("@/lib/ai-page/releaseListKeys", () => ({
  AI_RELEASE_LIST_KEYS: mockListKeys,
}));
jest.mock("next/headers", () => ({
  cookies: async () => ({ get: () => undefined }),
  headers: async () =>
    new Headers({
      "user-agent":
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Safari/537.36",
    }),
}));
jest.mock("next/server", () => ({
  ...jest.requireActual("next/server"),
  connection: async () => undefined,
}));

import { GET as downloadRoute } from "@/app/ai/download/[...path]/route";
import AiRoute from "@/app/ai/page";
import { GET as feedRoute } from "@/app/ai/releases.json/route";
import { GET as signatureRoute } from "@/app/ai/releases.json.sig/route";
import AiReleasesRoute, {
  metadata as releasesMetadata,
} from "@/app/ai/releases/page";
import {
  getAiReleaseFeedSnapshot,
  resetAiReleaseFeedCacheForTests,
} from "@/lib/ai-page/releaseFeed";
import { aiReleaseList } from "@/lib/ai-page/releaseList";
import { RELEASE_LIST_PAIR_HEADER } from "@/lib/validator-page/feedResponse";

const BUNDLE_KEY = "feed/releases.bundle.json";
const RC3 = "0.1.0-rc.3";
const DMG = `6529-ai-${RC3}-macos-arm64.dmg`;
const HOUR = 60 * 60 * 1000;
const LEGACY_FEED = feedBytes(AI_TEST_FEED);

function found(body: Uint8Array<ArrayBuffer>): AiBucketObject {
  return { state: "found", body, etag: '"e"', lastModified: null };
}

/**
 * The bucket: the Ed25519 feed of 0.1.0 as today, and, when given, the
 * bundle of a list of format 1.
 */
function storeHas(bundle: Uint8Array<ArrayBuffer> | null) {
  const objects: Record<string, AiBucketObject> = {
    "feed/releases.json": found(LEGACY_FEED),
    "feed/releases.json.sig": found(signAiFeed(LEGACY_FEED)),
    ...(bundle ? { [BUNDLE_KEY]: found(bundle) } : {}),
  };
  mockRead.mockImplementation(
    async (key) => objects[key] ?? { state: "missing" }
  );
}

function storeHasList(list: Record<string, unknown> = aiList()) {
  storeHas(signedBundle(listBytes(list)));
}

const request = (path: string) => new Request(`https://6529.io${path}`);

function download(...path: string[]) {
  return downloadRoute(request("/ai/download"), {
    params: Promise.resolve({ path }),
  });
}

async function bodyOf(response: Response): Promise<string> {
  return new TextDecoder().decode(await response.arrayBuffer());
}

describe("6529 AI's release list of format 1", () => {
  let now: jest.SpyInstance<number, []>;

  beforeEach(() => {
    resetAiReleaseFeedCacheForTests();
    mockRead.mockReset();
    mockPresign.mockClear();
    mockListKeys.splice(0, mockListKeys.length, TEST_FEED_SIGNING_KEY);
    now = jest.spyOn(Date, "now").mockReturnValue(1_000_000);
    jest.spyOn(console, "warn").mockImplementation(() => undefined);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe("in place of the Ed25519 feed", () => {
    it("serves the bundle's list and signature when it verifies, named by one pair", async () => {
      const list = listBytes(aiList());
      storeHas(signedBundle(list));

      const feed = await feedRoute(request("/ai/releases.json"));
      const signature = await signatureRoute(request("/ai/releases.json.sig"));

      expect(feed.status).toBe(200);
      expect(new Uint8Array(await feed.arrayBuffer())).toEqual(list);
      expect(JSON.parse(await bodyOf(signature))).toMatchObject({
        format: 1,
        algorithm: "ecdsa-secp256k1-sha256",
        key: TEST_FEED_SIGNING_KEY.address,
      });
      const pair = feed.headers.get(RELEASE_LIST_PAIR_HEADER);
      expect(pair).toMatch(/^[0-9a-f]{32}$/);
      expect(signature.headers.get(RELEASE_LIST_PAIR_HEADER)).toBe(pair);
      expect(feed.headers.get("x-robots-tag")).toBe("noindex, nofollow");
    });

    it.each<[string, () => void]>([
      ["there is no bundle", () => storeHas(null)],
      [
        "the bundle is signed under 6529 Desktop's domain",
        () => storeHas(signedBundle(listBytes(aiList()), DESKTOP_DOMAIN)),
      ],
      [
        "no key is trusted for it yet",
        () => {
          mockListKeys.splice(0, mockListKeys.length);
          storeHasList();
        },
      ],
      [
        "the bundle is malformed",
        () => storeHas(new TextEncoder().encode("{}")),
      ],
      [
        "the bucket fails to read the bundle",
        () => {
          storeHas(null);
          const read = mockRead.getMockImplementation()!;
          mockRead.mockImplementation(async (key) =>
            key === BUNDLE_KEY
              ? { state: "error", reason: "S3 answered 500" }
              : read(key)
          );
        },
      ],
    ])("serves the Ed25519 feed while %s", async (_name, setUp) => {
      setUp();

      const feed = await feedRoute(request("/ai/releases.json"));

      expect(feed.status).toBe(200);
      expect(new Uint8Array(await feed.arrayBuffer())).toEqual(LEGACY_FEED);
      expect(feed.headers.get(RELEASE_LIST_PAIR_HEADER)).toBeNull();
      expect((await download("6529-ai-0.1.0-macos-arm64.dmg")).status).toBe(
        302
      );
      expect((await getAiReleaseFeedSnapshot()).source).toBe("ed25519");
    });

    it("never goes back to the Ed25519 feed once it has served the bundle", async () => {
      storeHasList();
      expect((await getAiReleaseFeedSnapshot()).source).toBe("list");

      // The bundle stops verifying: its last good list stays for an hour.
      storeHas(signedBundle(listBytes(aiList()), DESKTOP_DOMAIN));
      now.mockReturnValue(1_000_000 + 61_000);
      expect((await getAiReleaseFeedSnapshot()).source).toBe("list");
      expect((await download(DMG)).status).toBe(302);

      // Then the pages offer nothing, rather than the older Ed25519 list.
      now.mockReturnValue(1_000_000 + HOUR + 61_000);
      expect((await feedRoute(request("/ai/releases.json"))).status).toBe(503);
      expect((await download(DMG)).status).toBe(503);
      expect((await download("6529-ai-0.1.0-macos-arm64.dmg")).status).toBe(
        503
      );
    });

    it("refuses a list with a lower sequence than one it served", async () => {
      storeHasList(aiList({ sequence: 1_795_000_005 }));
      expect((await getAiReleaseFeedSnapshot()).releases[0]?.version).toBe(RC3);

      storeHasList(
        aiList({
          sequence: 1_795_000_004,
          releases: [aiListEntry("0.1.0-rc.2")],
        })
      );
      now.mockReturnValue(1_000_000 + 61_000);
      expect((await getAiReleaseFeedSnapshot()).releases[0]?.version).toBe(RC3);
    });
  });

  describe("its files", () => {
    it("take their system from the name and their signer from the type", async () => {
      storeHasList();

      const [newest] = (await getAiReleaseFeedSnapshot()).releases;
      const byName = Object.fromEntries(
        (newest?.files ?? []).map((file) => [
          file.name,
          [file.system, file.signedBy, file.signed],
        ])
      );

      expect(byName).toEqual({
        [DMG]: ["macos-arm64", "apple", null],
        [`6529-ai-${RC3}-windows-x64-setup.exe`]: [
          "windows-x64",
          "publisher",
          "6529 Collection LLC",
        ],
        [`6529-ai_${RC3}_amd64.deb`]: ["linux-x86_64-cpu", "list", null],
        [`6529-ai-cuda_${RC3}_amd64.deb`]: ["linux-x86_64-cuda", "list", null],
        [`6529-ai_${RC3}_arm64.deb`]: ["linux-arm64-cpu", "list", null],
        [`6529-ai-${RC3}-linux-x86_64-cpu.tar.gz`]: [
          "linux-x86_64-cpu",
          "list",
          null,
        ],
        [`6529-ai-${RC3}-linux-x86_64-cuda.tar.gz`]: [
          "linux-x86_64-cuda",
          "list",
          null,
        ],
        [`6529-ai-${RC3}-linux-arm64-cpu.tar.gz`]: [
          "linux-arm64-cpu",
          "list",
          null,
        ],
        "NOTES.md": [null, "list", null],
        SHA256SUMS: [null, "list", null],
      });
    });

    it("are handed out for the newest release only", async () => {
      storeHasList();

      for (const path of [[DMG], [RC3, DMG], [RC3, "NOTES.md"]]) {
        expect((await download(...path)).status).toBe(302);
      }
      for (const path of [
        ["6529-ai-0.1.0-rc.2-macos-arm64.dmg"],
        ["0.1.0-rc.2", "NOTES.md"],
        ["6529-ai-0.1.0-macos-arm64.dmg"],
      ]) {
        expect((await download(...path)).status).toBe(404);
      }
      expect(mockPresign).toHaveBeenCalledWith(`releases/${RC3}/${DMG}`);
    });
  });

  describe("on /ai", () => {
    function downloadLinks(html: string): string[] {
      return [...html.matchAll(/href="\/ai\/download\/[^"/]+\/([^"]+)"/g)].map(
        (match) => match[1] ?? ""
      );
    }

    it("shows each file's signer by its type, and offers only the files it can place", async () => {
      storeHasList();

      const html = renderToStaticMarkup(await AiRoute());

      expect(html).toContain("Signed by 6529 Collection LLC");
      expect(html).toContain("Apple Developer ID, notarized");
      expect(html).toContain("SHA-256 in the signed list");
      expect(html).not.toContain("Notarized by Apple");
      const links = new Set(downloadLinks(html));
      expect(links).toContain(DMG);
      expect(links).toContain(`6529-ai-cuda_${RC3}_amd64.deb`);
      expect(links).toContain(`6529-ai-${RC3}-linux-arm64-cpu.tar.gz`);
      expect(links).not.toContain("NOTES.md");
      // The release has no SHA256SUMS.sig, so the page doesn't ask for it.
      expect(html).not.toContain("SHA256SUMS.sig");
      expect(html).not.toContain("is an urgent update");
      expect(html).not.toContain("is listed as unsafe");
    });

    it("puts an urgent update first, with its reason and deadline in UTC", async () => {
      storeHasList(
        aiList({
          min_supported: RC3,
          deadline: "2026-11-25T12:00:00Z",
          deadline_reason: "Older releases stop fetching models.",
          releases: [
            aiListEntry(RC3, {
              severity: "urgent",
              reason: "Fixes a model download that never ends.",
            }),
            aiListEntry("0.1.0-rc.2"),
          ],
        })
      );

      const html = renderToStaticMarkup(await AiRoute());

      const alert = html.indexOf(`${RC3} is an urgent update.`);
      expect(alert).toBeGreaterThan(html.indexOf("<h1"));
      expect(alert).toBeLessThan(html.indexOf("Untested test release."));
      expect(html).toContain("Fixes a model download that never ends.");
      expect(html).toContain(
        `If you run a release before ${RC3}, install ${RC3} before 2026-11-25 12:00 UTC.`
      );
      expect(html).toContain("Older releases stop fetching models.");
      expect(html).toContain(`href="/ai/releases#${RC3}"`);
      expect(downloadLinks(html)).toContain(DMG);
    });

    it("reads a severity it doesn't know as urgent", async () => {
      storeHasList(
        aiList({ releases: [aiListEntry(RC3, { severity: "critical" })] })
      );

      expect(renderToStaticMarkup(await AiRoute())).toContain(
        `${RC3} is an urgent update.`
      );
    });

    it("says the newest release is unsafe, and offers none of its files", async () => {
      storeHasList(
        aiList({
          unsafe_versions: [
            { version: RC3, reason: "It deletes downloaded models on update." },
          ],
        })
      );

      const html = renderToStaticMarkup(await AiRoute());

      const alert = html.indexOf(`${RC3} is listed as unsafe.`);
      expect(alert).toBeGreaterThan(html.indexOf("<h1"));
      expect(alert).toBeLessThan(html.indexOf("Untested test release."));
      expect(html).toContain("It deletes downloaded models on update.");
      expect(html).toContain(
        `The newest release, ${RC3}, is listed as unsafe, so it isn&#x27;t offered here.`
      );
      expect(downloadLinks(html)).toEqual([]);
      expect((await download(DMG)).status).toBe(404);
    });
  });

  describe("on /ai/releases", () => {
    it("stays out of search engines", () => {
      expect(releasesMetadata.robots).toMatchObject({
        index: false,
        follow: false,
      });
    });

    it("lists every release newest first, each under its version, with every file's full SHA-256", async () => {
      storeHasList(
        aiList({
          releases: [
            aiListEntry("0.1.0-rc.2"),
            aiListEntry(RC3, { notes: "First line.\n<b>Not HTML</b>" }),
          ],
        })
      );

      const html = renderToStaticMarkup(await AiReleasesRoute());

      expect(html.indexOf(`id="${RC3}"`)).toBeGreaterThan(-1);
      expect(html.indexOf(`id="${RC3}"`)).toBeLessThan(
        html.indexOf('id="0.1.0-rc.2"')
      );
      expect(html).toContain("Latest");
      expect(html.match(/>Latest</g)).toHaveLength(1);
      expect(html).toContain("d".repeat(40));
      expect(html).toContain(">test<");
      expect(html).toContain("November 20, 2026");
      expect(html).toContain("First line.\n&lt;b&gt;Not HTML&lt;/b&gt;");
      expect(html).not.toContain("<b>Not HTML</b>");
      for (const digit of ["1", "2", "3", "e", "9"]) {
        expect(html).toContain(`>${digit.repeat(64)}<`);
      }
      expect(html).toContain("NOTES.md");
      expect(html).toContain("Apple Developer ID, notarized");
      // Only the newest release's files link to a download.
      expect(html).toContain(`href="/ai/download/${RC3}/NOTES.md"`);
      expect(html).not.toContain('href="/ai/download/0.1.0-rc.2/');
      expect(html).toContain('href="/ai/releases.json"');
    });

    it("shows a shortened old entry with what it has, and claims nothing is missing", async () => {
      storeHasList(
        aiList({
          releases: [
            aiListEntry(RC3),
            { version: "0.1.0-rc.2", channel: "test", date: "2026-11-17" },
            {
              version: "0.1.0-rc.1",
              channel: "test",
              date: "2026-11-16",
              notes: "First.",
              files: [],
            },
          ],
        })
      );

      const html = renderToStaticMarkup(await AiReleasesRoute());
      const rc2 = html.slice(
        html.indexOf('id="0.1.0-rc.2"'),
        html.indexOf('id="0.1.0-rc.1"')
      );
      const rc1 = html.slice(html.indexOf('id="0.1.0-rc.1"'));

      expect(rc2).toContain("November 17, 2026");
      expect(rc2).not.toContain("Files");
      expect(rc2).not.toContain("<table");
      expect(rc1).toContain("First.");
      expect(rc1).not.toContain("<table");
      expect(html.toLowerCase()).not.toMatch(/missing|no files|not listed/);
    });

    it("marks an unsafe release and gives Latest to none", async () => {
      storeHasList(
        aiList({ unsafe_versions: [{ version: RC3, reason: "Do not run." }] })
      );

      const html = renderToStaticMarkup(await AiReleasesRoute());

      expect(html).toContain(">Unsafe<");
      expect(html).toContain("Unsafe to run: Do not run.");
      expect(html).not.toContain(">Latest<");
      expect(html).not.toContain('href="/ai/download/');
    });

    it("lists the Ed25519 feed's releases the same way", async () => {
      storeHas(null);

      const html = renderToStaticMarkup(await AiReleasesRoute());

      expect(html.indexOf('id="0.1.0"')).toBeGreaterThan(-1);
      expect(html.indexOf('id="0.1.0"')).toBeLessThan(
        html.indexOf('id="0.1.0-rc.1"')
      );
      expect(html).toContain('href="/ai/download/0.1.0/SHA256SUMS"');
      expect(html).toContain(`>${"1".repeat(64)}<`);
    });

    it.each<[string, () => void, string]>([
      [
        "before the first list",
        () => mockRead.mockResolvedValue({ state: "missing" }),
        "There is no release yet.",
      ],
      [
        "when the list can't be read",
        () =>
          mockRead.mockResolvedValue({
            state: "error",
            reason: "S3 answered 500",
          }),
        "The release list could not be loaded. Reload the page in a minute.",
      ],
    ])("says so %s", async (_name, setUp, text) => {
      setUp();

      const html = renderToStaticMarkup(await AiReleasesRoute());

      expect(html).toContain(text);
      expect(html).not.toContain('href="/ai/releases.json"');
    });
  });

  it("puts Releases in the menu after Known issues, before the extras", async () => {
    storeHasList();

    const html = renderToStaticMarkup(await AiReleasesRoute());
    const menu = [...html.matchAll(/<a[^>]*href="(\/ai[^"#]*)"[^>]*>/g)]
      .map((match) => match[1])
      .slice(0, 6);

    expect(menu).toEqual([
      "/ai",
      "/ai/guide",
      "/ai/known-issues",
      "/ai/releases",
      "/ai/models",
      "/ai/use",
    ]);
    const current = /<a[^>]*aria-current="page"[^>]*>/.exec(html)?.[0] ?? "";
    expect(current).toContain('href="/ai/releases"');
  });

  it("is read from its own bundle, under its own domain", () => {
    expect(aiReleaseList.config).toMatchObject({
      domain: "6529 AI releases v1",
      bundleKey: "feed/releases.bundle.json",
      routes: {
        list: "/ai/releases.json",
        signature: "/ai/releases.json.sig",
        releases: "/ai/releases",
      },
    });
  });
});
