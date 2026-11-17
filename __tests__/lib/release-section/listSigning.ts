import { signFeed, TEST_FEED_SIGNING_KEY } from "../validator-page/feedSigning";

export { TEST_FEED_SIGNING_KEY };

export const AI_DOMAIN = "6529 AI releases v1";
export const DESKTOP_DOMAIN = "6529 Desktop releases v1";
export const VALIDATOR_DOMAIN = "6529 Validator releases v1";

const hash = (digit: string) => digit.repeat(64);

/**
 * A release of 6529 AI in the validator's format 1, as 6529 AI's producer
 * writes it from 0.1.0-rc.3 on: no `system` or `signed` per file, and the
 * full notes as `NOTES.md`. All values made up.
 */
export function aiListEntry(
  version: string,
  fields: Record<string, unknown> = {}
): Record<string, unknown> {
  return {
    version,
    channel: "test",
    date: "2026-11-20",
    commit: "d".repeat(40),
    notes: `Made-up notes for ${version}.`,
    notes_url: `https://6529.io/ai/releases#${version}`,
    files: [
      {
        name: `6529-ai-${version}-macos-arm64.dmg`,
        size: 95_000_000,
        sha256: hash("1"),
      },
      {
        name: `6529-ai-${version}-windows-x64-setup.exe`,
        size: 91_000_000,
        sha256: hash("2"),
      },
      {
        name: `6529-ai_${version}_amd64.deb`,
        size: 79_000_000,
        sha256: hash("3"),
      },
      {
        name: `6529-ai-cuda_${version}_amd64.deb`,
        size: 1_018_000_000,
        sha256: hash("4"),
      },
      {
        name: `6529-ai_${version}_arm64.deb`,
        size: 62_000_000,
        sha256: hash("5"),
      },
      {
        name: `6529-ai-${version}-linux-x86_64-cpu.tar.gz`,
        size: 104_000_000,
        sha256: hash("6"),
      },
      {
        name: `6529-ai-${version}-linux-x86_64-cuda.tar.gz`,
        size: 1_218_000_000,
        sha256: hash("7"),
      },
      {
        name: `6529-ai-${version}-linux-arm64-cpu.tar.gz`,
        size: 86_000_000,
        sha256: hash("8"),
      },
      { name: "NOTES.md", size: 2_100, sha256: hash("e") },
      { name: "SHA256SUMS", size: 905, sha256: hash("9") },
    ],
    ...fields,
  };
}

/** A list with rc.3 and the release before, newest first. */
export function aiList(
  fields: Record<string, unknown> = {}
): Record<string, unknown> {
  return {
    format: 1,
    sequence: 1_795_000_000,
    published: "2026-11-20T10:00:00Z",
    download_page: "https://6529.io/ai",
    releases: [aiListEntry("0.1.0-rc.3"), aiListEntry("0.1.0-rc.2")],
    ...fields,
  };
}

/** The list's bytes, as the producer writes them: compact, one line break. */
export function listBytes(list: unknown): Uint8Array<ArrayBuffer> {
  return new TextEncoder().encode(`${JSON.stringify(list)}\n`);
}

const b64 = (bytes: Uint8Array) => Buffer.from(bytes).toString("base64");

/** `feed/releases.bundle.json` holding these two parts. */
export function bundleBytes(
  list: Uint8Array,
  signature: Uint8Array
): Uint8Array<ArrayBuffer> {
  return new TextEncoder().encode(
    JSON.stringify({ version: 1, list: b64(list), signature: b64(signature) })
  );
}

/** A bundle of `list` signed with the test key under `domain`. */
export function signedBundle(
  list: Uint8Array,
  domain: string = AI_DOMAIN,
  key: string = TEST_FEED_SIGNING_KEY.address
): Uint8Array<ArrayBuffer> {
  return bundleBytes(list, signFeed(list, key, domain));
}

export { signFeed };
