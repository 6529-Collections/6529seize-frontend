import {
  GitHubMuseumPublicationSource,
  isMuseumCollectionArtwork,
  legacyCaseyPublicationAssembler,
  type MuseumArtwork,
} from "@/lib/museum/publication";
import { createCaseyFixture } from "./fixture";

describe("legacy Casey publication projection", () => {
  it("requires all seven accessioned artworks without inventing retained media", async () => {
    const fixture = createCaseyFixture();
    const result = await new GitHubMuseumPublicationSource({
      ref: "main",
      assembler: legacyCaseyPublicationAssembler,
      fetch: fixture.fetch,
      now: () => new Date("2026-08-02T12:00:00Z"),
    }).load();
    expect(result.status).toBe("current");
    if (result.status !== "current") {
      throw new Error("test_publication_missing");
    }

    const publication = result.publication;
    expect(publication.artists).toEqual([
      expect.objectContaining({
        id: "casey-reas",
        preferredName: "Casey REAS",
      }),
    ]);
    expect(publication.projects).toHaveLength(5);
    expect(publication.gifts).toEqual([
      expect.objectContaining({
        id: "6529NM.2026.001",
        institutionalStatus: "accessioned",
        donorPublicCredit: "punk6529",
      }),
    ]);
    expect(publication.artworks.map((artwork) => artwork.id)).toEqual([
      "6529NM.2026.001.01",
      "6529NM.2026.001.02",
      "6529NM.2026.001.03",
      "6529NM.2026.001.04",
      "6529NM.2026.001.05",
      "6529NM.2026.001.06",
      "6529NM.2026.001.07",
    ]);
    for (const artwork of publication.artworks) {
      expect(artwork.institutionalStatus).toBe("accessioned");
      expect(artwork.media).toHaveLength(2);
      expect(
        artwork.media.every(
          (media) =>
            media.custody === "upstream" &&
            media.preservationStatus === "not_retained" &&
            media.sha256 === null
        )
      ).toBe(true);
      expect(artwork.media.map((media) => media.kind).sort()).toEqual([
        "live",
        "still",
      ]);
      expect(artwork.rightsCredit).toEqual(
        expect.objectContaining({
          licenseLabel: "CC BY-NC 4.0",
          licenseUrl: null,
        })
      );
    }
    expect(
      publication.artworks.every((artwork) =>
        isMuseumCollectionArtwork(artwork)
      )
    ).toBe(true);
  });

  it("keeps selected_unminted outside the accessioned collection type", () => {
    const selected = {
      id: "6529NM-AP-01-OUT-001",
      title: "Take the Key!",
      artistId: "gulyildiz",
      projectId: "keys-and-gates",
      medium: "Photography",
      institutionalStatus: "selected_unminted",
      accessionLotId: null,
      giftId: null,
      programId: "6529NM-AP-01",
      rightsCredit: {
        creditLine: "Program selection record",
        licenseLabel: null,
        licenseUrl: null,
        sourcePath: "records/programs/6529NM-AP-01/selected-works.json",
      },
      media: [],
      documentIds: [],
      sourcePath: "records/programs/6529NM-AP-01/selected-works.json",
    } satisfies MuseumArtwork;

    expect(isMuseumCollectionArtwork(selected)).toBe(false);
    expect(selected.institutionalStatus).toBe("selected_unminted");
    expect(selected.accessionLotId).toBeNull();
    expect(selected.giftId).toBeNull();
  });
});
