/** @jest-environment node */
import { parseReleaseFeed } from "@/lib/validator-page/releaseFeed";
import { TEST_FEED, TEST_RELEASE_ENTRY } from "./fixtures";

describe("parseReleaseFeed", () => {
  it("reads both file shapes and sorts newest first", () => {
    const releases = parseReleaseFeed(TEST_FEED);
    expect(releases.map((release) => release.version)).toEqual([
      "0.1.0-test.2",
      "0.1.0-test.1",
    ]);
    const [latest, first] = releases;
    expect(latest).toMatchObject({
      channel: "test",
      publishedAt: "2026-11-02T09:00:00Z",
      commit: "a".repeat(40),
      softwareId: "0x1234",
      notes: "Second test build.",
    });
    expect(latest?.files).toHaveLength(TEST_RELEASE_ENTRY.files.length);
    expect(first?.files).toEqual([
      { name: "6529-Validator-0.1.0.dmg", size: 10, sha256: "b".repeat(64) },
    ]);
  });

  it("drops entries and files it cannot use", () => {
    const releases = parseReleaseFeed({
      releases: [
        { ...TEST_RELEASE_ENTRY, version: "../etc" },
        { ...TEST_RELEASE_ENTRY, version: "0.1.0-test.3", channel: "" },
        {
          ...TEST_RELEASE_ENTRY,
          version: "0.1.0-test.4",
          published_at: "soon",
        },
        {
          ...TEST_RELEASE_ENTRY,
          version: "0.1.0-test.5",
          commit: "not a commit",
          files: [
            { name: "../secret", sha256: "1".repeat(64) },
            { name: "ok.zip", sha256: "XYZ" },
            { name: "good.zip", sha256: "C".repeat(64), size: -1 },
            { name: "good.zip", sha256: "d".repeat(64) },
          ],
        },
        TEST_RELEASE_ENTRY,
        "not an object",
      ],
    });
    expect(releases.map((release) => release.version)).toEqual([
      "0.1.0-test.5",
      "0.1.0-test.2",
    ]);
    expect(releases[0]?.commit).toBeNull();
    expect(releases[0]?.files).toEqual([
      { name: "good.zip", size: null, sha256: "c".repeat(64) },
    ]);
  });

  it("returns nothing for JSON that is not a feed", () => {
    expect(parseReleaseFeed(null)).toEqual([]);
    expect(parseReleaseFeed({ releases: "x" })).toEqual([]);
    expect(parseReleaseFeed([TEST_RELEASE_ENTRY])).toHaveLength(1);
  });
});
