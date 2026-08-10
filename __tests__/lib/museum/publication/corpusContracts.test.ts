import {
  buildMuseumPageSourceCatalog,
  GitHubMuseumPublicationSource,
  INSTITUTIONAL_PRACTICE_DOCUMENT_CONTRACTS,
  INSTITUTIONAL_PRACTICE_PROFILE_CONTRACTS,
  INSTITUTIONAL_PRACTICE_REQUIRED_PATHS,
  LEGACY_CASEY_REQUIRED_PATHS,
  legacyCaseyPublicationAssembler,
  MUSEUM_CONTRIBUTOR_GUIDE_PATH,
  MUSEUM_ONCHAIN_TRANSITION_PATH,
  MUSEUM_OPEN_STATEMENT_PATH,
  MUSEUM_RIGHTS_REQUIRED_PATHS,
  resolveMuseumPageSource,
  type MuseumPublication,
} from "@/lib/museum/publication";
import { PROJECT_PUBLIC_DOCUMENTS } from "@/lib/museum/publication/legacyCaseyProjectDocuments";
import { createCaseyFixture, EXACT_COMMIT } from "./fixture";

async function loadPublication(
  fixture = createCaseyFixture()
): Promise<MuseumPublication> {
  const state = await new GitHubMuseumPublicationSource({
    ref: "main",
    assembler: legacyCaseyPublicationAssembler,
    fetch: fixture.fetch,
    now: () => new Date("2026-08-05T00:00:00Z"),
  }).load();
  if (state.status !== "current") {
    throw new Error(`test_publication_${state.errorCode}`);
  }
  return state.publication;
}

function markdownHeadings(markdown: string): string[] {
  return markdown
    .split(/\r?\n/u)
    .map((line) => line.trim())
    .filter((line) => /^#{1,6}\s+/u.test(line));
}

function markdownUrls(markdown: string): string[] {
  return [...markdown.matchAll(/https?:\/\/[^\s<>()\]"']+/gu)].map(([value]) =>
    value.replace(/[.,;:]+$/u, "")
  );
}

function withKeysAndGatesDocuments() {
  const selectedWorksPath = "records/programs/6529NM-AP-01/selected-works.json";
  const programPath = "records/programs/6529NM-AP-01/program.json";
  const outcomeDocuments = Object.fromEntries(
    Array.from({ length: 16 }, (_, index) => {
      const outcomeNumber = String(index + 1).padStart(3, "0");
      return [
        `records/programs/6529NM-AP-01/outcomes/OUT-${outcomeNumber}.json`,
        JSON.stringify({ record_id: `6529NM-AP-01-OUT-${outcomeNumber}` }),
      ];
    })
  );
  return createCaseyFixture({
    documentOverrides: {
      "docs/programs/keys-and-gates.md":
        "# Keys and Gates\n\nA public program.",
      [programPath]: JSON.stringify({ program_id: "6529NM-AP-01" }),
      [selectedWorksPath]: JSON.stringify({ works: [] }),
      ...outcomeDocuments,
    },
  });
}

describe("Museum publication corpus contracts", () => {
  it("keeps the institutional study complete and source-addressable", async () => {
    const publication = await loadPublication();
    const practice = publication.institutionalPractice;
    const documents = [
      practice.introduction,
      ...practice.profiles.map((profile) => profile.document),
      practice.adjacentPractice,
      practice.editorialStandard,
      practice.sourceRegister,
    ];

    expect(INSTITUTIONAL_PRACTICE_PROFILE_CONTRACTS).toHaveLength(27);
    expect(INSTITUTIONAL_PRACTICE_DOCUMENT_CONTRACTS).toHaveLength(31);
    expect(INSTITUTIONAL_PRACTICE_REQUIRED_PATHS).toEqual(
      documents.map((document) => document.sourcePath)
    );
    expect(new Set(documents.map((document) => document.sourcePath)).size).toBe(
      documents.length
    );

    for (const document of documents) {
      expect(document.markdown.trim()).not.toBe("");
      expect(markdownHeadings(document.markdown)[0]).toBe(
        `# ${document.title}`
      );
      expect(publication.declaredSourcePaths).toContain(document.sourcePath);
      expect(document.sourcePath).toMatch(/\.md$/u);
    }
    for (const profile of practice.profiles) {
      expect(profile.id).toBe(`institutional-practice:${profile.slug}`);
      expect(profile.document.sourcePath).toBe(
        `records/institutional-practice/profiles/${profile.slug}.md`
      );
      expect(profile.document.markdown).toMatch(
        /^## What the Museum should adopt$/mu
      );
      expect(profile.document.markdown).toMatch(
        /^## Where the analogy ends$/mu
      );
    }
  });

  it("keeps published research links secure and every catalog route source-admissible", async () => {
    const publication = await loadPublication();
    const institutionalDocuments = [
      publication.institutionalPractice.introduction,
      ...publication.institutionalPractice.profiles.map(
        (profile) => profile.document
      ),
      publication.institutionalPractice.adjacentPractice,
      publication.institutionalPractice.editorialStandard,
      publication.institutionalPractice.sourceRegister,
    ];
    const urls = institutionalDocuments.flatMap((document) =>
      markdownUrls(document.markdown)
    );
    expect(urls.length).toBeGreaterThan(0);
    for (const value of urls) {
      const url = new URL(value);
      expect(url.protocol).toBe("https:");
      expect(url.username).toBe("");
      expect(url.password).toBe("");
    }

    const catalog = buildMuseumPageSourceCatalog(publication);
    const declared = new Set(publication.declaredSourcePaths);
    expect(catalog.length).toBeGreaterThan(0);
    for (const route of catalog) {
      expect(declared.has(route.source.primaryPath)).toBe(true);
      for (const source of route.source.relatedSources) {
        expect(declared.has(source.path)).toBe(true);
      }
      expect(resolveMuseumPageSource(route.pathname, catalog)).toEqual(
        route.source
      );
    }
  });

  it("keeps the Casey accession inventory and document relations closed", async () => {
    const publication = await loadPublication();
    const [artist] = publication.artists;
    const [gift] = publication.gifts;
    expect(artist).toBeDefined();
    expect(gift).toBeDefined();
    if (!artist || !gift) return;

    expect(publication.artists).toHaveLength(1);
    expect(publication.projects).toHaveLength(5);
    expect(publication.gifts).toHaveLength(1);
    expect(publication.artworks).toHaveLength(7);
    expect(gift.institutionalStatus).toBe("accessioned");
    expect(gift.acquisitionMethod).toBe("donation");
    expect(new Set(gift.artworkIds)).toEqual(
      new Set(publication.artworks.map((artwork) => artwork.id))
    );
    expect(new Set(artist.artworkIds)).toEqual(
      new Set(publication.artworks.map((artwork) => artwork.id))
    );
    expect(new Set(artist.projectIds)).toEqual(
      new Set(publication.projects.map((project) => project.id))
    );

    for (const project of publication.projects) {
      expect(project.artistId).toBe(artist.id);
      expect(project.artworkIds.length).toBeGreaterThan(0);
      expect(project.documentIds.length).toBeGreaterThan(0);
      for (const artworkId of project.artworkIds) {
        expect(
          publication.artworks.find((artwork) => artwork.id === artworkId)
        ).toEqual(expect.objectContaining({ projectId: project.id }));
      }
    }
    for (const artwork of publication.artworks) {
      expect(artwork.institutionalStatus).toBe("accessioned");
      expect(artwork.giftId).toBe(gift.id);
      expect(artwork.artistId).toBe(artist.id);
      expect(artwork.documentIds.length).toBeGreaterThan(0);
      expect(publication.declaredSourcePaths).toContain(artwork.sourcePath);
    }
  });

  it("keeps Keys and Gates selections tied to their program and source records", async () => {
    const publication = await loadPublication(withKeysAndGatesDocuments());
    const catalog = buildMuseumPageSourceCatalog(publication);
    const programRoute = resolveMuseumPageSource(
      "/museum/network/acquisition-programs/keys-and-gates",
      catalog
    );
    expect(programRoute).toEqual(
      expect.objectContaining({
        primaryPath: "records/programs/6529NM-AP-01/program.json",
      })
    );
    expect(programRoute?.relatedSources.map((source) => source.path)).toEqual(
      expect.arrayContaining([
        "docs/programs/keys-and-gates.md",
        "records/programs/6529NM-AP-01/selected-works.json",
      ])
    );
    expect(
      resolveMuseumPageSource("/museum/network/programs/6529NM-AP-01", catalog)
    ).toBeNull();

    const outcomeRoutes = catalog.filter((route) =>
      /^\/museum\/network\/objects\/6529NM-AP-01-OUT-\d{3}$/u.test(
        route.pathname
      )
    );
    expect(outcomeRoutes).toHaveLength(0);
    for (const route of [
      programRoute,
      ...outcomeRoutes.map((item) => item.source),
    ]) {
      expect(route).not.toBeNull();
      if (route) {
        expect(publication.declaredSourcePaths).toContain(route.primaryPath);
        for (const source of route.relatedSources) {
          expect(publication.declaredSourcePaths).toContain(source.path);
        }
      }
    }
  });

  it("requires HTTPS, credential-free media and rights sources", async () => {
    const publication = await loadPublication();
    const urls = [
      ...publication.artworks.flatMap((artwork) =>
        artwork.media.map((media) => media.url)
      ),
      ...publication.rightsHandbook.expressions.flatMap((expression) =>
        expression.legalCode === null
          ? []
          : [
              expression.legalCode.sourceUri,
              expression.legalCode.publicationUri,
            ]
      ),
    ];
    expect(urls.length).toBeGreaterThan(0);
    for (const value of urls) {
      const url = new URL(value);
      expect(url.protocol).toBe("https:");
      expect(url.username).toBe("");
      expect(url.password).toBe("");
    }
    expect(publication.rightsHandbook.sourcePaths).toEqual(
      expect.arrayContaining(MUSEUM_RIGHTS_REQUIRED_PATHS)
    );
  });

  it("activates only an exact commit with a complete declared source boundary", async () => {
    const publication = await loadPublication();
    expect(publication.identity.commit).toBe(EXACT_COMMIT);
    expect(publication.identity.requestedRef).toBe("main");
    expect(publication.identity.manifestPath).toBe(
      "release-artifacts/latest/record-manifest.json"
    );
    expect(publication.identity.inventoryCount).toBeGreaterThan(
      LEGACY_CASEY_REQUIRED_PATHS.length
    );
    expect(new Set(publication.declaredSourcePaths).size).toBe(
      publication.declaredSourcePaths.length
    );
    for (const document of publication.documents) {
      expect(publication.declaredSourcePaths).toContain(document.sourcePath);
      expect(document.sha256).toMatch(/^sha256:[a-f0-9]{64}$/u);
    }
    expect(publication.declaredSourcePaths).toEqual(
      expect.arrayContaining([
        MUSEUM_CONTRIBUTOR_GUIDE_PATH,
        MUSEUM_OPEN_STATEMENT_PATH,
        MUSEUM_ONCHAIN_TRANSITION_PATH,
        ...PROJECT_PUBLIC_DOCUMENTS.map((document) => document.path),
      ])
    );
  });

  it("fails closed when a required manuscript leaves the exact release boundary", async () => {
    const omittedPath = INSTITUTIONAL_PRACTICE_PROFILE_CONTRACTS[0]?.path;
    expect(omittedPath).toBeDefined();
    const state = await new GitHubMuseumPublicationSource({
      ref: "main",
      assembler: legacyCaseyPublicationAssembler,
      fetch: createCaseyFixture({ omittedManifestPath: omittedPath }).fetch,
    }).load();
    expect(state).toMatchObject({
      status: "unavailable",
      publication: null,
      errorCode: "publication_required_path_undeclared",
    });
  });
});
