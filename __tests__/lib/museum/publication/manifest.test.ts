import { createHash } from "node:crypto";
import { parseMuseumPublicationManifest } from "@/lib/museum/publication";

const MANIFEST_TYPE = "6529NM_RECORD_MANIFEST";
const MANIFEST_VERSION = "1.0.0";

function baseManifest() {
  return {
    manifest_type: MANIFEST_TYPE,
    manifest_version: MANIFEST_VERSION,
    entries: [{ path: "records/object.json", size: 10 }],
  };
}

function sha256(value: string): string {
  return `sha256:${createHash("sha256").update(value, "utf8").digest("hex")}`;
}

describe("Museum publication manifest parser", () => {
  it("rejects duplicate inventory paths", () => {
    const entry = { path: "records/object.json", size: 10 };

    expect(() =>
      parseMuseumPublicationManifest({
        ...baseManifest(),
        entries: [entry, entry],
      })
    ).toThrow("publication_manifest_duplicate_path");
  });

  it("rejects an invalid entry SHA-256 shape", () => {
    expect(() =>
      parseMuseumPublicationManifest({
        ...baseManifest(),
        entries: [
          {
            path: "records/object.json",
            size: 10,
            sha256: "sha256:not-a-digest",
          },
        ],
      })
    ).toThrow("publication_manifest_entry_invalid");
  });

  it("rejects a well-shaped manifest SHA-256 that does not match", () => {
    expect(() =>
      parseMuseumPublicationManifest({
        ...baseManifest(),
        manifest_sha256: `sha256:${"0".repeat(64)}`,
      })
    ).toThrow("publication_manifest_hash_mismatch");
  });

  it("canonicalizes object keys, sorts returned paths, and extracts commitment", () => {
    const canonicalBody =
      '{"entries":[{"path":"z.md","size":1},{"path":"a.md","size":2}],"manifest_type":"6529NM_RECORD_MANIFEST","manifest_version":"1.0.0"}';
    const parsed = parseMuseumPublicationManifest({
      manifest_version: MANIFEST_VERSION,
      manifest_type: MANIFEST_TYPE,
      entries: [
        { size: 1, path: "z.md" },
        { size: 2, path: "a.md" },
      ],
      manifest_commitment: { digest: "0xcommitment" },
      manifest_sha256: sha256(canonicalBody),
    });

    expect(parsed.entries.map(({ path }) => path)).toEqual(["a.md", "z.md"]);
    expect(parsed.manifestCommitment).toBe("0xcommitment");
    expect(parsed.manifestSha256).toBe(sha256(canonicalBody));
  });

  it("rejects a non-integer number in the canonical manifest body", () => {
    expect(() =>
      parseMuseumPublicationManifest({
        ...baseManifest(),
        observation: 1.5,
        manifest_sha256: `sha256:${"0".repeat(64)}`,
      })
    ).toThrow(TypeError);
  });
});
