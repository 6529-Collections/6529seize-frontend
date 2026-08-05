import { assertGovernedMuseumPath } from "./security";
import { MUSEUM_DATA_ARCHITECTURE_STANDARD_COUNT } from "./dataArchitectureContract";
import type {
  MuseumInstitutionalPractice,
  MuseumPublication,
  MuseumPublicDocument,
  MuseumPublicDocumentKind,
} from "./types";

const MUSEUM_ROOT = "/museum/network";
const ACCESSION_REGISTER_PATH = "records/accessions/register.json";
const GOVERNANCE_REGISTER_PATH = "records/governance/decisions.json";
const KEYS_AND_GATES_PATH = "docs/programs/keys-and-gates.md";
const KEYS_AND_GATES_PROGRAM_PATH =
  "records/programs/6529NM-AP-01/program.json";
const KEYS_AND_GATES_SELECTION_PATH =
  "records/programs/6529NM-AP-01/selected-works.json";
const DONATION_POLICY_PATH = "policies/donation-acceptance.md";
const RIGHTS_REGISTRY_PATH = "docs/rights/registry.json";
const RIGHTS_ROUTE = `${MUSEUM_ROOT}/rights`;
const INSTITUTIONAL_PRACTICE_ROUTE = `${MUSEUM_ROOT}/stories/a-field-of-practice`;
const INSTITUTIONAL_PRACTICE_ADJACENT_ROUTE = `${INSTITUTIONAL_PRACTICE_ROUTE}/adjacent-practice`;
const SCHOLARSHIP_EDITORIAL_STANDARD_ROUTE = `${MUSEUM_ROOT}/stories/scholarship-and-writing`;
const INSTITUTIONAL_PRACTICE_STUDY_PATH =
  "records/institutional-practice/a-field-of-practice.md";
const INSTITUTIONAL_PRACTICE_ADJACENT_PATH =
  "records/institutional-practice/adjacent-chain-native-practice.md";
const INSTITUTIONAL_PRACTICE_SOURCE_REGISTER_PATH =
  "records/institutional-practice/source-register.md";
const CURATORIAL_PUBLICATION_STANDARD_PATH =
  "docs/curatorial-publication-standard.md";
const CASEY_GENERATIVE_DOSSIER_ROOT =
  "notes/research/generative-systems/casey-reas";
const CASEY_GENERATIVE_DOSSIER_SLUGS = new Set([
  "century",
  "pre-process",
  "phototaxis",
  "923-empty-rooms",
  "ex-nihilo-cosmos",
]);
const INSTITUTIONAL_PRACTICE_PROFILE_SLUGS = [
  "met",
  "getty",
  "moma",
  "whitney",
  "tate",
  "centre-pompidou",
  "sfmoma",
  "guggenheim",
  "zkm",
  "ars-electronica",
  "rhizome-new-museum",
  "serpentine-arts-technologies",
  "v-and-a",
  "lacma",
  "hek-basel",
  "li-ma",
  "v2",
  "transmediale",
  "acmi",
  "m-plus",
  "nam-june-paik-art-center",
  "ntt-icc",
  "centro-multimedia",
  "laboratorio-arte-alameda",
  "dia",
  "walker-art-center",
  "mca-chicago",
] as const;

const GOVERNANCE_DECISION_IDS = [
  "6529NM-GOV-1052148",
  "6529NM-GOV-1052156",
  "6529NM-GOV-1052401",
  "6529NM-GOV-1052437",
  "6529NM-GOV-1052604",
  "6529NM-GOV-1052714",
  "6529NM-GOV-1052812",
  "6529NM-GOV-1069256",
] as const;

const KEYS_AND_GATES_OUTCOME_IDS = Array.from(
  { length: 16 },
  (_, index) => `6529NM-AP-01-OUT-${String(index + 1).padStart(3, "0")}`
);

interface MuseumPageSourceProjection {
  readonly primaryPath: string;
  readonly relatedSources: readonly MuseumRelatedPageSource[];
}

export type MuseumRelatedPageSourceLabel =
  | "accessionRecord"
  | "accessionRegister"
  | "applicationProfile"
  | "collectionEssay"
  | "foundingPrinciples"
  | "giftNarrative"
  | "keysAndGates"
  | "machineRecord"
  | "institutionalStudy"
  | "implementationAudit"
  | "machineSchedule"
  | "onchainTransition"
  | "primarySourceRegister"
  | "projectEssay"
  | "programRecord"
  | "rightsRegistry"
  | "legalCode"
  | "scholarshipStandard"
  | "selectedWorks"
  | "supportingRecord";

interface MuseumRelatedPageSource {
  readonly path: string;
  readonly label: MuseumRelatedPageSourceLabel;
}

interface MuseumRelatedPageSourceCandidate {
  readonly path: string | null | undefined;
  readonly label: MuseumRelatedPageSourceLabel;
}

type AddMuseumPageSource = (
  pathname: string,
  primaryCandidate: string | null | undefined,
  relatedCandidates?: readonly MuseumRelatedPageSourceCandidate[]
) => void;

export interface MuseumPageSourceRoute {
  readonly pathname: string;
  readonly source: MuseumPageSourceProjection;
}

export type MuseumPageSourceCatalog = readonly MuseumPageSourceRoute[];

function firstDocument(
  publication: MuseumPublication,
  kind: MuseumPublicDocumentKind,
  predicate: (document: MuseumPublicDocument) => boolean = () => true
): MuseumPublicDocument | null {
  return (
    publication.documents.find(
      (document) => document.kind === kind && predicate(document)
    ) ?? null
  );
}

function normalizedMuseumPathname(pathname: string): string | null {
  if (
    pathname.length === 0 ||
    pathname.length > 512 ||
    !pathname.startsWith(MUSEUM_ROOT) ||
    pathname.includes("\\") ||
    pathname.includes("?") ||
    pathname.includes("#") ||
    pathname.includes("//")
  ) {
    return null;
  }
  const normalized = pathname.endsWith("/") ? pathname.slice(0, -1) : pathname;
  return normalized.length === 0 ? "/" : normalized;
}

export function resolveMuseumPageSource(
  pathname: string,
  catalog: MuseumPageSourceCatalog
): MuseumPageSourceProjection | null {
  const normalized = normalizedMuseumPathname(pathname);
  if (normalized === null) {
    return null;
  }
  return catalog.find((route) => route.pathname === normalized)?.source ?? null;
}

function admittedGovernedPaths(paths: readonly string[]): ReadonlySet<string> {
  return new Set(
    paths.filter((path) => {
      try {
        assertGovernedMuseumPath(path);
        return true;
      } catch {
        return false;
      }
    })
  );
}

function admittedPath(
  paths: ReadonlySet<string>,
  candidate: string | null | undefined
): string | null {
  return candidate !== null && candidate !== undefined && paths.has(candidate)
    ? candidate
    : null;
}

function admittedRelatedSources(
  paths: ReadonlySet<string>,
  primaryPath: string,
  candidates: readonly MuseumRelatedPageSourceCandidate[]
): MuseumRelatedPageSource[] {
  return candidates.reduce<MuseumRelatedPageSource[]>((sources, candidate) => {
    const path = admittedPath(paths, candidate.path);
    if (
      path !== null &&
      path !== primaryPath &&
      !sources.some((source) => source.path === path) &&
      sources.length < 2
    ) {
      sources.push({ path, label: candidate.label });
    }
    return sources;
  }, []);
}

function addMuseumPageSource(
  routes: Map<string, MuseumPageSourceProjection>,
  admittedPaths: ReadonlySet<string>,
  pathname: string,
  primaryCandidate: string | null | undefined,
  relatedCandidates: readonly MuseumRelatedPageSourceCandidate[] = []
): void {
  const normalized = normalizedMuseumPathname(pathname);
  const primaryPath = admittedPath(admittedPaths, primaryCandidate);
  if (normalized === null || primaryPath === null || routes.has(normalized)) {
    return;
  }
  routes.set(normalized, {
    primaryPath,
    relatedSources: admittedRelatedSources(
      admittedPaths,
      primaryPath,
      relatedCandidates
    ),
  });
}

function hasCompleteInstitutionalPractice(
  practice: MuseumInstitutionalPractice | undefined
): practice is MuseumInstitutionalPractice {
  if (practice === undefined) return false;
  const sourcePathsMatch =
    practice.introduction.sourcePath === INSTITUTIONAL_PRACTICE_STUDY_PATH &&
    practice.adjacentPractice.sourcePath ===
      INSTITUTIONAL_PRACTICE_ADJACENT_PATH &&
    practice.editorialStandard.sourcePath ===
      CURATORIAL_PUBLICATION_STANDARD_PATH &&
    practice.sourceRegister.sourcePath ===
      INSTITUTIONAL_PRACTICE_SOURCE_REGISTER_PATH;
  const profileCountMatches =
    practice.profiles.length === INSTITUTIONAL_PRACTICE_PROFILE_SLUGS.length;
  const profilesMatch = practice.profiles.every(
    (profile, index) =>
      profile.slug === INSTITUTIONAL_PRACTICE_PROFILE_SLUGS[index] &&
      profile.id === `institutional-practice:${profile.slug}` &&
      profile.document.id === profile.id &&
      profile.document.sourcePath ===
        `records/institutional-practice/profiles/${profile.slug}.md`
  );
  return sourcePathsMatch && profileCountMatches && profilesMatch;
}

function addInstitutionalPracticePageSources(
  publication: MuseumPublication,
  add: AddMuseumPageSource
): void {
  const practice = (publication as Partial<MuseumPublication>)
    .institutionalPractice;
  if (!hasCompleteInstitutionalPractice(practice)) return;

  add(INSTITUTIONAL_PRACTICE_ROUTE, practice.introduction.sourcePath, [
    {
      path: practice.sourceRegister.sourcePath,
      label: "primarySourceRegister",
    },
    {
      path: CURATORIAL_PUBLICATION_STANDARD_PATH,
      label: "scholarshipStandard",
    },
  ]);
  add(
    `${INSTITUTIONAL_PRACTICE_ROUTE}/sources`,
    practice.sourceRegister.sourcePath,
    [
      {
        path: practice.introduction.sourcePath,
        label: "institutionalStudy",
      },
      {
        path: CURATORIAL_PUBLICATION_STANDARD_PATH,
        label: "scholarshipStandard",
      },
    ]
  );
  add(
    INSTITUTIONAL_PRACTICE_ADJACENT_ROUTE,
    practice.adjacentPractice.sourcePath,
    [
      {
        path: practice.introduction.sourcePath,
        label: "institutionalStudy",
      },
      {
        path: practice.sourceRegister.sourcePath,
        label: "primarySourceRegister",
      },
    ]
  );
  add(
    SCHOLARSHIP_EDITORIAL_STANDARD_ROUTE,
    practice.editorialStandard.sourcePath,
    [
      {
        path: practice.introduction.sourcePath,
        label: "institutionalStudy",
      },
      {
        path: practice.sourceRegister.sourcePath,
        label: "primarySourceRegister",
      },
    ]
  );
  for (const profile of practice.profiles) {
    add(
      `${INSTITUTIONAL_PRACTICE_ROUTE}/${profile.slug}`,
      profile.document.sourcePath,
      [
        {
          path: practice.introduction.sourcePath,
          label: "institutionalStudy",
        },
        {
          path: practice.sourceRegister.sourcePath,
          label: "primarySourceRegister",
        },
      ]
    );
  }
}

function addRightsPageSources(
  publication: MuseumPublication,
  add: AddMuseumPageSource
): void {
  const handbook = publication.rightsHandbook;
  add(RIGHTS_ROUTE, handbook.introduction.sourcePath, [
    { path: RIGHTS_REGISTRY_PATH, label: "rightsRegistry" },
    { path: handbook.artistGuide.sourcePath, label: "supportingRecord" },
  ]);
  add(`${RIGHTS_ROUTE}/artists`, handbook.artistGuide.sourcePath, [
    { path: RIGHTS_REGISTRY_PATH, label: "rightsRegistry" },
    { path: handbook.collectorGuide.sourcePath, label: "supportingRecord" },
  ]);
  add(`${RIGHTS_ROUTE}/collectors`, handbook.collectorGuide.sourcePath, [
    { path: RIGHTS_REGISTRY_PATH, label: "rightsRegistry" },
    { path: handbook.artistGuide.sourcePath, label: "supportingRecord" },
  ]);
  for (const expression of handbook.expressions) {
    add(
      `${RIGHTS_ROUTE}/${encodeURIComponent(expression.id)}`,
      RIGHTS_REGISTRY_PATH,
      [{ path: expression.legalCode?.path, label: "legalCode" }]
    );
  }
}

export function buildMuseumPageSourceCatalog(
  publication: MuseumPublication
): MuseumPageSourceCatalog {
  const admittedPaths = admittedGovernedPaths(publication.declaredSourcePaths);
  const routes = new Map<string, MuseumPageSourceProjection>();

  const add = (
    pathname: string,
    primaryCandidate: string | null | undefined,
    relatedCandidates: readonly MuseumRelatedPageSourceCandidate[] = []
  ) =>
    addMuseumPageSource(
      routes,
      admittedPaths,
      pathname,
      primaryCandidate,
      relatedCandidates
    );

  const openMuseum = firstDocument(publication, "open_museum_statement");
  const transition = firstDocument(publication, "onchain_transition");
  const founding = firstDocument(publication, "founding_principles");
  const collectionEssay = firstDocument(publication, "collection_essay");
  const artistProfile = firstDocument(publication, "artist_practice");
  const sourceMatrix = firstDocument(publication, "source_chronology_matrix");
  const giftNarrative = firstDocument(publication, "gift_narrative");

  add(MUSEUM_ROOT, collectionEssay?.sourcePath, [
    { path: KEYS_AND_GATES_PATH, label: "keysAndGates" },
  ]);
  add(`${MUSEUM_ROOT}/collection`, collectionEssay?.sourcePath, [
    { path: ACCESSION_REGISTER_PATH, label: "accessionRegister" },
  ]);
  add(`${MUSEUM_ROOT}/artists`, artistProfile?.sourcePath);
  add(`${MUSEUM_ROOT}/stories`, sourceMatrix?.sourcePath, [
    { path: collectionEssay?.sourcePath, label: "collectionEssay" },
    { path: giftNarrative?.sourcePath, label: "giftNarrative" },
  ]);
  add(`${MUSEUM_ROOT}/stories/source-and-chronology`, sourceMatrix?.sourcePath);
  addInstitutionalPracticePageSources(publication, add);
  const dataArchitecture = (publication as Partial<MuseumPublication>)
    .dataArchitecture;
  if (
    dataArchitecture?.id === "6529NM_DATA_ARCHITECTURE_V1" &&
    dataArchitecture.standards.length ===
      MUSEUM_DATA_ARCHITECTURE_STANDARD_COUNT
  ) {
    const route = `${MUSEUM_ROOT}/methodology/data-architecture`;
    add(route, dataArchitecture.introduction.sourcePath, [
      {
        path: dataArchitecture.profileSourcePath,
        label: "applicationProfile",
      },
      {
        path: dataArchitecture.caseyImplementation.sourcePath,
        label: "implementationAudit",
      },
    ]);
    for (const standard of dataArchitecture.standards) {
      add(`${route}/${standard.slug}`, standard.document.sourcePath, [
        {
          path: dataArchitecture.profileSourcePath,
          label: "applicationProfile",
        },
        {
          path: dataArchitecture.caseyImplementation.sourcePath,
          label: "implementationAudit",
        },
      ]);
    }
    add(
      `${route}/casey-reas-implementation`,
      dataArchitecture.caseyImplementation.sourcePath,
      [
        {
          path: dataArchitecture.caseySchedule.sourcePath,
          label: "machineSchedule",
        },
        {
          path: dataArchitecture.profileSourcePath,
          label: "applicationProfile",
        },
      ]
    );
  }
  add(`${MUSEUM_ROOT}/about`, openMuseum?.sourcePath, [
    { path: transition?.sourcePath, label: "onchainTransition" },
    { path: founding?.sourcePath, label: "foundingPrinciples" },
  ]);
  addRightsPageSources(publication, add);
  add(`${MUSEUM_ROOT}/methodology`, DONATION_POLICY_PATH, [
    { path: founding?.sourcePath, label: "foundingPrinciples" },
  ]);
  add(`${MUSEUM_ROOT}/accessions`, ACCESSION_REGISTER_PATH);
  add(`${MUSEUM_ROOT}/programs`, KEYS_AND_GATES_PATH, [
    { path: KEYS_AND_GATES_PROGRAM_PATH, label: "programRecord" },
    { path: KEYS_AND_GATES_SELECTION_PATH, label: "selectedWorks" },
  ]);
  add(`${MUSEUM_ROOT}/programs/6529NM-AP-01`, KEYS_AND_GATES_PROGRAM_PATH, [
    { path: KEYS_AND_GATES_PATH, label: "keysAndGates" },
    { path: KEYS_AND_GATES_SELECTION_PATH, label: "selectedWorks" },
  ]);
  add(`${MUSEUM_ROOT}/governance`, GOVERNANCE_REGISTER_PATH);

  for (const decisionId of GOVERNANCE_DECISION_IDS) {
    add(`${MUSEUM_ROOT}/governance/${decisionId}`, GOVERNANCE_REGISTER_PATH);
  }

  for (const outcomeId of KEYS_AND_GATES_OUTCOME_IDS) {
    const outcomeNumber = outcomeId.slice(-3);
    add(
      `${MUSEUM_ROOT}/objects/${outcomeId}`,
      `records/programs/6529NM-AP-01/outcomes/OUT-${outcomeNumber}.json`,
      [{ path: KEYS_AND_GATES_SELECTION_PATH, label: "selectedWorks" }]
    );
  }

  for (const artist of publication.artists) {
    const document = firstDocument(
      publication,
      "artist_practice",
      (candidate) => candidate.artistIds.includes(artist.id)
    );
    add(
      `${MUSEUM_ROOT}/artists/${encodeURIComponent(artist.slug)}`,
      document?.sourcePath,
      artist.sourcePaths.map((path) => ({ path, label: "machineRecord" }))
    );
  }

  for (const project of publication.projects) {
    const document = firstDocument(publication, "project_essay", (candidate) =>
      candidate.projectIds.includes(project.id)
    );
    add(
      `${MUSEUM_ROOT}/projects/${encodeURIComponent(project.slug)}`,
      document?.sourcePath,
      project.sourcePaths.map((path) => ({ path, label: "machineRecord" }))
    );
    if (CASEY_GENERATIVE_DOSSIER_SLUGS.has(project.slug)) {
      add(
        `${MUSEUM_ROOT}/projects/${encodeURIComponent(project.slug)}/system`,
        `${CASEY_GENERATIVE_DOSSIER_ROOT}/${project.slug}.md`,
        [{ path: document?.sourcePath, label: "projectEssay" }]
      );
    }
  }

  for (const gift of publication.gifts) {
    const narrative = firstDocument(publication, "gift_narrative", (document) =>
      document.giftIds.includes(gift.id)
    );
    const relatedDocuments: MuseumRelatedPageSourceCandidate[] =
      publication.documents
        .filter(
          (document) =>
            document.giftIds.includes(gift.id) && document.id !== narrative?.id
        )
        .map((document) => ({
          path: document.sourcePath,
          label:
            document.kind === "collection_essay"
              ? "collectionEssay"
              : "supportingRecord",
        }));
    for (const family of ["gifts", "accessions"] as const) {
      add(
        `${MUSEUM_ROOT}/${family}/${encodeURIComponent(gift.accessionLotId)}`,
        narrative?.sourcePath ?? gift.sourcePath,
        [
          { path: gift.sourcePath, label: "accessionRecord" },
          ...relatedDocuments,
        ]
      );
    }
  }

  for (const artwork of publication.artworks) {
    const publicEntry = firstDocument(publication, "object_entry", (document) =>
      document.artworkIds.includes(artwork.id)
    );
    for (const family of ["collection", "objects"] as const) {
      add(
        `${MUSEUM_ROOT}/${family}/${encodeURIComponent(artwork.id)}`,
        publicEntry?.sourcePath ?? artwork.sourcePath,
        [{ path: artwork.sourcePath, label: "machineRecord" }]
      );
    }
  }

  return [...routes.entries()]
    .map(([pathname, source]) => ({ pathname, source }))
    .sort((left, right) => left.pathname.localeCompare(right.pathname));
}
