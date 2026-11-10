/** @jest-environment node */
import { renderToStaticMarkup } from "react-dom/server";

import type { BucketObject } from "@/lib/validator-page/releasesBucket";
import { SAME_DAY_FEED } from "./fixtures";

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
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Safari/537.36",
    }),
}));

jest.mock("next/server", () => ({
  ...jest.requireActual("next/server"),
  connection: async () => undefined,
}));

import ValidatorRoute from "@/app/validator/page";
import ValidatorReleasesRoute from "@/app/validator/releases/page";
import { resolveReleaseDownload } from "@/lib/validator-page/releaseDownload";
import { resetReleaseFeedCacheForTests } from "@/lib/validator-page/releaseFeed";

const SETUP = "6529-Validator-Setup-0.1.0-x64.exe";

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

describe("a release and its candidate from the same day", () => {
  beforeAll(() => {
    process.env["VALIDATOR_PAGE_PUBLIC"] = "true";
  });

  afterAll(() => {
    delete process.env["VALIDATOR_PAGE_PUBLIC"];
  });

  beforeEach(() => {
    resetReleaseFeedCacheForTests();
    mockPresign.mockClear();
    const body = new TextEncoder().encode(JSON.stringify(SAME_DAY_FEED));
    mockRead.mockImplementation(async (key) =>
      key === "feed/releases.json"
        ? { state: "found", body, etag: '"e"', lastModified: null }
        : { state: "missing" }
    );
  });

  it("the download page offers only the release", async () => {
    const html = renderToStaticMarkup(await ValidatorRoute());
    expect(html).toContain(`href="/validator/download/0.1.0/${SETUP}"`);
    expect(linkedVersions(html)).toEqual(["0.1.0"]);
    expect(html).not.toContain("0.1.0-rc.7");
  });

  it("the releases page marks the release Latest and lists the candidate below it", async () => {
    const html = renderToStaticMarkup(await ValidatorReleasesRoute());
    const release = html.indexOf('id="0.1.0"');
    const latest = html.indexOf(">Latest<");
    const candidate = html.indexOf('id="0.1.0-rc.7"');
    expect(release).toBeGreaterThan(-1);
    expect(latest).toBeGreaterThan(release);
    expect(candidate).toBeGreaterThan(latest);
    expect(html.split(">Latest<")).toHaveLength(2);
    // Only the newest release has download buttons.
    expect(linkedVersions(html)).toEqual(["0.1.0"]);
  });

  it("downloads hand out the release's files, never the candidate's", async () => {
    for (const path of [[SETUP], ["0.1.0", SETUP]]) {
      expect(await resolveReleaseDownload(path)).toEqual({
        state: "found",
        url: `https://bucket.example/releases/0.1.0/${SETUP}`,
      });
    }
    expect(await resolveReleaseDownload(["0.1.0-rc.7", SETUP])).toEqual({
      state: "not-found",
    });
  });
});
