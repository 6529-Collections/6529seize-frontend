/** @jest-environment node */
import { renderToStaticMarkup } from "react-dom/server";

import type { BucketObject } from "@/lib/validator-page/releasesBucket";
import {
  RC10_COMMIT_FULL,
  RC10_FEED,
  RC9_COMMIT_FULL,
  RC9_DEADLINE_REASON,
  RC9_FEED,
  RC9_UNSAFE_REASON,
  RC9_URGENT_REASON,
  SAME_DAY_FEED,
} from "./fixtures";
import { signFeed } from "./feedSigning";

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
jest.mock("@/lib/validator-page/feedSigningKeys", () => ({
  FEED_SIGNING_KEYS: [
    jest.requireActual("./feedSigning").TEST_FEED_SIGNING_KEY,
  ],
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
      : {
          state: "found",
          body: signFeed(body),
          etag: '"s"',
          lastModified: null,
        }
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
  });

  it("names the full version in the heading and under the download button", async () => {
    const html = renderToStaticMarkup(await ValidatorRoute());
    expect(text(html)).toContain("Test release 0.1.0-rc.9 ");
    expect(html).toMatch(
      /Download for Mac<\/a><p[^>]*><span[^>]*>0\.1\.0-rc\.9<\/span> · macOS 11 or newer/
    );
    // The file names stay 0.1.0's.
    expect(html).toContain(`href="/validator/download/0.1.0-rc.9/${DMG}"`);
  });

  it("shows no note for rc.10 while rc.9 is offered", async () => {
    const html = renderToStaticMarkup(await ValidatorRoute());
    expect(html).not.toContain('id="upgrading"');
    expect(html).not.toContain('id="sundays-switch"');
  });

  it("the releases page marks rc.8 and rc.7 unsafe, with the reason, and offers only rc.9", async () => {
    const html = renderToStaticMarkup(await ValidatorReleasesRoute());
    const entries = html.split("<article").slice(1);
    expect(entries).toHaveLength(3);
    // Each entry is headed by its full version.
    expect(
      entries.map((entry) => /<h2[^>]*>([^<]+)<\/h2>/.exec(entry)?.[1])
    ).toEqual(["0.1.0-rc.9", "0.1.0-rc.8", "0.1.0-rc.7"]);
    const [rc9, rc8, rc7] = entries.map(text);
    expect(rc9).toContain(RC9_COMMIT_FULL);
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
    expect(text(html)).toContain(" Test release 6529 Validator ");
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
    expect(text(download)).toContain(" Test release 0.1.0 6529 Validator ");
    expect(download).not.toContain('id="urgent"');
    expect(download).not.toContain("urgent update");
    const releases = renderToStaticMarkup(await ValidatorReleasesRoute());
    expect(releases).not.toContain("Unsafe");
  });
});

describe("rc.10's feed: rc.10 of normal severity above an urgent rc.9", () => {
  beforeEach(() => serveFeed(RC10_FEED));

  it("the download page offers rc.10 with no urgent notice, and links the setup guide", async () => {
    const html = renderToStaticMarkup(await ValidatorRoute());
    expect(linkedVersions(html)).toEqual(["0.1.0-rc.10"]);
    expect(text(html)).toContain("Test release 0.1.0-rc.10 ");
    expect(html).not.toContain('id="urgent"');
    expect(html).toContain('href="/validator/guide"');
    // The old tester notes are gone from the page.
    expect(html).not.toContain('id="sundays-switch"');
    expect(html).not.toContain('id="upgrading"');
  });

  it("the guide's start page leads with the paths to choose from", async () => {
    const html = renderToStaticMarkup(await ValidatorGuideRoute());
    expect(text(html)).toContain("Set up a 6529 validator");
    const paths = html.indexOf('id="choose-your-path"');
    expect(paths).toBeGreaterThan(-1);
    expect(
      html.indexOf('href="/validator/guide/your-computer"')
    ).toBeGreaterThan(paths);
    expect(html).toContain('href="/validator/guide/home-box"');
  });

  it("the releases page marks rc.10 Latest and offers only rc.10", async () => {
    const html = renderToStaticMarkup(await ValidatorReleasesRoute());
    const entries = html.split("<article").slice(1).map(text);
    expect(entries[0]).toContain("0.1.0-rc.10");
    expect(entries[0]).toContain("Latest");
    expect(entries[0]).toContain(RC10_COMMIT_FULL);
    expect(html).not.toContain("Unsafe");
    expect(linkedVersions(html)).toEqual(["0.1.0-rc.10"]);
  });
});
