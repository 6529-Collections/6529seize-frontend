/** @jest-environment node */
import type { BucketObject } from "@/lib/validator-page/releasesBucket";
import { TWO_CHANNEL_FEED } from "./fixtures";

const mockRead = jest.fn<Promise<BucketObject>, [string]>();

// The real presigning, with made-up credentials and bucket; only the reads
// from S3 are mocked.
jest.mock("@/lib/validator-page/releasesBucket", () => ({
  ...jest.requireActual("@/lib/validator-page/releasesBucket"),
  readReleaseObject: (key: string) => mockRead(key),
}));

jest.mock("@/lib/validator-page/awsCredentials", () => ({
  getAwsCredentials: async () => ({
    accessKeyId: "TESTKEYID",
    secretAccessKey: "test-secret",
    sessionToken: undefined,
  }),
}));

jest.mock("next/headers", () => ({
  cookies: async () => ({ get: () => undefined }),
}));

import { GET } from "@/app/validator/download/[...path]/route";
import { resetReleaseFeedCacheForTests } from "@/lib/validator-page/releaseFeed";

const DMG = "6529-Validator-0.1.0.dmg";
const ENV = [
  "VALIDATOR_PAGE_PUBLIC",
  "VALIDATOR_PAGE_PASSWORD",
  "VALIDATOR_RELEASES_BUCKET",
  "VALIDATOR_RELEASES_REGION",
] as const;

function serveFeed(feed: unknown) {
  const body = new TextEncoder().encode(JSON.stringify(feed));
  mockRead.mockImplementation(async (key) =>
    key === "feed/releases.json"
      ? { state: "found", body, etag: '"e"', lastModified: null }
      : { state: "missing" }
  );
}

async function download(...path: string[]): Promise<Response> {
  return GET(
    new Request(`https://6529.io/validator/download/${path.join("/")}`),
    { params: Promise.resolve({ path }) }
  );
}

beforeEach(() => {
  resetReleaseFeedCacheForTests();
  process.env["VALIDATOR_PAGE_PUBLIC"] = "true";
  process.env["VALIDATOR_RELEASES_BUCKET"] = "example-releases";
  process.env["VALIDATOR_RELEASES_REGION"] = "us-east-1";
  serveFeed(TWO_CHANNEL_FEED);
});

afterEach(() => {
  for (const name of ENV) {
    delete process.env[name];
  }
});

describe("GET /validator/download/<version>/<file>", () => {
  // From rc.10 the validator's in-app update builds this path from the
  // signed feed and follows the redirect. Releases already installed depend
  // on its shape: never change it.
  it("answers 302 with an https presigned URL for the file, valid five minutes", async () => {
    const response = await download("0.1.1-rc.1", DMG);
    expect(response.status).toBe(302);
    expect(response.headers.get("Cache-Control")).toBe("no-store");
    const location = new URL(response.headers.get("Location") ?? "");
    expect(location.protocol).toBe("https:");
    expect(location.host).toBe("example-releases.s3.us-east-1.amazonaws.com");
    expect(location.pathname).toBe(`/releases/0.1.1-rc.1/${DMG}`);
    expect(location.searchParams.get("X-Amz-Expires")).toBe("300");
    expect(location.searchParams.get("X-Amz-Signature")).toMatch(
      /^[0-9a-f]{64}$/
    );
    expect(location.searchParams.get("response-content-disposition")).toBe(
      `attachment; filename="${DMG}"`
    );
  });

  it("serves a stable build the newest stable release while a newer candidate is listed", async () => {
    const response = await download("0.1.0", DMG);
    expect(response.status).toBe(302);
    expect(new URL(response.headers.get("Location") ?? "").pathname).toBe(
      `/releases/0.1.0/${DMG}`
    );
  });

  it("answers 404 for a release no build is offered, and for a file the release doesn't list", async () => {
    expect((await download("0.1.0-rc.9", DMG)).status).toBe(404);
    expect((await download("0.1.1-rc.1", "not-a-file.bin")).status).toBe(404);
    expect((await download("..", DMG)).status).toBe(404);
  });

  it("gives /validator/download/<file> the release the pages offer", async () => {
    const response = await download(DMG);
    expect(response.status).toBe(302);
    expect(new URL(response.headers.get("Location") ?? "").pathname).toBe(
      `/releases/0.1.1-rc.1/${DMG}`
    );
  });

  it("applies the unsafe list to each channel on its own", async () => {
    serveFeed({
      ...TWO_CHANNEL_FEED,
      unsafe_versions: [{ version: "0.1.0", reason: "Made up for a test." }],
    });
    expect((await download("0.1.0", DMG)).status).toBe(404);
    expect((await download("0.1.1-rc.1", DMG)).status).toBe(302);

    resetReleaseFeedCacheForTests();
    serveFeed({
      ...TWO_CHANNEL_FEED,
      unsafe_versions: [
        { version: "0.1.1-rc.1", reason: "Made up for a test." },
      ],
    });
    expect((await download("0.1.1-rc.1", DMG)).status).toBe(404);
    expect((await download("0.1.0", DMG)).status).toBe(302);
    // The pages then offer the stable release.
    expect(
      new URL((await download(DMG)).headers.get("Location") ?? "").pathname
    ).toBe(`/releases/0.1.0/${DMG}`);
  });

  it("still asks for the password when the pages are not public", async () => {
    delete process.env["VALIDATOR_PAGE_PUBLIC"];
    process.env["VALIDATOR_PAGE_PASSWORD"] = "test-only-password-5";
    const response = await download("0.1.1-rc.1", DMG);
    expect(response.status).toBe(401);
    expect(response.headers.get("Location")).toBeNull();
  });
});
