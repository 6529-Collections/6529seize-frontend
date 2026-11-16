/** @jest-environment node */
import { renderToStaticMarkup } from "react-dom/server";
import { publicKeyToAddress } from "viem/accounts";

import type {
  BucketLocation,
  BucketObject,
} from "@/lib/validator-page/releasesBucket";

import { signFeed, TEST_FEED_SIGNING_KEY } from "../validator-page/feedSigning";

const DESKTOP_DOMAIN = "6529 Desktop releases v1";
const mockRead = jest.fn<Promise<BucketObject>, [BucketLocation, string]>();
const mockPresign = jest.fn(
  async (
    location: BucketLocation,
    key: string,
    options: { responseParams?: Record<string, string> }
  ) =>
    `https://${location.bucket}.example/${key}?${new URLSearchParams(options.responseParams ?? {}).toString()}`
);
let mockUserAgent = "";

jest.mock("@/lib/validator-page/releasesBucket", () => ({
  ...jest.requireActual("@/lib/validator-page/releasesBucket"),
  readBucketObject: (location: BucketLocation, key: string) =>
    mockRead(location, key),
  presignBucketObject: (
    location: BucketLocation,
    key: string,
    options: { responseParams?: Record<string, string> }
  ) => mockPresign(location, key, options),
}));
jest.mock("@/lib/desktop-releases/signingKeys", () => ({
  ...jest.requireActual("@/lib/desktop-releases/signingKeys"),
  DESKTOP_RELEASE_LIST_KEYS: [
    jest.requireActual("../validator-page/feedSigning").TEST_FEED_SIGNING_KEY,
  ],
}));
jest.mock("next/headers", () => ({
  cookies: async () => ({ get: () => undefined }),
  headers: async () => new Headers({ "user-agent": mockUserAgent }),
}));
jest.mock("next/server", () => ({
  ...jest.requireActual("next/server"),
  connection: async () => undefined,
}));

import { GET as download } from "@/app/desktop/download/[...path]/route";
import DesktopGuideRoute, {
  metadata as guideMetadata,
} from "@/app/desktop/guide/page";
import DesktopKnownIssuesRoute, {
  metadata as knownIssuesMetadata,
} from "@/app/desktop/known-issues/page";
import DesktopRoute, { metadata as downloadMetadata } from "@/app/desktop/page";
import { GET as getList } from "@/app/desktop/releases.json/route";
import DesktopReleasesRoute, {
  metadata as releasesMetadata,
} from "@/app/desktop/releases/page";
import { resetDesktopReleaseListCacheForTests } from "@/lib/desktop-releases/releaseList";

const SIGNING_KEYS = jest.requireActual<
  typeof import("@/lib/desktop-releases/signingKeys")
>("@/lib/desktop-releases/signingKeys");

const hash = (digit: string) => digit.repeat(64);
const SETUP = "6529-Desktop_0.1.0-rc.2_windows-x64-setup.exe";
const DMG = "6529-Desktop_0.1.0-rc.2_macos-arm64.dmg";

/** A list in the shape 6529 Desktop's release tool writes; values made up. */
const TEST_LIST = {
  format: 1,
  sequence: 1_794_700_000,
  published: "2026-11-16T15:00:00Z",
  download_page: "https://6529.io/desktop",
  releases: [
    {
      version: "0.1.0-rc.1",
      channel: "test",
      date: "2026-11-14",
      commit: "b".repeat(40),
      notes: "First signed build.",
      notes_url: "https://6529.io/desktop/releases#0.1.0-rc.1",
      files: [
        {
          name: "6529-Desktop_0.1.0-rc.1_windows-x64-setup.exe",
          size: 85_000_000,
          sha256: hash("7"),
        },
      ],
    },
    {
      version: "0.1.0-rc.2",
      channel: "test",
      date: "2026-11-16",
      commit: "c".repeat(40),
      notes: "Second signed build.",
      notes_url: "https://6529.io/desktop/releases#0.1.0-rc.2",
      files: [
        { name: DMG, size: 161_234_567, sha256: hash("1") },
        { name: SETUP, size: 86_012_345, sha256: hash("2") },
        { name: "SHA256SUMS", size: 291, sha256: hash("3") },
        { name: "release.json", size: 5_081, sha256: hash("4") },
      ],
    },
  ],
};

const WINDOWS_UA =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Safari/537.36";
const MAC_UA =
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.0 Safari/605.1.15";
const LINUX_UA =
  "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Safari/537.36";
const NOTICE = "6529 Desktop is a test release";
const NOT_OUT_YET =
  "No release is published yet. When one is, its downloads appear here.";
const UNAVAILABLE =
  "The release list could not be loaded. Reload the page in a minute.";

const b64 = (bytes: Uint8Array) => Buffer.from(bytes).toString("base64");
const listBytes = (list: unknown) =>
  new TextEncoder().encode(`${JSON.stringify(list)}\n`);

function storeHolds(list: Uint8Array, signature: Uint8Array) {
  const body = new TextEncoder().encode(
    JSON.stringify({ version: 1, list: b64(list), signature: b64(signature) })
  );
  mockRead.mockResolvedValue({
    state: "found",
    body,
    etag: '"bundle"',
    lastModified: null,
  });
}

function storeHasSignedList(list: unknown = TEST_LIST) {
  const bytes = listBytes(list);
  storeHolds(
    bytes,
    signFeed(bytes, TEST_FEED_SIGNING_KEY.address, DESKTOP_DOMAIN)
  );
}

/** Every path the page links under /desktop/download. */
function downloadLinks(html: string): string[] {
  return [...html.matchAll(/href="(\/desktop\/download\/[^"]+)"/g)].map(
    (match) => match[1] ?? ""
  );
}

async function renderAll(): Promise<string[]> {
  return [
    renderToStaticMarkup(await DesktopRoute()),
    renderToStaticMarkup(await DesktopGuideRoute()),
    renderToStaticMarkup(DesktopKnownIssuesRoute()),
    renderToStaticMarkup(await DesktopReleasesRoute()),
  ];
}

function fetchDownload(...path: string[]): Promise<Response> {
  return download(new Request("https://6529.io/desktop/download/x"), {
    params: Promise.resolve({ path }),
  });
}

describe("the 6529 Desktop release key", () => {
  it("is the Desktop key, and its address is the one the signature names", () => {
    const keys = SIGNING_KEYS.DESKTOP_RELEASE_LIST_KEYS;
    expect(keys).toHaveLength(1);
    expect(publicKeyToAddress(`0x${keys[0]!.publicKey}`)).toBe(
      keys[0]!.address
    );
    expect(keys[0]!.address).toBe("0xf91Ed41FE48448395Ac484f678a2E52fA922d055");
    expect(SIGNING_KEYS.DESKTOP_RELEASE_LIST_DOMAIN).toBe(DESKTOP_DOMAIN);
  });
});

describe("the /desktop pages", () => {
  const savedBucket = process.env["DESKTOP_RELEASES_BUCKET"];

  beforeEach(() => {
    resetDesktopReleaseListCacheForTests();
    mockRead.mockReset();
    mockPresign.mockClear();
    mockUserAgent = WINDOWS_UA;
    process.env["DESKTOP_RELEASES_BUCKET"] = "desktop-releases";
    jest.spyOn(console, "warn").mockImplementation(() => undefined);
  });

  afterEach(() => {
    jest.restoreAllMocks();
    if (savedBucket === undefined) {
      delete process.env["DESKTOP_RELEASES_BUCKET"];
    } else {
      process.env["DESKTOP_RELEASES_BUCKET"] = savedBucket;
    }
  });

  it("say on every page, under its title, that this is a test release", async () => {
    storeHasSignedList();
    for (const html of await renderAll()) {
      const notice = html.indexOf(NOTICE);
      expect(notice).toBeGreaterThan(html.indexOf("<h1"));
      expect(notice).toBeLessThan(html.indexOf("<h1") + 2_000);
      expect(html).toContain('href="/desktop/known-issues"');
    }
  });

  it("stay out of search engines", () => {
    for (const metadata of [
      downloadMetadata,
      guideMetadata,
      knownIssuesMetadata,
      releasesMetadata,
    ]) {
      expect(metadata.robots).toMatchObject({ index: false, follow: false });
    }
  });

  it("read the built-in bucket, and offer nothing before a list is published", async () => {
    delete process.env["DESKTOP_RELEASES_BUCKET"];
    mockRead.mockResolvedValue({ state: "missing" });
    const [page, guide, , releases] = await renderAll();
    expect(page).toContain(NOT_OUT_YET);
    expect(page).toContain(">Test release<");
    expect(page).not.toContain("All files");
    expect(page).toContain("There is no Linux version yet. It comes later.");
    expect(downloadLinks(page!)).toEqual([]);
    // The guide still reads, with the names every release gives the files.
    expect(guide).toContain(
      "6529-Desktop_&lt;version&gt;_windows-x64-setup.exe"
    );
    expect(guide).toContain("6529-Desktop_&lt;version&gt;_macos-arm64.dmg");
    expect(releases).toContain("No release is published yet.");
    expect(mockRead).toHaveBeenCalledWith(
      { bucket: "6529-desktop-releases-06c6aa2e", region: "us-east-1" },
      "feed/releases.bundle.json"
    );
    const missing = await fetchDownload(SETUP);
    expect(missing.status).toBe(404);
    expect(await missing.text()).toBe(
      "The newest release has no file by that name." + String.fromCharCode(10)
    );
    expect(mockPresign).not.toHaveBeenCalled();
  });

  it("say there is no release yet while the bucket holds no list", async () => {
    mockRead.mockResolvedValue({ state: "missing" });
    const html = renderToStaticMarkup(await DesktopRoute());
    expect(html).toContain(NOT_OUT_YET);
    expect(downloadLinks(html)).toEqual([]);
  });

  it.each([
    [
      "signed under the validator's domain",
      () => {
        const bytes = listBytes(TEST_LIST);
        storeHolds(bytes, signFeed(bytes));
      },
    ],
    [
      "signed by a key the site doesn't trust",
      () => {
        const bytes = listBytes(TEST_LIST);
        storeHolds(
          bytes,
          signFeed(bytes, `0x${"11".repeat(20)}`, DESKTOP_DOMAIN)
        );
      },
    ],
    [
      "whose signature is over another list",
      () => {
        const bytes = listBytes(TEST_LIST);
        storeHolds(
          bytes,
          signFeed(
            listBytes({ ...TEST_LIST, sequence: 1 }),
            undefined,
            DESKTOP_DOMAIN
          )
        );
      },
    ],
    [
      "of another format",
      () => storeHasSignedList({ ...TEST_LIST, format: 2 }),
    ],
    [
      "the bucket can't be read",
      () =>
        mockRead.mockResolvedValue({
          state: "error",
          reason: "S3 answered 500",
        }),
    ],
  ])("offer nothing for a list %s", async (_name, setUp) => {
    setUp();
    const [page, , , releases] = await renderAll();
    expect(page).toContain(UNAVAILABLE);
    expect(releases).toContain(UNAVAILABLE);
    expect(downloadLinks(page!)).toEqual([]);
    expect(downloadLinks(releases!)).toEqual([]);
    expect((await fetchDownload(SETUP)).status).toBe(503);
    expect(mockPresign).not.toHaveBeenCalled();
  });

  it("offer the newest release, Windows first for a Windows visitor", async () => {
    storeHasSignedList();
    const html = renderToStaticMarkup(await DesktopRoute());
    expect(html).toContain("Test release 0.1.0-rc.2");
    expect(html).toContain(`aria-label="Download for Windows: ${SETUP}"`);
    expect(html).toContain(
      "Windows, 64-bit Intel or AMD · 86.0 MB"
    );
    expect(html.indexOf("Download for Windows")).toBeLessThan(
      html.indexOf("Also available:")
    );
    expect(html).toContain(`aria-label="Download for Mac: ${DMG}"`);
    const links = downloadLinks(html);
    expect(
      links.every((link) => link.startsWith("/desktop/download/0.1.0-rc.2/"))
    ).toBe(true);
    expect(html).not.toContain("0.1.0-rc.1");
    expect(html).toContain("Second signed build.");
  });

  it("offer the Mac app first for a Mac visitor", async () => {
    mockUserAgent = MAC_UA;
    storeHasSignedList();
    const html = renderToStaticMarkup(await DesktopRoute());
    expect(html).toContain("Mac with Apple silicon · 161.2 MB");
    expect(html.indexOf("Download for Mac")).toBeLessThan(
      html.indexOf("Also available:")
    );
  });

  it("offer both installers to a visitor on another system", async () => {
    mockUserAgent = LINUX_UA;
    storeHasSignedList();
    const html = renderToStaticMarkup(await DesktopRoute());
    expect(html).not.toContain("Also available:");
    expect(html).toContain("Download for Windows");
    expect(html).toContain("Download for Mac");
    expect(html).toContain("There is no Linux version yet. It comes later.");
  });

  it("tell a phone visitor which computers it runs on", async () => {
    mockUserAgent =
      "Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.0 Mobile/15E148 Safari/604.1";
    storeHasSignedList();
    const html = renderToStaticMarkup(await DesktopRoute());
    expect(html).toContain(
      "On a phone or tablet, use 6529.io in your browser."
    );
    expect(html).toContain("Download for Windows");
    expect(html).toContain("Download for Mac");
  });

  it("show the release's version, date and signer beside the downloads", async () => {
    storeHasSignedList();
    const html = renderToStaticMarkup(await DesktopRoute());
    expect(html).toMatch(/Version<\/dt><dd[^>]*><span[^>]*>0\.1\.0-rc\.2</);
    expect(html).toMatch(/Published<\/dt><dd[^>]*>November 16, 2026</);
    expect(html).toContain("6529 Collection LLC on Windows");
  });

  it("list every file with its SHA-256, how to check one, and the list's key", async () => {
    storeHasSignedList();
    const html = renderToStaticMarkup(await DesktopRoute());
    for (const file of TEST_LIST.releases[1]!.files) {
      expect(html).toContain(
        `href="/desktop/download/0.1.0-rc.2/${encodeURIComponent(file.name)}"`
      );
      expect(html).toContain(`title="${file.sha256}"`);
    }
    expect(html).toMatch(
      /Release <span[^>]*>0\.1\.0-rc\.2<\/span>, published November 16, 2026, built from commit <span[^>]*>ccccccc<\/span>/
    );
    expect(html).toContain(`Get-FileHash .\\${SETUP}`);
    expect(html).toContain(`shasum -a 256 ${DMG}`);
    expect(html).toContain("signed by 6529 Collection LLC");
    expect(html).toContain('href="/desktop/releases.json"');
    expect(html).toContain('href="/desktop/releases.json.sig"');
    // The test pins its own key in place of the Desktop key.
    expect(html).toContain(TEST_FEED_SIGNING_KEY.address);
    expect(html).toContain("6529 Tech Feedback");
    expect(html).toContain(
      'href="/waves/e933d8d6-0c78-4e8f-aa12-f67d8c11b4dc"'
    );
  });

  it("put the release's file names in the guide", async () => {
    storeHasSignedList();
    const html = renderToStaticMarkup(await DesktopGuideRoute());
    expect(html).toContain(SETUP);
    expect(html).toContain(DMG);
    expect(html).toContain("guide-signature-request.webp");
    expect(html).toContain("The app&#x27;s signature request.");
    expect(html).toContain("guide-first-launch-mac.webp");
    expect(html).toContain("Scan with a phone wallet");
    expect(html).toContain("Use a browser wallet");
    expect(html).toContain("The browser page shows the same two.");
    expect(html).toContain(
      "6529 Desktop does not download or install updates by itself yet,"
    );
  });

  it("list the known issues of the test release", () => {
    const html = renderToStaticMarkup(DesktopKnownIssuesRoute());
    for (const text of [
      "The Windows uninstaller is not signed yet",
      "takes over <code",
      "core6529://",
      "minting, delegation and market trades are not sent to your wallet from the app",
      "There is no Linux version yet. It comes later.",
      "Macs with Apple silicon only",
    ]) {
      expect(html).toContain(text);
    }
  });

  it("list every release under its own anchor, with downloads for the newest only", async () => {
    storeHasSignedList();
    const html = renderToStaticMarkup(await DesktopReleasesRoute());
    expect(html).toContain('id="0.1.0-rc.2"');
    expect(html).toContain('id="0.1.0-rc.1"');
    expect(html.indexOf('id="0.1.0-rc.2"')).toBeLessThan(
      html.indexOf('id="0.1.0-rc.1"')
    );
    expect(html).toContain(`title="${hash("7")}"`);
    const links = downloadLinks(html);
    expect(links).toHaveLength(4);
    expect(
      links.every((link) => link.startsWith("/desktop/download/0.1.0-rc.2/"))
    ).toBe(true);
  });

  it("keep serving the stored list byte for byte at /desktop/releases.json", async () => {
    storeHasSignedList();
    const response = await getList(
      new Request("https://6529.io/desktop/releases.json")
    );
    expect(response.status).toBe(200);
    expect(await response.text()).toBe(`${JSON.stringify(TEST_LIST)}\n`);
  });
});

describe("/desktop/download", () => {
  beforeEach(() => {
    resetDesktopReleaseListCacheForTests();
    mockRead.mockReset();
    mockPresign.mockClear();
    process.env["DESKTOP_RELEASES_BUCKET"] = "desktop-releases";
    storeHasSignedList();
  });

  it("redirects to a presigned URL for an installer of the newest release", async () => {
    const response = await fetchDownload("0.1.0-rc.2", SETUP);
    expect(response.status).toBe(302);
    expect(response.headers.get("cache-control")).toBe("no-store");
    expect(response.headers.get("referrer-policy")).toBe("no-referrer");
    expect(mockPresign).toHaveBeenCalledWith(
      { bucket: "desktop-releases", region: "us-east-1" },
      `releases/0.1.0-rc.2/${SETUP}`,
      expect.objectContaining({
        expiresInSeconds: 300,
        responseParams: {
          "response-content-disposition": `attachment; filename="${SETUP}"`,
        },
      })
    );
    expect(response.headers.get("location")).toContain(
      `releases/0.1.0-rc.2/${SETUP}`
    );
  });

  it("opens SHA256SUMS in the browser", async () => {
    expect((await fetchDownload("SHA256SUMS")).status).toBe(302);
    expect(mockPresign.mock.calls[0]![2].responseParams).toEqual({
      "response-content-type": "text/plain; charset=utf-8",
      "response-content-disposition": "inline",
    });
  });

  it.each([
    [["0.1.0-rc.1", "6529-Desktop_0.1.0-rc.1_windows-x64-setup.exe"]],
    [["not-listed.exe"]],
    [["..%2Ffeed%2Freleases.bundle.json"]],
    [["0.1.0-rc.2", "..", "feed", "releases.bundle.json"]],
    [["%E0%A4%A"]],
  ])("answers 404 without presigning for %j", async (path) => {
    const response = await fetchDownload(...path);
    expect(response.status).toBe(404);
    expect(response.headers.get("x-robots-tag")).toBe("noindex, nofollow");
    expect(mockPresign).not.toHaveBeenCalled();
  });
});
