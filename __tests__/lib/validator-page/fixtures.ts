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
