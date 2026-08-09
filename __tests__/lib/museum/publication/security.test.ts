import {
  assertApprovedArtBlocksUrl,
  assertApprovedGitHubUrl,
  assertGovernedMuseumPath,
  assertSafeMuseumRepositoryPath,
  buildImmutableMuseumBlobUrl,
  buildImmutableMuseumCommitUrl,
  buildImmutableMuseumEditUrl,
  buildImmutableMuseumRawUrl,
  buildMuseumMainBlobUrl,
  buildMuseumMainEditUrl,
} from "@/lib/museum/publication";
import { EXACT_COMMIT } from "./fixture";

describe("Museum publication security boundary", () => {
  it("accepts the governed Art Blocks still and live URL forms", () => {
    const contract = "0x0000000000000000000000000000000000000000";
    const still = `https://media-proxy.artblocks.io/1/${contract}/1.png`;
    const live = `https://generator.artblocks.io/1/${contract}/1`;

    expect(assertApprovedArtBlocksUrl(still, "still")).toBe(still);
    expect(assertApprovedArtBlocksUrl(live, "live")).toBe(live);
  });

  it("rejects empty, overlong, and control-character repository paths", () => {
    expect(() => assertSafeMuseumRepositoryPath("")).toThrow(
      "publication_unsafe_path"
    );
    expect(() => assertSafeMuseumRepositoryPath("a".repeat(513))).toThrow(
      "publication_unsafe_path"
    );
    expect(() =>
      assertSafeMuseumRepositoryPath("records/control\u0000.json")
    ).toThrow("publication_unsafe_path");
  });

  it("rejects traversal, encoded traversal, and unsupported content", () => {
    expect(() =>
      assertGovernedMuseumPath("records/accessions/object.json")
    ).not.toThrow();
    expect(() =>
      assertGovernedMuseumPath("docs/rights/legal-texts/cc-by-4.0.txt")
    ).not.toThrow();
    expect(() =>
      assertSafeMuseumRepositoryPath(".github/workflows/validate.yml")
    ).not.toThrow();
    expect(() => assertGovernedMuseumPath("records/../secret.json")).toThrow(
      "publication_unsafe_path"
    );
    expect(() =>
      assertGovernedMuseumPath("records/%2e%2e/secret.json")
    ).toThrow("publication_unsafe_path");
    expect(() =>
      assertGovernedMuseumPath("records/%252e%252e/secret.json")
    ).toThrow("publication_unsafe_path");
    expect(() => assertGovernedMuseumPath("records\\secret.json")).toThrow(
      "publication_unsafe_path"
    );
    expect(() => assertGovernedMuseumPath("records/object.xml")).toThrow(
      "publication_unsupported_extension"
    );
  });

  it.each([
    "records/.git/config.json",
    "records/object.json?raw=1",
    "records/object.json#fragment",
    "records/object name.json",
    " records/object.json",
  ])("rejects the catalog-schema-unsafe path %s", (path) => {
    expect(() => assertSafeMuseumRepositoryPath(path)).toThrow(
      "publication_unsafe_path"
    );
  });

  it("builds raw URLs from an exact commit only", () => {
    expect(
      buildImmutableMuseumRawUrl(EXACT_COMMIT, "records/accessions/object.json")
    ).toBe(
      `https://raw.githubusercontent.com/6529-Collections/6529networkmuseum/${EXACT_COMMIT}/records/accessions/object.json`
    );
    expect(() =>
      buildImmutableMuseumRawUrl("main", "records/accessions/object.json")
    ).toThrow("publication_invalid_commit");
  });

  it("builds web citations from an exact commit and governed path only", () => {
    expect(
      buildImmutableMuseumBlobUrl(
        EXACT_COMMIT,
        "records/accessions/object.json",
        "#evidence"
      )
    ).toBe(
      `https://github.com/6529-Collections/6529networkmuseum/blob/${EXACT_COMMIT}/records/accessions/object.json#evidence`
    );
    expect(
      buildImmutableMuseumBlobUrl("main", "records/accessions/object.json")
    ).toBeNull();
    expect(
      buildImmutableMuseumBlobUrl(EXACT_COMMIT, "records/../secret.json")
    ).toBeNull();
  });

  it("separates immutable release inspection from the maintained contributor guide", () => {
    expect(buildImmutableMuseumCommitUrl(EXACT_COMMIT)).toBe(
      `https://github.com/6529-Collections/6529networkmuseum/tree/${EXACT_COMMIT}`
    );
    expect(buildImmutableMuseumCommitUrl("main")).toBeNull();
    expect(buildImmutableMuseumEditUrl(EXACT_COMMIT, "docs/open-museum.md")).toBe(
      `https://github.com/6529-Collections/6529networkmuseum/edit/${EXACT_COMMIT}/docs/open-museum.md`
    );
    expect(buildImmutableMuseumEditUrl("main", "docs/open-museum.md")).toBeNull();
    expect(buildMuseumMainBlobUrl("CONTRIBUTING.md")).toBe(
      "https://github.com/6529-Collections/6529networkmuseum/blob/main/CONTRIBUTING.md"
    );
    expect(buildMuseumMainBlobUrl("../CONTRIBUTING.md")).toBeNull();
    expect(buildMuseumMainEditUrl("docs/open-museum.md")).toBe(
      "https://github.com/6529-Collections/6529networkmuseum/edit/main/docs/open-museum.md"
    );
    expect(buildMuseumMainEditUrl("docs/../RIGHTS.md")).toBeNull();
    expect(buildMuseumMainEditUrl("https://evil.test/README.md")).toBeNull();
  });

  it("rejects arbitrary GitHub and Art Blocks origins", () => {
    expect(() =>
      assertApprovedGitHubUrl("https://raw.githubusercontent.com.evil.test/a")
    ).toThrow("publication_unapproved_origin");
    expect(() =>
      assertApprovedGitHubUrl("https://example.test/records/object.json")
    ).toThrow("publication_unapproved_origin");
    expect(() =>
      assertApprovedArtBlocksUrl(
        "https://media-proxy.artblocks.io.evil.test/1/0x0000000000000000000000000000000000000000/1.png",
        "still"
      )
    ).toThrow("publication_unapproved_media_origin");
    expect(() =>
      assertApprovedArtBlocksUrl(
        "http://generator.artblocks.io/1/0x0000000000000000000000000000000000000000/1",
        "live"
      )
    ).toThrow("publication_unapproved_media_origin");
    expect(() =>
      assertApprovedArtBlocksUrl(
        "https://generator.artblocks.io/1/0x0000000000000000000000000000000000000000/1?wallet=1",
        "live"
      )
    ).toThrow("publication_unapproved_media_origin");
  });
});
