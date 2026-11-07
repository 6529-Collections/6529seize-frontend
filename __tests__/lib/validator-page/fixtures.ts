const hash = (digit: string) => digit.repeat(64);

/** A feed entry in the shape FEED-LOCATION documents; all values made up. */
export const TEST_RELEASE_ENTRY = {
  version: "0.1.0-test.2",
  channel: "test",
  published_at: "2026-11-02T09:00:00Z",
  commit: "a".repeat(40),
  software_id: "0x1234",
  notes: "Second test build.",
  files: [
    { name: "6529-Validator-0.1.0.dmg", size: 55_073_145, sha256: hash("1") },
    {
      name: "6529-Validator-Setup-0.1.0-x64.exe",
      size: 18_900_000,
      sha256: hash("c"),
    },
    {
      name: "6529-Validator-0.1.0-x64.msi",
      size: 18_116_608,
      sha256: hash("2"),
    },
    {
      name: "6529-validator_0.1.0_amd64.deb",
      size: 16_578_498,
      sha256: hash("3"),
    },
    {
      name: "6529-validator_0.1.0_arm64.deb",
      size: 15_407_512,
      sha256: hash("4"),
    },
    {
      name: "6529-Validator-0.1.0-x86_64.AppImage",
      size: 25_344_504,
      sha256: hash("5"),
    },
    {
      name: "validator-0.1.0-aarch64-apple-darwin.tar.gz",
      size: 23_358_871,
      sha256: hash("6"),
    },
    {
      name: "validator-0.1.0-x86_64-pc-windows-msvc.zip",
      size: 22_023_603,
      sha256: hash("7"),
    },
    {
      name: "validator-0.1.0-x86_64-unknown-linux-gnu.tar.gz",
      size: 26_746_343,
      sha256: hash("8"),
    },
    { name: "SHA256SUMS", size: 1_119, sha256: hash("9") },
    { name: "release.json", size: 2_581, sha256: hash("a") },
  ],
};

export const TEST_FEED = {
  format: 1,
  releases: [
    {
      version: "0.1.0-test.1",
      channel: "test",
      date: "2026-11-01",
      files: { "6529-Validator-0.1.0.dmg": { bytes: 10, sha256: hash("b") } },
    },
    TEST_RELEASE_ENTRY,
  ],
};

/**
 * A release in the shape the validator signs (a day, no time), with
 * TEST_RELEASE_ENTRY's file names. Every candidate of 0.1.0 is built as
 * 0.1.0, so a release and its candidates share file names.
 */
export function feedEntry(version: string, channel: string, date: string) {
  return {
    version,
    channel,
    date,
    commit: "e".repeat(40),
    software_id: `0x${hash("e")}`,
    notes: `Made-up notes for ${version}.`,
    files: TEST_RELEASE_ENTRY.files,
  };
}

/** 0.1.0 and its last candidate, out on the same day, newest first. */
export const SAME_DAY_FEED = {
  format: 1,
  releases: [
    feedEntry("0.1.0", "stable", "2026-11-20"),
    feedEntry("0.1.0-rc.7", "test", "2026-11-20"),
  ],
};

/** rc.9's commit, as the cut names it; fill-rc9.sh changes it on a recut. */
export const RC9_COMMIT_FULL = "d5457d60c72d05b520920cd94de90f38ce0325f3";

/** rc.9's reasons, as 6529 means to sign them. */
export const RC9_URGENT_REASON =
  "Signed TDH starts again on Sunday 8 November, 00:00 UTC, with the zero and dead addresses in the total. Update before then.";
export const RC9_DEADLINE_REASON =
  "From Sunday 8 November, 00:00 UTC, signed TDH counts only on the new chain, which 0.1.0-rc.9 runs.";
export const RC9_UNSAFE_REASON =
  "Its daily total leaves out the zero and dead addresses. From 8 November its signatures don't count.";

/**
 * rc.9's feed as 6529 means to sign it: rc.9 urgent, rc.5 to rc.8 unsafe,
 * and the support line moved to rc.9 from Sunday. Hashes and IDs made up.
 */
export const RC9_FEED = {
  format: 1,
  sequence: 9,
  published: "2026-11-06T12:00:00Z",
  min_supported: "0.1.0-rc.9",
  deadline: "2026-11-08T00:00:00Z",
  deadline_reason: RC9_DEADLINE_REASON,
  unsafe_versions: ["0.1.0-rc.8", "0.1.0-rc.7", "0.1.0-rc.6", "0.1.0-rc.5"].map(
    (version) => ({ version, reason: RC9_UNSAFE_REASON })
  ),
  releases: [
    {
      ...feedEntry("0.1.0-rc.9", "test", "2026-11-06"),
      commit: RC9_COMMIT_FULL,
      severity: "urgent",
      reason: RC9_URGENT_REASON,
    },
    feedEntry("0.1.0-rc.8", "test", "2026-11-06"),
    feedEntry("0.1.0-rc.7", "test", "2026-11-05"),
  ],
};

/** rc.10's commit, as the cut names it; fill-rc10.sh changes it on a recut. */
export const RC10_COMMIT_FULL = "f0a3440a108e810b6e4323672da61e5116993885";

/**
 * rc.10's feed as 6529 means to sign it: rc.10 of normal severity above
 * rc.9, which stays urgent, the support line moved to rc.9 from Sunday, and
 * nothing unsafe. Hashes and IDs made up.
 */
export const RC10_FEED = {
  ...RC9_FEED,
  sequence: 10,
  unsafe_versions: [],
  releases: [
    {
      ...feedEntry("0.1.0-rc.10", "test", "2026-11-07"),
      commit: RC10_COMMIT_FULL,
      severity: "normal",
    },
    ...RC9_FEED.releases,
  ],
};
