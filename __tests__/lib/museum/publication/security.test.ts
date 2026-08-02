import {
  assertApprovedArtBlocksUrl,
  assertApprovedGitHubUrl,
  assertGovernedMuseumPath,
  assertSafeMuseumRepositoryPath,
  buildImmutableMuseumRawUrl,
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
