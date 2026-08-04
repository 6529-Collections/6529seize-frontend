import {
  GitHubMuseumPublicationSource,
  INSTITUTIONAL_PRACTICE_DOCUMENT_CONTRACTS,
  INSTITUTIONAL_PRACTICE_PROFILE_CONTRACTS,
  INSTITUTIONAL_PRACTICE_REQUIRED_PATHS,
  legacyCaseyPublicationAssembler,
  type MuseumPublication,
} from "@/lib/museum/publication";
import { parseInstitutionalPracticeHeading } from "@/lib/museum/publication/institutionalPracticeMarkdown";
import { createCaseyFixture } from "./fixture";

async function loadPublication(
  fixture = createCaseyFixture()
): Promise<MuseumPublication> {
  const state = await new GitHubMuseumPublicationSource({
    ref: "main",
    assembler: legacyCaseyPublicationAssembler,
    fetch: fixture.fetch,
    now: () => new Date("2026-08-04T00:00:00Z"),
  }).load();
  if (state.status !== "current") {
    throw new Error(`test_publication_${state.errorCode}`);
  }
  return state.publication;
}

describe("institutional-practice publication aggregate", () => {
  it("assembles the closed sixteen-manuscript inventory in declared order", async () => {
    const publication = await loadPublication();
    const practice = publication.institutionalPractice;
    const documents = [
      practice.introduction,
      ...practice.profiles.map((profile) => profile.document),
      practice.sourceRegister,
    ];

    expect(INSTITUTIONAL_PRACTICE_DOCUMENT_CONTRACTS).toHaveLength(16);
    expect(INSTITUTIONAL_PRACTICE_PROFILE_CONTRACTS).toHaveLength(14);
    expect(INSTITUTIONAL_PRACTICE_REQUIRED_PATHS).toHaveLength(16);
    expect(documents).toHaveLength(16);
    expect(documents.map((document) => document.sourcePath)).toEqual(
      INSTITUTIONAL_PRACTICE_REQUIRED_PATHS
    );
    expect(documents.map((document) => document.title)).toEqual(
      INSTITUTIONAL_PRACTICE_DOCUMENT_CONTRACTS.map(
        (contract) => contract.title
      )
    );
    expect(documents.map((document) => document.kind)).toEqual([
      "institutional_practice_study",
      ...Array.from({ length: 14 }, () => "institution_profile"),
      "institutional_practice_source_register",
    ]);
    expect(practice.profiles.map((profile) => profile.slug)).toEqual(
      INSTITUTIONAL_PRACTICE_PROFILE_CONTRACTS.map((contract) => contract.slug)
    );
    expect(
      documents.every(
        (document) =>
          document.artistIds.length === 0 &&
          document.projectIds.length === 0 &&
          document.giftIds.length === 0 &&
          document.artworkIds.length === 0
      )
    ).toBe(true);
    expect(
      publication.documents.filter((document) =>
        document.sourcePath.startsWith("records/institutional-practice/")
      )
    ).toEqual(documents);
    expect(
      publication.documents.some(
        (document) =>
          document.sourcePath === "docs/curatorial-publication-standard.md"
      )
    ).toBe(false);
    for (const document of documents) {
      expect(parseInstitutionalPracticeHeading(document.markdown)).toBe(
        document.title
      );
    }
  });

  it("keeps every profile id, slug, and source path unique", () => {
    expect(
      new Set(
        INSTITUTIONAL_PRACTICE_PROFILE_CONTRACTS.map((contract) => contract.id)
      ).size
    ).toBe(14);
    expect(
      new Set(
        INSTITUTIONAL_PRACTICE_PROFILE_CONTRACTS.map(
          (contract) => contract.slug
        )
      ).size
    ).toBe(14);
    expect(new Set(INSTITUTIONAL_PRACTICE_REQUIRED_PATHS).size).toBe(16);
    for (const contract of INSTITUTIONAL_PRACTICE_PROFILE_CONTRACTS) {
      expect(contract.id).toBe(`institutional-practice:${contract.slug}`);
      expect(contract.path).toBe(
        `records/institutional-practice/profiles/${contract.slug}.md`
      );
    }
  });

  it.each(INSTITUTIONAL_PRACTICE_REQUIRED_PATHS)(
    "fails the whole publication closed when %s is undeclared",
    async (path) => {
      const fixture = createCaseyFixture({ omittedManifestPath: path });
      const state = await new GitHubMuseumPublicationSource({
        ref: "main",
        assembler: legacyCaseyPublicationAssembler,
        fetch: fixture.fetch,
        now: () => new Date("2026-08-04T00:00:00Z"),
      }).load();

      expect(state).toMatchObject({
        status: "unavailable",
        publication: null,
        errorCode: "publication_required_path_undeclared",
      });
    }
  );

  it("fails closed when a manuscript title differs from its static contract", async () => {
    const path = "records/institutional-practice/profiles/tate.md";
    const fixture = createCaseyFixture({
      documentOverrides: {
        [path]: "# Tate Modern\n\nWrong institutional identity.",
      },
    });
    const state = await new GitHubMuseumPublicationSource({
      ref: "main",
      assembler: legacyCaseyPublicationAssembler,
      fetch: fixture.fetch,
    }).load();

    expect(state).toMatchObject({
      status: "unavailable",
      publication: null,
      errorCode: "publication_institutional_practice_title_mismatch",
    });
  });

  it("requires the exact heading as the manuscript's first line", async () => {
    const path = "records/institutional-practice/profiles/moma.md";
    const fixture = createCaseyFixture({
      documentOverrides: {
        [path]:
          "Editorial preface.\n\n# The Museum of Modern Art\n\nGoverned text.",
      },
    });
    const state = await new GitHubMuseumPublicationSource({
      ref: "main",
      assembler: legacyCaseyPublicationAssembler,
      fetch: fixture.fetch,
    }).load();

    expect(state).toMatchObject({
      status: "unavailable",
      publication: null,
      errorCode: "publication_institutional_practice_title_mismatch",
    });
  });

  it("fails closed when a manuscript has no level-one heading", async () => {
    const path = "records/institutional-practice/source-register.md";
    const fixture = createCaseyFixture({
      documentOverrides: {
        [path]: "## Source register: A field of practice",
      },
    });
    const state = await new GitHubMuseumPublicationSource({
      ref: "main",
      assembler: legacyCaseyPublicationAssembler,
      fetch: fixture.fetch,
    }).load();

    expect(state).toMatchObject({
      status: "unavailable",
      publication: null,
      errorCode: "publication_markdown_heading_missing",
    });
  });
});
