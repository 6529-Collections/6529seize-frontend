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
import AiModelsRoute, {
  metadata as modelsMetadata,
} from "@/app/ai/models/page";
import AiUseRoute, { metadata as useMetadata } from "@/app/ai/use/page";
import { resetAiReleaseFeedCacheForTests } from "@/lib/ai-page/releaseFeed";

const WINDOWS_UA =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Safari/537.36";
const IPHONE_UA =
  "Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.0 Mobile/15E148 Safari/604.1";
const MAC_UA =
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.0 Safari/605.1.15";
const NOTICE = "Untested test release.";
const DISCLAIMER =
  "Expect problems, and don&#x27;t rely on it for anything that matters.";

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
    renderToStaticMarkup(await AiKnownIssuesRoute()),
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
    const [download, guide, knownIssues] = await renderAll();
    const models = renderToStaticMarkup(AiModelsRoute());
    const use = renderToStaticMarkup(AiUseRoute());
    for (const html of [download!, guide!, models, use]) {
      expect(html).toContain(NOTICE);
      expect(html).toContain(DISCLAIMER);
      const notice = html.indexOf(NOTICE);
      expect(notice).toBeGreaterThan(html.indexOf("<h1"));
      expect(notice).toBeLessThan(html.indexOf("<h1") + 2_000);
    }
    // The known issues say it in their lead, right under the title.
    const lead = knownIssues!.indexOf("This is an untested test release");
    expect(lead).toBeGreaterThan(knownIssues!.indexOf("<h1"));
    expect(lead).toBeLessThan(knownIssues!.indexOf("<h1") + 500);
    expect(knownIssues).toContain(
      "expect problems, and don&#x27;t rely on it for anything that matters."
    );
  });

  it("stay out of search engines", () => {
    for (const metadata of [
      downloadMetadata,
      guideMetadata,
      knownIssuesMetadata,
      modelsMetadata,
      useMetadata,
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
    expect(download).not.toContain(">Downloads<");
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
    expect(html).toContain(">0.1.0</span>");
    expect(html).toContain(
      'aria-label="Download for Windows: 6529-ai-0.1.0-windows-x64-setup.exe"'
    );
    expect(html.indexOf("Download for Windows")).toBeLessThan(
      html.indexOf("Also for")
    );
    // A no-break space joins the size and its unit.
    expect(html).toContain("0.1.0 · 120.0 MB · Windows 10 or 11, 64-bit");
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
      html.indexOf("Also for")
    );
    // Windows is a quiet link and a row under Downloads, not a big button.
    expect(html).not.toContain("Download for Windows<");
    expect(html).toContain(
      'aria-label="Download for Windows: 6529-ai-0.1.0-windows-x64-setup.exe"'
    );
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
      if (file.system !== null) {
        // Behind a copy button, and whole for screen readers.
        expect(html).toContain(`>${file.sha256}<`);
        expect(html).toContain(`aria-label="Copy the SHA-256 of ${file.name}"`);
      }
    }
    expect(html).not.toContain(MAC_SIGNER);
    expect(html).toContain(`Signed by ${WINDOWS_SIGNER}`);
    expect(html).toContain("Notarized by Apple");
    expect(html).toMatch(
      /0\.1\.0 · released November 17, 2026 · commit <span[^>]*>ccccccc<\/span>/
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

  it("list what hasn't been tested, with the day the list changed", async () => {
    storeHasSignedFeed();
    const html = renderToStaticMarkup(await AiKnownIssuesRoute());
    expect(html).toContain(">Known issues</h1>");
    expect(html).toContain("Updated November 17, 2026");
    for (const text of [
      "Tested only on a cloud Mac (M2, macOS 15.8.2).",
      "Opening the app by double-click hasn&#x27;t been tested",
      "Not tested with a GPU.",
      "Tested only on Ubuntu 22.04 and 24.04.",
      "Clicking through the installer&#x27;s screens hasn&#x27;t been tested",
      "6529-ai/placement select alone",
      "can fail with &quot;error sending request for url&quot;",
      "Invoke-WebRequest https://valid-isrgrootx1.letsencrypt.org -UseBasicParsing | Out-Null",
      "Start-ScheduledTask -TaskName &#x27;6529 AI&#x27;",
    ]) {
      expect(html).toContain(text);
    }
  });

  it("send a problem report to the 6529 AI wave", async () => {
    storeHasSignedFeed();
    const [, guide, knownIssues] = await renderAll();
    const reportLinks = (html: string) =>
      html.match(/href="\/waves\/46f873a7-6d5c-4dd0-b094-95fddca391b3"/g) ?? [];
    expect(reportLinks(knownIssues!)).toHaveLength(2);
    expect(reportLinks(guide!)).toHaveLength(1);
    expect(knownIssues).toContain("add a screenshot and the log");
  });

  it("open the Linux downloads on an ARM64 visitor's CPU", async () => {
    mockUserAgent =
      "Mozilla/5.0 (X11; Linux aarch64; rv:131.0) Gecko/20100101 Firefox/131.0";
    storeHasSignedFeed();
    const html = renderToStaticMarkup(await AiRoute());
    expect(html).toContain(
      'aria-label="Download for Linux, ARM64: 6529-ai_0.1.0_arm64.deb"'
    );
    // The switch opens on ARM64: its tab is the selected one.
    expect(html).toMatch(/aria-selected="true"[^>]*>ARM64</);
    expect(html).toMatch(/aria-selected="false"[^>]*>x86-64</);
  });

  it("show the app's own screenshots, with what each one shows", async () => {
    mockUserAgent = MAC_UA;
    storeHasSignedFeed();
    const [download, guide, knownIssues] = await renderAll();
    expect(download).toContain("%2Fai%2Fuse%2F31-start.webp");
    expect(download).toContain(
      "Start lists the models that fit this computer."
    );
    expect(guide).toContain("%2Fai%2Fuse%2F14-mac-first-run.webp");
    expect(guide).toContain("%2Fai%2Fuse%2F40-chat.webp");
    expect(guide).toContain("A chat reply from gemma-4-26b-a4b");
    // The Mac's question shows at its real size: half the 2x file.
    expect(guide).toContain("max-width:432px");
    expect(knownIssues).not.toContain("<figure");
  });

  it("link the models and the walk-through", async () => {
    storeHasSignedFeed();
    const [download, guide] = await renderAll();
    expect(download).toMatch(/href="\/ai\/models"[^>]*>See every model/);
    expect(download).toMatch(/href="\/ai\/use"[^>]*>Use it for real/);
    expect(guide).toContain("Next: use it for real");
    expect(guide).toContain('href="/ai/use"');
  });

  it("ask a phone to open the page on a computer", async () => {
    mockUserAgent = IPHONE_UA;
    storeHasSignedFeed();
    const html = renderToStaticMarkup(await AiRoute());
    expect(html).toContain("Open this page on your computer to download it.");
    expect(html).toContain("Copy link");
    expect(html).not.toContain("Download for Mac<");
    expect(html).toContain(
      'aria-label="Download for Mac: 6529-ai-0.1.0-macos-arm64.dmg"'
    );
  });

  // Release candidate 1 runs models on the person's own computer only, and
  // the app hides the network: the pages name it at most once.
  it("leave the network out", async () => {
    storeHasSignedFeed();
    const [download, guide, knownIssues] = await renderAll();
    const textOf = (html: string) =>
      html.replaceAll(/<[^>]+>/g, " ").replaceAll(/\s+/g, " ");
    for (const html of [guide!, knownIssues!]) {
      expect(textOf(html)).not.toMatch(
        /network|provider|\bTor\b|link.{0,20}account/i
      );
    }
    for (const html of [
      renderToStaticMarkup(AiModelsRoute()),
      renderToStaticMarkup(AiUseRoute()),
    ]) {
      expect(textOf(html)).not.toMatch(/the network|AI network|Tor/i);
    }
    const mentions = textOf(download!).match(/network/gi) ?? [];
    expect(mentions.length).toBeLessThanOrEqual(1);
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
    expect(html).toContain(">0.1.0-rc.1</span>");
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
