/** @jest-environment node */
import { renderToStaticMarkup } from "react-dom/server";

import type { AiBucketObject } from "@/lib/ai-page/releasesBucket";
import {
  aiFeedEntry,
  AI_TEST_FEED,
  feedBytes,
  MAC_SIGNER,
  WINDOWS_SIGNER,
} from "./fixtures";
import { signAiFeed } from "./feedSigning";

const mockRead = jest.fn<Promise<AiBucketObject>, [string]>();
const mockPresign = jest.fn(
  async (key: string) => `https://bucket.example/${key}`
);
let mockUserAgent = "";

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
jest.mock("next/headers", () => ({
  cookies: async () => ({ get: () => undefined }),
  headers: async () => new Headers({ "user-agent": mockUserAgent }),
}));
jest.mock("next/server", () => ({
  ...jest.requireActual("next/server"),
  connection: async () => undefined,
}));

import AiRoute, { metadata as downloadMetadata } from "@/app/ai/page";
import AiGuideRoute, { metadata as guideMetadata } from "@/app/ai/guide/page";
import AiKnownIssuesRoute, {
  metadata as knownIssuesMetadata,
} from "@/app/ai/known-issues/page";
import { resetAiReleaseFeedCacheForTests } from "@/lib/ai-page/releaseFeed";

const WINDOWS_UA =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Safari/537.36";
const MAC_UA =
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.0 Safari/605.1.15";
const DISCLAIMER =
  "This is a test release. Expect problems, and don&#x27;t rely on it for anything that matters.";

function storeIsEmpty() {
  mockRead.mockResolvedValue({ state: "missing" });
}

function storeHasSignedFeed() {
  const body = feedBytes(AI_TEST_FEED);
  mockRead.mockImplementation(async (key) =>
    key === "feed/releases.json"
      ? { state: "found", body, etag: '"e"', lastModified: null }
      : {
          state: "found",
          body: signAiFeed(body),
          etag: '"s"',
          lastModified: null,
        }
  );
}

/** Every path the page links under /ai/download. */
function downloadLinks(html: string): string[] {
  return [...html.matchAll(/href="(\/ai\/download\/[^"]+)"/g)].map(
    (match) => match[1] ?? ""
  );
}

async function renderAll(): Promise<string[]> {
  return [
    renderToStaticMarkup(await AiRoute()),
    renderToStaticMarkup(await AiGuideRoute()),
    renderToStaticMarkup(AiKnownIssuesRoute()),
  ];
}

describe("the /ai pages", () => {
  beforeEach(() => {
    resetAiReleaseFeedCacheForTests();
    mockRead.mockReset();
    mockPresign.mockClear();
    mockUserAgent = WINDOWS_UA;
  });

  it("say on every page, before its text, that 6529 AI is untested", async () => {
    storeHasSignedFeed();
    for (const html of await renderAll()) {
      expect(html).toContain("6529 AI is untested");
      expect(html).toContain(DISCLAIMER);
      const notice = html.indexOf("6529 AI is untested");
      expect(notice).toBeGreaterThan(html.indexOf("<h1"));
      expect(notice).toBeLessThan(html.indexOf("<h1") + 2_000);
    }
  });

  it("stay out of search engines", () => {
    for (const metadata of [
      downloadMetadata,
      guideMetadata,
      knownIssuesMetadata,
    ]) {
      expect(metadata.robots).toMatchObject({ index: false, follow: false });
    }
  });

  it("say there is no release yet, and offer no download, before the first feed", async () => {
    storeIsEmpty();
    const [download, guide] = await renderAll();
    expect(download).toContain(
      "There is no release yet. When there is one, its downloads appear here."
    );
    expect(download).toContain(">Test release<");
    expect(downloadLinks(download!)).toEqual([]);
    expect(download).not.toContain("All files");
    // The guide still reads, with the file names every release uses.
    expect(guide).toContain("6529-ai-&lt;version&gt;-macos-arm64.dmg");
    expect(mockPresign).not.toHaveBeenCalled();
  });

  it("says the list could not be loaded when the feed's signature doesn't verify", async () => {
    const body = feedBytes(AI_TEST_FEED);
    mockRead.mockImplementation(async (key) => ({
      state: "found",
      body:
        key === "feed/releases.json"
          ? body
          : signAiFeed(new TextEncoder().encode("{}")),
      etag: null,
      lastModified: null,
    }));
    const html = renderToStaticMarkup(await AiRoute());
    expect(html).toContain(
      "The release list could not be loaded. Reload the page in a minute."
    );
    expect(downloadLinks(html)).toEqual([]);
  });

  it("offers the newest release, Windows first for a Windows visitor", async () => {
    storeHasSignedFeed();
    const html = renderToStaticMarkup(await AiRoute());
    expect(html).toContain("Test release 0.1.0");
    expect(html).toContain(
      'aria-label="Download for Windows: 6529-ai-0.1.0-windows-x64-setup.exe"'
    );
    expect(html.indexOf("Download for Windows")).toBeLessThan(
      html.indexOf("Other systems")
    );
    // Every link is to the newest release, never the older candidate.
    const links = downloadLinks(html);
    expect(links.length).toBeGreaterThan(10);
    expect(links.every((link) => link.startsWith("/ai/download/0.1.0/"))).toBe(
      true
    );
    expect(html).not.toContain("0.1.0-rc.1");
  });

  it("offers the Mac app first for a Mac visitor", async () => {
    mockUserAgent = MAC_UA;
    storeHasSignedFeed();
    const html = renderToStaticMarkup(await AiRoute());
    expect(html).toContain(
      'aria-label="Download for Mac: 6529-ai-0.1.0-macos-arm64.dmg"'
    );
    expect(html.indexOf("Download for Mac")).toBeLessThan(
      html.indexOf("Other systems")
    );
    // Windows is one row among the other systems, not a big button.
    expect(html).not.toContain("Download for Windows");
    expect(html).toContain(
      'aria-label="Download 6529-ai-0.1.0-windows-x64-setup.exe"'
    );
  });

  it("lists every file with its SHA-256 and the name its code signature shows", async () => {
    storeHasSignedFeed();
    const html = renderToStaticMarkup(await AiRoute());
    for (const file of AI_TEST_FEED.releases[1]!.files) {
      expect(html).toContain(
        `href="/ai/download/0.1.0/${encodeURIComponent(file.name)}"`
      );
      expect(html).toContain(`title="${file.sha256}"`);
    }
    expect(html).toContain(MAC_SIGNER);
    expect(html).toContain(WINDOWS_SIGNER);
    expect(html).toMatch(
      /Release <span[^>]*>0\.1\.0<\/span>, published November 17, 2026, built from commit <span[^>]*>ccccccc<\/span>/
    );
  });

  it("says how to check a file and SHA256SUMS.sig", async () => {
    storeHasSignedFeed();
    const html = renderToStaticMarkup(await AiRoute());
    expect(html).toContain("shasum -a 256 -c SHA256SUMS --ignore-missing");
    expect(html).toContain("sha256sum -c SHA256SUMS --ignore-missing");
    expect(html).toContain(
      "Get-FileHash .\\6529-ai-0.1.0-windows-x64-setup.exe"
    );
    expect(html).toContain(
      "openssl pkeyutl -verify -pubin -inkey release-key.pub -rawin -in SHA256SUMS -sigfile SHA256SUMS.sig"
    );
    // The pinned key, as PEM; the test pins its own key in place of 6529
    // AI's (feedSignature.test.ts checks the real one's PEM).
    expect(html).toContain("-----BEGIN PUBLIC KEY-----");
    expect(html).toContain("release.py verify");
  });

  it("puts the release's file names and publisher in the guide", async () => {
    storeHasSignedFeed();
    const html = renderToStaticMarkup(await AiGuideRoute());
    expect(html).toContain("6529-ai-0.1.0-macos-arm64.dmg");
    expect(html).toContain("sudo apt install ./6529-ai_0.1.0_amd64.deb");
    expect(html).toMatch(
      new RegExp(`verified publisher <strong[^>]*>${WINDOWS_SIGNER}</strong>`)
    );
  });

  it("list what nobody has tried yet", () => {
    const html = renderToStaticMarkup(AiKnownIssuesRoute());
    for (const text of [
      "Nobody has tried it on a physical Mac.",
      "nobody has tried it on a macOS before 15.8",
      "or with a GPU",
      "Nobody has tried any package on another distribution",
      "Nobody has clicked through the installer",
      "answered its question by hand",
    ]) {
      expect(html).toContain(text);
    }
  });

  // Release candidate 1 runs models on the person's own computer only, and
  // the app hides the network: the pages explain none of it, beyond one
  // line on the download page that it comes later.
  it("leave the network out, but for one line on the download page", async () => {
    storeHasSignedFeed();
    const [download, guide, knownIssues] = await renderAll();
    const textOf = (html: string) =>
      html.replaceAll(/<[^>]+>/g, " ").replaceAll(/\s+/g, " ");
    for (const html of [guide!, knownIssues!]) {
      expect(textOf(html)).not.toMatch(
        /network|provider|\bTor\b|link.{0,20}account/i
      );
    }
    const mentions = textOf(download!).match(/network/gi) ?? [];
    expect(mentions).toHaveLength(1);
    expect(download).toContain(
      "the 6529 AI network comes later, with the chain integration."
    );
    expect(textOf(download!)).not.toMatch(/provider|\bTor\b/i);
  });

  it("offer release candidate 1 under its own version", async () => {
    const body = feedBytes({
      ...AI_TEST_FEED,
      releases: [aiFeedEntry("0.1.0-rc.1")],
    });
    mockRead.mockImplementation(async (key) => ({
      state: "found",
      body: key === "feed/releases.json" ? body : signAiFeed(body),
      etag: null,
      lastModified: null,
    }));
    const html = renderToStaticMarkup(await AiRoute());
    expect(html).toContain("Test release 0.1.0-rc.1");
    const links = downloadLinks(html);
    expect(links).toContain(
      "/ai/download/0.1.0-rc.1/6529-ai-0.1.0-rc.1-windows-x64-setup.exe"
    );
    expect(
      links.every((link) => link.startsWith("/ai/download/0.1.0-rc.1/"))
    ).toBe(true);
    const guide = renderToStaticMarkup(await AiGuideRoute());
    expect(guide).toContain("sudo apt install ./6529-ai_0.1.0-rc.1_amd64.deb");
  });
});
