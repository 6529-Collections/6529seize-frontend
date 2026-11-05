/** @jest-environment node */
import { parseReleaseFeed } from "@/lib/validator-page/releaseFeed";
import {
  feedEntry,
  SAME_DAY_FEED,
  TEST_FEED,
  TEST_RELEASE_ENTRY,
} from "./fixtures";

const versionsOf = (json: unknown) =>
  parseReleaseFeed(json).map((release) => release.version);

// Lowest first: the validator's own list (crates/releases/src/version.rs)
// with Semantic Versioning's example.
const VALIDATOR_ORDER = [
  "0.0.9",
  "0.1.0-alpha",
  "0.1.0-rc.1",
  "0.1.0-rc.2",
  "0.1.0-rc.4",
  "0.1.0-rc.5",
  "0.1.0-rc.10",
  "0.1.0-rc.10.1",
  "0.1.0",
  "0.1.1-rc.1",
  "0.1.1",
  "0.1.10",
  "0.2.0",
  "1.0.0-alpha",
  "1.0.0-alpha.1",
  "1.0.0-alpha.beta",
  "1.0.0-beta",
  "1.0.0-beta.2",
  "1.0.0-beta.11",
  "1.0.0-rc.1",
  "1.0.0",
];

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

  it("puts a release above its candidate from the same day", () => {
    expect(versionsOf(SAME_DAY_FEED)).toEqual(["0.1.0", "0.1.0-rc.7"]);
    expect(
      versionsOf({ releases: [...SAME_DAY_FEED.releases].reverse() })
    ).toEqual(["0.1.0", "0.1.0-rc.7"]);
  });

  it("orders releases by version, whatever their dates", () => {
    // Dates and versions agree.
    expect(
      versionsOf({
        releases: [
          feedEntry("0.1.0-rc.6", "test", "2026-11-04"),
          feedEntry("0.1.0", "stable", "2026-11-05"),
        ],
      })
    ).toEqual(["0.1.0", "0.1.0-rc.6"]);
    // Dates run the other way: each version is a day older than the one
    // below it.
    const backdated = VALIDATOR_ORDER.map((version, index) =>
      feedEntry(version, "test", `2026-12-${String(31 - index)}`)
    );
    expect(versionsOf({ releases: backdated })).toEqual(
      [...VALIDATOR_ORDER].reverse()
    );
  });

  it("drops versions the validator refuses", () => {
    const refused = [
      "0.1",
      "0.1.0.1",
      "v0.1.0",
      "01.1.0",
      "0.1.0-",
      "0.1.0-rc..1",
      "0.1.0-rc.01",
      "0.1.0+abc",
      "0.1.x",
      "0.1.0-r c",
      "18446744073709551616.0.0",
      `0.1.0-${"a".repeat(59)}`,
    ];
    expect(
      versionsOf({
        releases: [
          ...refused.map((version) => feedEntry(version, "test", "2026-11-20")),
          feedEntry("0.1.0-rc.7", "test", "2026-11-20"),
          feedEntry("18446744073709551615.0.0", "test", "2026-11-20"),
          feedEntry(`0.1.0-${"a".repeat(58)}`, "test", "2026-11-20"),
        ],
      })
    ).toEqual([
      "18446744073709551615.0.0",
      "0.1.0-rc.7",
      `0.1.0-${"a".repeat(58)}`,
    ]);
  });

  it("returns nothing for JSON that is not a feed", () => {
    expect(parseReleaseFeed(null)).toEqual([]);
    expect(parseReleaseFeed({ releases: "x" })).toEqual([]);
    expect(parseReleaseFeed([TEST_RELEASE_ENTRY])).toHaveLength(1);
  });
});
