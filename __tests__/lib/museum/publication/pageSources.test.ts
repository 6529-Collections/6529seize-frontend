import {
  buildMuseumPageSourceCatalog,
  GitHubMuseumPublicationSource,
  legacyCaseyPublicationAssembler,
  resolveMuseumPageSource,
  type MuseumPublication,
} from "@/lib/museum/publication";
import { createCaseyFixture } from "./fixture";

const EXTRA_DECLARED_PATHS = [
  "docs/curatorial-publication-standard.md",
  "docs/programs/keys-and-gates.md",
  "policies/donation-acceptance.md",
  "records/accessions/register.json",
  "records/governance/decisions.json",
  "records/programs/6529NM-AP-01/program.json",
  "records/programs/6529NM-AP-01/selected-works.json",
  ...Array.from(
    { length: 16 },
    (_, index) =>
      `records/programs/6529NM-AP-01/outcomes/OUT-${String(index + 1).padStart(3, "0")}.json`
  ),
] as const;

async function buildPublication(): Promise<MuseumPublication> {
  const state = await new GitHubMuseumPublicationSource({
    ref: "main",
    assembler: legacyCaseyPublicationAssembler,
    fetch: createCaseyFixture().fetch,
  }).load();
  if (state.status !== "current") {
    throw new Error("test_publication_missing");
  }
  return {
    ...state.publication,
    declaredSourcePaths: [
      ...state.publication.declaredSourcePaths,
      ...EXTRA_DECLARED_PATHS,
    ],
  };
}

describe("Museum page source projection", () => {
  let publication: MuseumPublication;

  beforeAll(async () => {
    publication = await buildPublication();
  });

  it.each([
    [
      "/museum/network",
      "records/accessions/6529NM.2026.001/public/casey-reas-collection-essay.md",
    ],
    [
      "/museum/network/collection",
      "records/accessions/6529NM.2026.001/public/casey-reas-collection-essay.md",
    ],
    [
      "/museum/network/artists/casey-reas",
      "records/accessions/6529NM.2026.001/public/casey-reas-artist-practice.md",
    ],
    [
      "/museum/network/projects/century",
      "records/accessions/6529NM.2026.001/public/projects/century.md",
    ],
    [
      "/museum/network/about/governance/6529NM-GOV-1052148",
      "records/governance/decisions.json",
    ],
    ["/museum/network/about", "docs/open-museum.md"],
    [
      "/museum/network/research/rights",
      "records/institutional-practice/rights-and-licenses.md",
    ],
    [
      "/museum/network/research/rights/artists",
      "records/institutional-practice/rights-for-artists.md",
    ],
    [
      "/museum/network/research/rights/collectors",
      "records/institutional-practice/rights-for-collectors.md",
    ],
    ["/museum/network/research/rights/cc-by-nc-4.0", "docs/rights/registry.json"],
    [
      "/museum/network/research/sources-and-chronology",
      "records/accessions/6529NM.2026.001/public/source-and-chronology-matrix.md",
    ],
    [
      "/museum/network/research/institutional-practice",
      "records/institutional-practice/a-field-of-practice.md",
    ],
    [
      "/museum/network/research/institutional-practice/met",
      "records/institutional-practice/profiles/met.md",
    ],
    [
      "/museum/network/research/institutional-practice/mca-chicago",
      "records/institutional-practice/profiles/mca-chicago.md",
    ],
    [
      "/museum/network/research/institutional-practice/adjacent-practice",
      "records/institutional-practice/adjacent-chain-native-practice.md",
    ],
    [
      "/museum/network/research/institutional-practice/sources",
      "records/institutional-practice/source-register.md",
    ],
    [
      "/museum/network/research/scholarship-and-writing",
      "docs/curatorial-publication-standard.md",
    ],
  ])("maps %s to an admitted exact source", (pathname, expectedPath) => {
    const catalog = buildMuseumPageSourceCatalog(publication);
    expect(resolveMuseumPageSource(pathname, catalog)?.primaryPath).toBe(
      expectedPath
    );
  });

  it("emits only paths admitted by the active publication manifest", () => {
    const admitted = new Set(publication.declaredSourcePaths);
    const catalog = buildMuseumPageSourceCatalog(publication);

    for (const route of catalog) {
      expect(admitted.has(route.source.primaryPath)).toBe(true);
      for (const relatedSource of route.source.relatedSources) {
        expect(admitted.has(relatedSource.path)).toBe(true);
      }
    }
  });

  it("uses closed visitor labels while retaining each immutable related path", () => {
    const source = resolveMuseumPageSource(
      "/museum/network/about",
      buildMuseumPageSourceCatalog(publication)
    );

    expect(source?.relatedSources).toEqual([
      {
        path: "docs/onchain-transition.md",
        label: "onchainTransition",
      },
      {
        path: "policies/founding-and-operating-principles.md",
        label: "foundingPrinciples",
      },
    ]);
  });

  it("grounds each Casey system study in its dossier and project essay", () => {
    const catalog = buildMuseumPageSourceCatalog(publication);
    const essayBySlug = {
      century: "century.md",
      "pre-process": "process-and-pre-process.md",
      phototaxis: "microimage-and-phototaxis.md",
      "923-empty-rooms": "atomism-and-923-empty-rooms.md",
      "ex-nihilo-cosmos": "still-life-and-ex-nihilo.md",
    } as const;
    for (const [slug, essay] of Object.entries(essayBySlug)) {
      const source = resolveMuseumPageSource(
        `/museum/network/projects/${slug}/system`,
        catalog
      );
      expect(source?.primaryPath).toBe(
        `notes/research/generative-systems/casey-reas/${slug}.md`
      );
      expect(source?.relatedSources).toContainEqual({
        path: `records/accessions/6529NM.2026.001/public/projects/${essay}`,
        label: "projectEssay",
      });
    }
  });

  it("names the institutional study's research apparatus precisely", () => {
    const catalog = buildMuseumPageSourceCatalog(publication);

    expect(
      resolveMuseumPageSource(
        "/museum/network/research/institutional-practice",
        catalog
      )?.relatedSources
    ).toEqual([
      {
        path: "records/institutional-practice/source-register.md",
        label: "primarySourceRegister",
      },
      {
        path: "docs/curatorial-publication-standard.md",
        label: "scholarshipStandard",
      },
    ]);
    expect(
      resolveMuseumPageSource(
        "/museum/network/research/institutional-practice/met",
        catalog
      )?.relatedSources
    ).toEqual([
      {
        path: "records/institutional-practice/a-field-of-practice.md",
        label: "institutionalStudy",
      },
      {
        path: "records/institutional-practice/source-register.md",
        label: "primarySourceRegister",
      },
    ]);
    expect(
      resolveMuseumPageSource(
        "/museum/network/research/scholarship-and-writing",
        catalog
      )?.relatedSources
    ).toEqual([
      {
        path: "records/institutional-practice/a-field-of-practice.md",
        label: "institutionalStudy",
      },
      {
        path: "records/institutional-practice/source-register.md",
        label: "primarySourceRegister",
      },
    ]);
  });

  it("joins a rights entry to its exact legal-code snapshot", () => {
    const source = resolveMuseumPageSource(
      "/museum/network/research/rights/cc-by-nc-4.0",
      buildMuseumPageSourceCatalog(publication)
    );

    expect(source).toEqual({
      primaryPath: "docs/rights/registry.json",
      relatedSources: [
        {
          path: "docs/rights/legal-texts/cc-by-nc-4.0.txt",
          label: "legalCode",
        },
      ],
    });
  });

  it("covers every rendered static route and every current dynamic route", () => {
    const catalog = buildMuseumPageSourceCatalog(publication);
    const renderedStaticRoutes = [
      "/museum/network",
      "/museum/network/about",
      "/museum/network/artists",
      "/museum/network/collection",
      "/museum/network/acquisitions",
      "/museum/network/about/governance",
      "/museum/network/projects",
      "/museum/network/works",
      "/museum/network/research",
      "/museum/network/research/rights",
      "/museum/network/research/rights/artists",
      "/museum/network/research/rights/collectors",
      "/museum/network/research/sources-and-chronology",
      "/museum/network/research/institutional-practice",
      "/museum/network/research/institutional-practice/adjacent-practice",
      "/museum/network/research/institutional-practice/sources",
      "/museum/network/research/scholarship-and-writing",
      "/museum/network/research/data-architecture",
    ];
    const dynamicRoutes = [
      ...publication.artists.map(
        (artist) => `/museum/network/artists/${encodeURIComponent(artist.slug)}`
      ),
      ...publication.projects.map(
        (project) =>
          `/museum/network/projects/${encodeURIComponent(project.slug)}`
      ),
      ...publication.projects.map(
        (project) =>
          `/museum/network/projects/${encodeURIComponent(project.slug)}/system`
      ),
      ...publication.institutionalPractice.profiles.map(
        (profile) =>
          `/museum/network/research/institutional-practice/${profile.slug}`
      ),
      ...publication.dataArchitecture.standards.map(
        (standard) =>
          `/museum/network/research/data-architecture/${standard.slug}`
      ),
      "/museum/network/research/data-architecture/casey-reas-implementation",
      ...publication.rightsHandbook.expressions.map(
        (expression) =>
          `/museum/network/research/rights/${encodeURIComponent(expression.id)}`
      ),
      ...[
        "6529NM-GOV-1052148",
        "6529NM-GOV-1052156",
        "6529NM-GOV-1052401",
        "6529NM-GOV-1052437",
        "6529NM-GOV-1052604",
        "6529NM-GOV-1052714",
        "6529NM-GOV-1052812",
        "6529NM-GOV-1069256",
      ].map((id) => `/museum/network/about/governance/${id}`),
    ];

    for (const pathname of [...renderedStaticRoutes, ...dynamicRoutes]) {
      expect(resolveMuseumPageSource(pathname, catalog)).not.toBeNull();
    }
  });

  it("leaves server-only legacy redirects unmapped so the target owns the source claim", () => {
    const catalog = buildMuseumPageSourceCatalog(publication);
    expect(
      resolveMuseumPageSource("/museum/network/collections", catalog)
    ).toBeNull();
    expect(
      resolveMuseumPageSource("/museum/network/collections/autoglyphs", catalog)
    ).toBeNull();
    expect(resolveMuseumPageSource("/museum/network/stories", catalog)).toBeNull();
    expect(resolveMuseumPageSource("/museum/network/methodology", catalog)).toBeNull();
    expect(resolveMuseumPageSource("/museum/network/governance", catalog)).toBeNull();
    expect(resolveMuseumPageSource("/museum/network/rights", catalog)).toBeNull();
    expect(
      resolveMuseumPageSource(
        "/museum/network/stories/a-field-of-practice",
        catalog
      )
    ).toBeNull();
  });

  it("fails closed for unknown routes, unsafe route text, and undeclared source paths", () => {
    const catalog = buildMuseumPageSourceCatalog(publication);
    expect(
      resolveMuseumPageSource("/museum/network/projects/not-governed", catalog)
    ).toBeNull();
    expect(
      resolveMuseumPageSource(
        "/museum/network/projects/../../RIGHTS.md",
        catalog
      )
    ).toBeNull();
    expect(
      resolveMuseumPageSource(
        "/museum/network/governance/6529NM-GOV-NOT-ADMITTED",
        catalog
      )
    ).toBeNull();

    const withoutProgramSource: MuseumPublication = {
      ...publication,
      declaredSourcePaths: publication.declaredSourcePaths.filter(
        (path) => path !== "docs/programs/keys-and-gates.md"
      ),
    };
    expect(
      resolveMuseumPageSource(
        "/museum/network/programs",
        buildMuseumPageSourceCatalog(withoutProgramSource)
      )
    ).toBeNull();

    const incompleteInstitutionalPractice: MuseumPublication = {
      ...publication,
      institutionalPractice: {
        ...publication.institutionalPractice,
        profiles: publication.institutionalPractice.profiles.slice(0, 13),
      },
    };
    expect(
      resolveMuseumPageSource(
        "/museum/network/research/institutional-practice",
        buildMuseumPageSourceCatalog(incompleteInstitutionalPractice)
      )
    ).toBeNull();
  });
});
