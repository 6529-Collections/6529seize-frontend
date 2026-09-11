import {
  caseyArtworksFromPublication,
  getCaseyDossierAnchor,
  tryCaseyArtworksFromPublication,
} from "@/lib/museum/casey";
import { displayCreditWithoutRepeatedLicense } from "@/lib/museum/credit";
import {
  GitHubMuseumPublicationSource,
  legacyCaseyPublicationAssembler,
  type MuseumPublication,
} from "@/lib/museum/publication";
import { createCaseyFixture } from "./publication/fixture";

async function buildPublication(): Promise<MuseumPublication> {
  const fixture = createCaseyFixture();
  const result = await new GitHubMuseumPublicationSource({
    ref: "main",
    assembler: legacyCaseyPublicationAssembler,
    fetch: fixture.fetch,
    now: () => new Date("2026-08-02T12:00:00.000Z"),
  }).load();
  if (result.status !== "current") {
    throw new Error("test_publication_fixture_unavailable");
  }
  return result.publication;
}

describe("Casey publication overlay", () => {
  let publication: MuseumPublication;

  beforeAll(async () => {
    publication = await buildPublication();
  });

  it("removes a repeated licensed suffix before the linked rights label", () => {
    expect(
      displayCreditWithoutRepeatedLicense(
        "Casey Reas, Work One; 6529 Network Museum. Licensed CC BY-NC 4.0.",
        "CC BY-NC 4.0"
      )
    ).toBe("Casey Reas, Work One; 6529 Network Museum.");
    expect(
      displayCreditWithoutRepeatedLicense(
        "Vera Molnár, Work. Licensed under CC BY-NC 4.0.",
        "CC BY-NC 4.0"
      )
    ).toBe("Vera Molnár, Work.");
  });

  it("uses the governed rights label and derives the canonical CC license URL", () => {
    const artworks = caseyArtworksFromPublication(publication);

    expect(artworks).toHaveLength(7);
    for (const artwork of artworks) {
      const governed = publication.artworks.find(
        (candidate) => candidate.id === artwork.objectId
      );
      expect(governed).toBeDefined();
      expect(governed?.rightsCredit.licenseLabel).toBe("CC BY-NC 4.0");
      expect(artwork.rightsLabel).toBe("Licensed CC BY-NC 4.0.");
      expect(artwork.rightsExpressionId).toBe("cc-by-nc-4.0");
      expect(artwork.rightsUrl).toBe(
        "/museum/network/research/rights/cc-by-nc-4.0"
      );
    }
  });

  it("derives gift-page anchors from the governed Casey dossier", () => {
    expect(
      getCaseyDossierAnchor(
        "records/accessions/6529NM.2026.001/public/accession-certificate.md"
      )
    ).toBe("accession-certificate");
    expect(getCaseyDossierAnchor("6529NM.2026.001.01.md#object-title")).toBe(
      "6529NM.2026.001.01"
    );
    expect(getCaseyDossierAnchor("not-a-dossier-document.md")).toBeNull();
  });

  it("fails closed when governed publication identity diverges from the overlay", () => {
    const first = publication.artworks[0];
    if (first === undefined) {
      throw new Error("test_casey_artwork_missing");
    }
    const mismatched: MuseumPublication = {
      ...publication,
      artworks: [
        { ...first, title: "Mismatched title" },
        ...publication.artworks.slice(1),
      ],
    };

    expect(() => caseyArtworksFromPublication(mismatched)).toThrow(
      "museum_casey_publication_mismatch"
    );
    expect(tryCaseyArtworksFromPublication(mismatched)).toBeNull();
  });
});
