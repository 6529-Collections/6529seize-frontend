/** @jest-environment node */
import type { AiBucketObject } from "@/lib/ai-page/releasesBucket";

import {
  aiList,
  listBytes,
  signedBundle,
} from "../release-section/listSigning";
import { AI_TEST_FEED, feedBytes } from "./fixtures";
import { signAiFeed } from "./feedSigning";

const mockRead = jest.fn<Promise<AiBucketObject>, [string]>();

jest.mock("@/lib/ai-page/releasesBucket", () => ({
  AI_FEED_OBJECT_KEY: "feed/releases.json",
  AI_FEED_SIGNATURE_OBJECT_KEY: "feed/releases.json.sig",
  getAiReleaseObjectKey: (version: string, name: string) =>
    `releases/${version}/${name}`,
  readAiReleaseObject: (key: string) => mockRead(key),
  presignAiReleaseObject: async (key: string) =>
    `https://bucket.example/${key}`,
}));
// The Ed25519 test key stands in for 6529 AI's; the list of format 1 keeps
// the keys this site ships with.
jest.mock("@/lib/ai-page/feedSigningKeys", () => ({
  AI_FEED_SIGNING_KEYS: [jest.requireActual("./feedSigning").TEST_AI_FEED_KEY],
}));

import { GET as feedRoute } from "@/app/ai/releases.json/route";
import {
  getAiReleaseFeedSnapshot,
  resetAiReleaseFeedCacheForTests,
} from "@/lib/ai-page/releaseFeed";
import { AI_RELEASE_LIST_KEYS } from "@/lib/ai-page/releaseListKeys";

const LEGACY_FEED = feedBytes(AI_TEST_FEED);

function found(body: Uint8Array<ArrayBuffer>): AiBucketObject {
  return { state: "found", body, etag: '"e"', lastModified: null };
}

describe("6529 AI's trusted keys for the list of format 1", () => {
  beforeEach(() => {
    resetAiReleaseFeedCacheForTests();
    jest.spyOn(console, "warn").mockImplementation(() => undefined);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it("are none until the owner approves 6529 AI's release-list key", () => {
    expect(AI_RELEASE_LIST_KEYS).toEqual([]);
  });

  it("so a bundle never verifies, and /ai stays on the Ed25519 feed", async () => {
    const objects: Record<string, AiBucketObject> = {
      "feed/releases.json": found(LEGACY_FEED),
      "feed/releases.json.sig": found(signAiFeed(LEGACY_FEED)),
      "feed/releases.bundle.json": found(signedBundle(listBytes(aiList()))),
    };
    mockRead.mockImplementation(
      async (key) => objects[key] ?? { state: "missing" }
    );

    const feed = await feedRoute(
      new Request("https://6529.io/ai/releases.json")
    );
    const snapshot = await getAiReleaseFeedSnapshot();

    expect(new Uint8Array(await feed.arrayBuffer())).toEqual(LEGACY_FEED);
    expect(snapshot.source).toBe("ed25519");
    expect(snapshot.releases[0]?.version).toBe("0.1.0");
  });
});
