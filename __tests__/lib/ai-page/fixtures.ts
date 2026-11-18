const hash = (digit: string) => digit.repeat(64);

export const MAC_SIGNER =
  "Developer ID Application: 6529 Collection LLC, notarized by Apple";
export const WINDOWS_SIGNER = "6529 Collection LLC";

/** A release in the feed's shape (ai-feed-format v1); all values made up. */
export function aiFeedEntry(version: string, date = "2026-11-17") {
  return {
    version,
    date,
    commit: "c".repeat(40),
    channel: "test",
    notes: `Made-up notes for ${version}.`,
    files: [
      {
        name: `6529-ai-${version}-macos-arm64.dmg`,
        system: "macos-arm64",
        sha256: hash("1"),
        size: 95_453_096,
        signed: MAC_SIGNER,
      },
      {
        name: `6529-ai-${version}-windows-x64-setup.exe`,
        system: "windows-x64",
        sha256: hash("2"),
        size: 120_000_000,
        signed: WINDOWS_SIGNER,
      },
      {
        name: `6529-ai_${version}_amd64.deb`,
        system: "linux-x86_64-cpu",
        sha256: hash("3"),
        size: 80_000_000,
        signed: null,
      },
      {
        name: `6529-ai-cuda_${version}_amd64.deb`,
        system: "linux-x86_64-cuda",
        sha256: hash("4"),
        size: 1_200_000_000,
        signed: null,
      },
      {
        name: `6529-ai_${version}_arm64.deb`,
        system: "linux-arm64-cpu",
        sha256: hash("5"),
        size: 75_000_000,
        signed: null,
      },
      {
        name: `6529-ai-${version}-linux-x86_64-cpu.tar.gz`,
        system: "linux-x86_64-cpu",
        sha256: hash("6"),
        size: 80_000_000,
        signed: null,
      },
      {
        name: `6529-ai-${version}-linux-x86_64-cuda.tar.gz`,
        system: "linux-x86_64-cuda",
        sha256: hash("7"),
        size: 1_200_000_000,
        signed: null,
      },
      {
        name: `6529-ai-${version}-linux-arm64-cpu.tar.gz`,
        system: "linux-arm64-cpu",
        sha256: hash("8"),
        size: 75_000_000,
        signed: null,
      },
      {
        name: "SHA256SUMS",
        system: null,
        sha256: hash("9"),
        size: 900,
        signed: null,
      },
      {
        name: "SHA256SUMS.sig",
        system: null,
        sha256: hash("a"),
        size: 64,
        signed: null,
      },
      {
        name: "manifest.json",
        system: null,
        sha256: hash("b"),
        size: 4_000,
        signed: null,
      },
    ],
  };
}

/** A feed with 0.1.0 and an older candidate, listed oldest first. */
export const AI_TEST_FEED = {
  format: "6529-ai-releases/1",
  sequence: 2,
  published: "2026-11-17T12:00:00Z",
  releases: [aiFeedEntry("0.1.0-rc.1", "2026-11-10"), aiFeedEntry("0.1.0")],
};

export function feedBytes(
  feed: unknown = AI_TEST_FEED
): Uint8Array<ArrayBuffer> {
  return new TextEncoder().encode(JSON.stringify(feed));
}
