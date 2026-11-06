/** @jest-environment node */
import { renderToStaticMarkup } from "react-dom/server";

import type { BucketObject } from "@/lib/validator-page/releasesBucket";
import {
  RC9_DEADLINE_REASON,
  RC9_FEED,
  RC9_UNSAFE_REASON,
  RC9_URGENT_REASON,
  SAME_DAY_FEED,
} from "./fixtures";

const mockRead = jest.fn<Promise<BucketObject>, [string]>();
const mockPresign = jest.fn(
  async (key: string) => `https://bucket.example/${key}`
);

jest.mock("@/lib/validator-page/releasesBucket", () => ({
  FEED_OBJECT_KEY: "feed/releases.json",
  FEED_SIGNATURE_OBJECT_KEY: "feed/releases.json.sig",
  getReleaseObjectKey: (version: string, name: string) =>
    `releases/${version}/${name}`,
  readReleaseObject: (key: string) => mockRead(key),
  presignReleaseObject: (key: string) => mockPresign(key),
}));

jest.mock("next/headers", () => ({
  cookies: async () => ({ get: () => undefined }),
  headers: async () =>
    new Headers({
      "user-agent":
        "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Safari/537.36",
    }),
}));

jest.mock("next/server", () => ({
  ...jest.requireActual("next/server"),
  connection: async () => undefined,
}));

import ValidatorRoute from "@/app/validator/page";
import ValidatorGuideRoute from "@/app/validator/guide/page";
import ValidatorReleasesRoute from "@/app/validator/releases/page";
import { resolveReleaseDownload } from "@/lib/validator-page/releaseDownload";
import { resetReleaseFeedCacheForTests } from "@/lib/validator-page/releaseFeed";

const DMG = "6529-Validator-0.1.0.dmg";

/** The page's text as a reader sees it: tags out, entities read. */
function text(html: string): string {
  return html
    .replaceAll(/<[^>]+>/g, " ")
    .replaceAll("&#x27;", "'")
    .replaceAll("&quot;", '"')
    .replaceAll("&amp;", "&")
    .replaceAll(/\s+/g, " ");
}

/** The version each download link on the page names. */
function linkedVersions(html: string): string[] {
  return [
    ...new Set(
      [...html.matchAll(/href="\/validator\/download\/([^"/]+)\//g)].map(
        (match) => match[1] ?? ""
      )
    ),
  ];
}

function serveFeed(feed: unknown) {
  const body = new TextEncoder().encode(JSON.stringify(feed));
  mockRead.mockImplementation(async (key) =>
    key === "feed/releases.json"
      ? { state: "found", body, etag: '"e"', lastModified: null }
      : { state: "missing" }
  );
}

beforeAll(() => {
  process.env["VALIDATOR_PAGE_PUBLIC"] = "true";
});

afterAll(() => {
  delete process.env["VALIDATOR_PAGE_PUBLIC"];
});

beforeEach(() => {
  resetReleaseFeedCacheForTests();
  mockPresign.mockClear();
});

describe("rc.9's feed: rc.9 urgent, rc.5 to rc.8 unsafe", () => {
  beforeEach(() => serveFeed(RC9_FEED));

  it("the download page says why rc.9 is urgent, and the deadline, above the download", async () => {
    const html = renderToStaticMarkup(await ValidatorRoute());
    const page = text(html);
    expect(page).toContain("0.1.0-rc.9 is an urgent update");
    expect(page).toContain(RC9_URGENT_REASON);
    expect(page).toContain(
      "If you run a release before 0.1.0-rc.9, update by 2026-11-08 00:00 UTC."
    );
    expect(page).toContain(RC9_DEADLINE_REASON);
    const notice = html.indexOf('id="urgent"');
    const download = html.indexOf(
      `href="/validator/download/0.1.0-rc.9/${DMG}"`
    );
    expect(notice).toBeGreaterThan(-1);
    expect(download).toBeGreaterThan(notice);
    expect(linkedVersions(html)).toEqual(["0.1.0-rc.9"]);
    // rc.9's notes for testers on rc.8.
    expect(html).toContain('id="upgrading"');
    expect(page).toContain("Upgrading from rc.8");
  });

  it("the guide opens with Sunday's switch, then the upgrade from rc.8", async () => {
    const html = renderToStaticMarkup(await ValidatorGuideRoute());
    const sunday = html.indexOf('id="update-before-sunday"');
    const upgrade = html.indexOf('id="upgrading"');
    expect(sunday).toBeGreaterThan(-1);
    expect(upgrade).toBeGreaterThan(sunday);
    expect(text(html)).toContain("Update before Sunday 8 November, 00:00 UTC");
  });

  it("the releases page marks rc.8 and rc.7 unsafe, with the reason, and offers only rc.9", async () => {
    const html = renderToStaticMarkup(await ValidatorReleasesRoute());
    const entries = html.split("<article").slice(1);
    expect(entries).toHaveLength(3);
    const [rc9, rc8, rc7] = entries.map(text);
    expect(rc9).toContain("Latest");
    expect(rc9).not.toContain("Unsafe");
    for (const entry of [rc8, rc7]) {
      expect(entry).toContain("Unsafe");
      expect(entry).toContain(`Unsafe to run: ${RC9_UNSAFE_REASON}`);
      expect(entry).not.toContain("Latest");
      expect(entry).not.toContain("Download");
    }
    expect(linkedVersions(html)).toEqual(["0.1.0-rc.9"]);
  });
});

describe("a feed whose newest release is listed as unsafe", () => {
  beforeEach(() =>
    serveFeed({
      ...RC9_FEED,
      unsafe_versions: [
        ...RC9_FEED.unsafe_versions,
        { version: "0.1.0-rc.9", reason: "Made-up reason for a test." },
      ],
    })
  );

  it("the download page offers nothing and says why", async () => {
    const html = renderToStaticMarkup(await ValidatorRoute());
    expect(linkedVersions(html)).toEqual([]);
    expect(html).not.toContain('id="urgent"');
    expect(text(html)).toContain(
      "The newest release, 0.1.0-rc.9, is listed as unsafe to run, so it isn't offered here. Made-up reason for a test."
    );
  });

  it("the releases page marks it unsafe and never as the one to download", async () => {
    const html = renderToStaticMarkup(await ValidatorReleasesRoute());
    expect(html).not.toContain(">Latest<");
    expect(linkedVersions(html)).toEqual([]);
    expect(text(html.split("<article")[1] ?? "")).toContain(
      "Unsafe to run: Made-up reason for a test."
    );
  });

  it("its files are not handed out", async () => {
    for (const path of [[DMG], ["0.1.0-rc.9", DMG]]) {
      expect(await resolveReleaseDownload(path)).toEqual({
        state: "not-found",
      });
    }
    expect(mockPresign).not.toHaveBeenCalled();
  });
});

describe("a feed with no urgent release", () => {
  beforeEach(() => serveFeed(SAME_DAY_FEED));

  it("shows no notice and marks nothing unsafe", async () => {
    const download = renderToStaticMarkup(await ValidatorRoute());
    expect(download).not.toContain('id="urgent"');
    expect(download).not.toContain("urgent update");
    const releases = renderToStaticMarkup(await ValidatorReleasesRoute());
    expect(releases).not.toContain("Unsafe");
  });
});
