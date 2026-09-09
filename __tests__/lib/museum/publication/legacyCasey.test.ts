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
    expect(publication.documents).toHaveLength(75);
    expect(publication.documents).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          id: "generative-system-analysis-standard",
          sourcePath: "docs/generative-system-analysis.md",
          title: "generative-system-analysis",
        }),
        expect.objectContaining({
          id: "generative-trait-analysis",
          sourcePath: "docs/generative-trait-analysis.md",
          title: "generative-trait-analysis",
        }),
      ])
    );
    expect(publication.rightsHandbook).toEqual(
      expect.objectContaining({
        introduction: expect.objectContaining({
          title: "Rights in digital art",
        }),
        artistGuide: expect.objectContaining({ title: "Rights for artists" }),
        collectorGuide: expect.objectContaining({
          title: "Rights for collectors",
        }),
        expressions: expect.arrayContaining([
          expect.objectContaining({
            id: "cc-by-nc-4.0",
            shortLabel: "CC BY-NC 4.0",
            legalCode: expect.objectContaining({
              path: "docs/rights/legal-texts/cc-by-nc-4.0.txt",
            }),
          }),
        ]),
      })
    );
    expect(publication.institutionalPractice).toEqual(
      expect.objectContaining({
        id: "institutional-practice:a-field-of-practice",
        slug: "a-field-of-practice",
        introduction: expect.objectContaining({
          title: "A field of practice",
        }),
        profiles: expect.arrayContaining([
          expect.objectContaining({
            slug: "centre-pompidou",
            document: expect.objectContaining({ title: "Centre Pompidou" }),
          }),
          expect.objectContaining({
            slug: "serpentine-arts-technologies",
            document: expect.objectContaining({
              title: "Serpentine Arts Technologies",
            }),
          }),
        ]),
        sourceRegister: expect.objectContaining({
          title: "Source register: A field of practice",
        }),
        adjacentPractice: expect.objectContaining({
          title:
            "Adjacent practice: platforms, archives, festivals, and chain-native systems",
        }),
        editorialStandard: expect.objectContaining({
          title: "Writing the 6529 Network Museum",
        }),
      })
    );
    expect(
      publication.documents
        .filter(({ kind }) =>
          [
            "open_museum_statement",
            "onchain_transition",
            "contributor_guide",
          ].includes(kind)
        )
        .map(({ kind }) => kind)
    ).toEqual([
      "open_museum_statement",
      "onchain_transition",
      "contributor_guide",
    ]);
    expect(
      publication.documents.find(
        ({ id }) => id === "casey-reas-collection-essay"
      )?.projectIds
    ).toEqual([
      "casey-reas-923-empty-rooms",
      "casey-reas-century",
      "casey-reas-ex-nihilo-cosmos",
      "casey-reas-phototaxis",
      "casey-reas-pre-process",
    ]);
    expect(publication.gifts).toEqual([
      expect.objectContaining({
        id: "6529NM.2026.001",
        institutionalStatus: "accessioned",
        donorPublicCredit: "punk6529",
      }),
    ]);
    expect(
      publication.documents.find(({ kind }) => kind === "gift_narrative")
    ).toEqual(
      expect.objectContaining({
        title: "Gift into Public Trust",
        giftIds: ["6529NM.2026.001"],
      })
    );
    expect(
      publication.documents.filter(({ kind }) => kind === "project_essay")
    ).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          projectIds: ["casey-reas-century"],
          artworkIds: [
            "6529NM.2026.001.01",
            "6529NM.2026.001.02",
            "6529NM.2026.001.03",
          ],
        }),
        expect.objectContaining({
          projectIds: ["casey-reas-pre-process"],
          artworkIds: ["6529NM.2026.001.04"],
        }),
      ])
    );
    expect(
      publication.documents.find(
        ({ kind }) => kind === "source_chronology_matrix"
      )
    ).toEqual(
      expect.objectContaining({
        artistIds: ["casey-reas"],
        giftIds: ["6529NM.2026.001"],
        projectIds: expect.arrayContaining([
          "casey-reas-century",
          "casey-reas-pre-process",
        ]),
        artworkIds: [
          "6529NM.2026.001.01",
          "6529NM.2026.001.02",
          "6529NM.2026.001.03",
          "6529NM.2026.001.04",
          "6529NM.2026.001.05",
          "6529NM.2026.001.06",
          "6529NM.2026.001.07",
        ],
      })
    );
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
          rightsExpressionId: "cc-by-nc-4.0",
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
        rightsExpressionId: null,
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

  it("reads the first level-one heading after bounded front matter", async () => {
    const path =
      "records/accessions/6529NM.2026.001/public/accession-certificate.md";
    const fixture = createCaseyFixture({
      documentOverrides: {
        [path]:
          "---\r\nstatus: public\r\n---\r\n# Reviewed certificate\r\n\r\nText.",
      },
    });
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
    expect(
      result.publication.documents.find(({ sourcePath }) => sourcePath === path)
        ?.title
    ).toBe("Reviewed certificate");
  });

  it("projects Markdown emphasis in a governed heading as visitor text", async () => {
    const path =
      "records/accessions/6529NM.2026.001/public/projects/microimage-and-phototaxis.md";
    const fixture = createCaseyFixture({
      documentOverrides: {
        [path]: "# A line remembers: MicroImage and *Phototaxis*\n\nText.",
      },
    });
    const result = await new GitHubMuseumPublicationSource({
      ref: "main",
      assembler: legacyCaseyPublicationAssembler,
      fetch: fixture.fetch,
    }).load();

    expect(result.status).toBe("current");
    if (result.status !== "current") {
      throw new Error("test_publication_missing");
    }
    expect(
      result.publication.documents.find(
        (document) => document.sourcePath === path
      )?.title
    ).toBe("A line remembers: MicroImage and Phototaxis");
  });

  it("preserves unmatched literal heading markers", async () => {
    const path =
      "records/accessions/6529NM.2026.001/public/projects/atomism-and-923-empty-rooms.md";
    const fixture = createCaseyFixture({
      documentOverrides: {
        [path]: "# 923 EMPTY ROOMS *and* the C* notation\n\nText.",
      },
    });
    const result = await new GitHubMuseumPublicationSource({
      ref: "main",
      assembler: legacyCaseyPublicationAssembler,
      fetch: fixture.fetch,
    }).load();

    expect(result.status).toBe("current");
    if (result.status !== "current") {
      throw new Error("test_publication_missing");
    }
    expect(
      result.publication.documents.find(
        (document) => document.sourcePath === path
      )?.title
    ).toBe("923 EMPTY ROOMS and the C* notation");
  });

  it("fails closed when a public document has no level-one heading", async () => {
    const path =
      "records/accessions/6529NM.2026.001/public/accession-certificate.md";
    const fixture = createCaseyFixture({
      documentOverrides: {
        [path]: "---\nstatus: public\n---\n## Not a level-one heading",
      },
    });
    const result = await new GitHubMuseumPublicationSource({
      ref: "main",
      assembler: legacyCaseyPublicationAssembler,
      fetch: fixture.fetch,
      now: () => new Date("2026-08-02T12:00:00Z"),
    }).load();

    expect(result).toMatchObject({
      status: "unavailable",
      errorCode: "publication_markdown_heading_missing",
    });
  });

  it("fails closed when a finished project manuscript is undeclared", async () => {
    const path =
      "records/accessions/6529NM.2026.001/public/projects/century.md";
    const fixture = createCaseyFixture({ omittedManifestPath: path });
    const result = await new GitHubMuseumPublicationSource({
      ref: "main",
      assembler: legacyCaseyPublicationAssembler,
      fetch: fixture.fetch,
      now: () => new Date("2026-08-02T12:00:00Z"),
    }).load();

    expect(result).toMatchObject({
      status: "unavailable",
      publication: null,
      errorCode: "publication_required_path_undeclared",
    });
  });

  it.each([
    ["contributor guide", "CONTRIBUTING.md"],
    ["Open Museum statement", "docs/open-museum.md"],
    ["on-chain transition statement", "docs/onchain-transition.md"],
    ["generative system analysis standard", "docs/generative-system-analysis.md"],
    ["generative trait analysis standard", "docs/generative-trait-analysis.md"],
  ])(
    "fails closed when the governed %s is undeclared",
    async (_label, path) => {
      const fixture = createCaseyFixture({ omittedManifestPath: path });
      const result = await new GitHubMuseumPublicationSource({
        ref: "main",
        assembler: legacyCaseyPublicationAssembler,
        fetch: fixture.fetch,
        now: () => new Date("2026-08-03T08:00:00Z"),
      }).load();

      expect(result).toMatchObject({
        status: "unavailable",
        publication: null,
        errorCode: "publication_required_path_undeclared",
      });
    }
  );
});
