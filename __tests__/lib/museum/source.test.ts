import {
  buildMuseumRawUrl,
  isPublicMuseumPath,
  parseMuseumManifest,
  verifySha256,
} from "@/lib/museum/source";

describe("Museum source boundary", () => {
  it("accepts only safe public Markdown and JSON paths", () => {
    expect(isPublicMuseumPath("records/accessions/register.json")).toBe(true);
    expect(isPublicMuseumPath("policies/founding.md")).toBe(true);
    expect(isPublicMuseumPath("schemas/object-record.schema.json")).toBe(false);
    expect(isPublicMuseumPath("records/../secrets.json")).toBe(false);
    expect(isPublicMuseumPath("records\\secrets.json")).toBe(false);
    expect(isPublicMuseumPath("records/data.xml")).toBe(false);
    expect(isPublicMuseumPath("https://example.com/records.json")).toBe(false);
  });

  it("rejects malformed or duplicate manifest entries", () => {
    const base = {
      manifest_type: "6529NM_RECORD_MANIFEST",
      manifest_version: "1.0.0",
      manifest_sha256:
        "sha256:3c5f66a7587310c9dd4c25a855c5ef38b68db4937c406ebcd36668e45d947f47",
      entries: [
        {
          path: "records/accessions/register.json",
          sha256: `sha256:${"b".repeat(64)}`,
          size: 20,
        },
      ],
    };

    expect(parseMuseumManifest(base).entries).toHaveLength(1);
    expect(() =>
      parseMuseumManifest({
        ...base,
        manifest_sha256: `sha256:${"a".repeat(64)}`,
      })
    ).toThrow("manifest_hash_mismatch");
    expect(() =>
      parseMuseumManifest({
        ...base,
        entries: [...base.entries, ...base.entries],
      })
    ).toThrow("manifest_duplicate_path");
    expect(() =>
      parseMuseumManifest({
        ...base,
        entries: [{ ...base.entries[0], path: "records/../private.json" }],
      })
    ).toThrow("manifest_entry_invalid");
  });

  it("verifies UTF-8 document hashes and builds canonical raw URLs", () => {
    const content = "museum record ✓";
    expect(verifySha256(content, "sha256:bad")).toBe(false);
    expect(
      verifySha256(
        content,
        "sha256:a22bb9e87b265159f4161e4236ff22aabc6b4405e42a25c8d32af643797c26d0"
      )
    ).toBe(true);
    expect(buildMuseumRawUrl("records/accessions/register.json")).toBe(
      "https://raw.githubusercontent.com/6529-Collections/6529networkmuseum/main/records/accessions/register.json"
    );
    expect(() => buildMuseumRawUrl("records/../private.json")).toThrow(
      "unsafe_repository_path"
    );
    expect(() =>
      buildMuseumRawUrl("schemas/object-record.schema.json")
    ).toThrow("unsafe_repository_path");
  });
});
