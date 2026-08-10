import {
  assertGovernedMuseumPath,
  buildImmutableMuseumBlobUrl,
} from "./security";
import { MUSEUM_DATA_ARCHITECTURE_STANDARD_COUNT } from "./dataArchitectureContract";
import type {
  MuseumInstitutionProfile,
  MuseumInstitutionalPractice,
  MuseumPublication,
  MuseumPublicDocument,
  MuseumPublicDocumentKind,
} from "./types";

const MUSEUM_ROOT = "/museum/network";
const ACCESSION_REGISTER_PATH = "records/accessions/register.json";
const GOVERNANCE_REGISTER_PATH = "records/governance/decisions.json";
const KEYS_AND_GATES_PATH = "docs/programs/keys-and-gates.md";
const RIGHTS_REGISTRY_PATH = "docs/rights/registry.json";
const RIGHTS_ROUTE = `${MUSEUM_ROOT}/research/rights`;
const INSTITUTIONAL_PRACTICE_ROUTE = `${MUSEUM_ROOT}/research/institutional-practice`;
const INSTITUTIONAL_PRACTICE_ADJACENT_ROUTE = `${INSTITUTIONAL_PRACTICE_ROUTE}/adjacent-practice`;
const SCHOLARSHIP_EDITORIAL_STANDARD_ROUTE = `${MUSEUM_ROOT}/research/scholarship-and-writing`;
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

function documentPathsForIds(
  publication: MuseumPublication,
  ids: readonly string[]
): readonly string[] {
  return ids.flatMap((id) => {
    const document = publication.documents.find((item) => item.id === id);
    return document === undefined ? [] : [document.sourcePath];
  });
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
  const candidate = practice as unknown as
    | {
        readonly introduction?: MuseumInstitutionalPractice["introduction"];
        readonly adjacentPractice?: MuseumInstitutionalPractice["adjacentPractice"];
        readonly editorialStandard?: MuseumInstitutionalPractice["editorialStandard"];
        readonly sourceRegister?: MuseumInstitutionalPractice["sourceRegister"];
        readonly profiles?: unknown;
      }
    | undefined;
  if (
    candidate?.introduction === undefined ||
    candidate.adjacentPractice === undefined ||
    candidate.editorialStandard === undefined ||
    candidate.sourceRegister === undefined ||
    !Array.isArray(candidate.profiles)
  ) {
    return false;
  }
  const sourcePathsMatch =
    candidate.introduction.sourcePath === INSTITUTIONAL_PRACTICE_STUDY_PATH &&
    candidate.adjacentPractice.sourcePath ===
      INSTITUTIONAL_PRACTICE_ADJACENT_PATH &&
    candidate.editorialStandard.sourcePath ===
      CURATORIAL_PUBLICATION_STANDARD_PATH &&
    candidate.sourceRegister.sourcePath ===
      INSTITUTIONAL_PRACTICE_SOURCE_REGISTER_PATH;
  const profiles =
    candidate.profiles as readonly Partial<MuseumInstitutionProfile>[];
  const profileCountMatches =
    profiles.length === INSTITUTIONAL_PRACTICE_PROFILE_SLUGS.length;
  const profilesMatch = profiles.every(
    (profile, index) =>
      profile.slug === INSTITUTIONAL_PRACTICE_PROFILE_SLUGS[index] &&
      profile.id === `institutional-practice:${profile.slug}` &&
      profile.document?.id === profile.id &&
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
  const typedWorkPath = publication.works?.[0]?.sourcePaths[0];
  const typedArtistPath = publication.artists[0]?.sourcePaths[0];
  const typedProjectPath = publication.projects[0]?.sourcePaths[0];
  const typedAcquisitionPath =
    publication.curatedAcquisitions?.[0]?.sourcePaths[0];
  const typedResearchPath = publication.researchPublications?.[0]?.sourcePath;
  const legacyProgramPath = publication.declaredSourcePaths.find((path) =>
    /^records\/programs\/[^/]+\/program\.json$/u.test(path)
  );
  const legacyProgramSelectionPath = publication.declaredSourcePaths.find(
    (path) => /^records\/programs\/[^/]+\/selected-works\.json$/u.test(path)
  );
  const typedKeysAndGatesProgram = publication.acquisitionPrograms?.find(
    (program) => program.slug === "keys-and-gates"
  );
  const typedKeysAndGatesPath =
    typedKeysAndGatesProgram === undefined
      ? undefined
      : (documentPathsForIds(
          publication,
          typedKeysAndGatesProgram.sourceDocumentIds
        )[0] ?? typedKeysAndGatesProgram.sourcePaths[0]);
  const keysAndGatesRelatedPath =
    typedKeysAndGatesPath ??
    (publication.acquisitionPrograms === undefined
      ? KEYS_AND_GATES_PATH
      : undefined);

  add(
    MUSEUM_ROOT,
    collectionEssay?.sourcePath ?? typedWorkPath ?? typedAcquisitionPath,
    keysAndGatesRelatedPath === undefined
      ? []
      : [{ path: keysAndGatesRelatedPath, label: "keysAndGates" }]
  );
  add(
    `${MUSEUM_ROOT}/collection`,
    collectionEssay?.sourcePath ?? typedWorkPath,
    [{ path: ACCESSION_REGISTER_PATH, label: "accessionRegister" }]
  );
  add(`${MUSEUM_ROOT}/artists`, artistProfile?.sourcePath ?? typedArtistPath);
  add(
    `${MUSEUM_ROOT}/projects`,
    collectionEssay?.sourcePath ?? typedProjectPath
  );
  add(`${MUSEUM_ROOT}/works`, collectionEssay?.sourcePath ?? typedWorkPath, [
    { path: ACCESSION_REGISTER_PATH, label: "accessionRegister" },
  ]);
  add(
    `${MUSEUM_ROOT}/acquisitions`,
    typedAcquisitionPath ?? collectionEssay?.sourcePath,
    [{ path: ACCESSION_REGISTER_PATH, label: "accessionRegister" }]
  );
  add(
    `${MUSEUM_ROOT}/research`,
    typedResearchPath ?? sourceMatrix?.sourcePath,
    [
      {
        path: CURATORIAL_PUBLICATION_STANDARD_PATH,
        label: "scholarshipStandard",
      },
    ]
  );
  if (publication.organizations !== undefined) {
    add(
      `${MUSEUM_ROOT}/organizations`,
      publication.organizations[0]?.sourcePaths[0]
    );
    for (const organization of publication.organizations) {
      add(
        `${MUSEUM_ROOT}/organizations/${encodeURIComponent(organization.slug)}`,
        organization.sourcePaths[0],
        organization.projectIds.map((projectId) => ({
          path: publication.projects.find((project) => project.id === projectId)
            ?.sourcePaths[0],
          label: "machineRecord" as const,
        }))
      );
    }
  }
  if (publication.acquisitionPrograms !== undefined) {
    add(
      `${MUSEUM_ROOT}/acquisition-programs`,
      publication.acquisitionPrograms[0]?.sourcePaths[0]
    );
    for (const program of publication.acquisitionPrograms) {
      add(
        `${MUSEUM_ROOT}/acquisition-programs/${encodeURIComponent(program.slug)}`,
        program.sourcePaths[0],
        [
          ...documentPathsForIds(publication, program.sourceDocumentIds).map(
            (path) => ({ path, label: "supportingRecord" as const })
          ),
          ...program.acquisitionIds.map((acquisitionId) => ({
            path: publication.curatedAcquisitions?.find(
              (acquisition) => acquisition.id === acquisitionId
            )?.sourcePaths[0],
            label: "supportingRecord" as const,
          })),
        ]
      );
    }
  } else if (legacyProgramPath !== undefined) {
    // Bounded pre-ontology adapter: the released AP-01 record predates typed
    // program entities. It supplies the canonical pathway page until the
    // source graph publishes the program and its document relations.
    add(
      `${MUSEUM_ROOT}/acquisition-programs/keys-and-gates`,
      legacyProgramPath,
      [
        { path: KEYS_AND_GATES_PATH, label: "supportingRecord" },
        { path: legacyProgramSelectionPath, label: "supportingRecord" },
      ]
    );
  }
  if (publication.curatedAcquisitions !== undefined) {
    for (const acquisition of publication.curatedAcquisitions) {
      add(
        `${MUSEUM_ROOT}/acquisitions/${encodeURIComponent(acquisition.slug)}`,
        acquisition.sourcePaths[0],
        acquisition.sourceDocumentIds.map((documentId) => ({
          path: publication.documents.find(
            (document) => document.id === documentId
          )?.sourcePath,
          label: "supportingRecord" as const,
        }))
      );
    }
  }
  if (publication.works !== undefined) {
    for (const work of publication.works) {
      add(
        `${MUSEUM_ROOT}/works/${encodeURIComponent(work.id)}`,
        work.sourcePaths[0],
        work.documentIds.map((documentId) => ({
          path: publication.documents.find(
            (document) => document.id === documentId
          )?.sourcePath,
          label: "supportingRecord" as const,
        }))
      );
    }
  }
  add(
    `${MUSEUM_ROOT}/research/sources-and-chronology`,
    sourceMatrix?.sourcePath
  );
  addInstitutionalPracticePageSources(publication, add);
  const dataArchitecture = (publication as Partial<MuseumPublication>)
    .dataArchitecture;
  if (
    dataArchitecture?.id === "6529NM_DATA_ARCHITECTURE_V1" &&
    dataArchitecture.standards.length ===
      MUSEUM_DATA_ARCHITECTURE_STANDARD_COUNT
  ) {
    const route = `${MUSEUM_ROOT}/research/data-architecture`;
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
  add(`${MUSEUM_ROOT}/about/governance`, GOVERNANCE_REGISTER_PATH);

  for (const decisionId of GOVERNANCE_DECISION_IDS) {
    add(
      `${MUSEUM_ROOT}/about/governance/${decisionId}`,
      GOVERNANCE_REGISTER_PATH
    );
  }

  for (const artist of publication.artists) {
    const document = firstDocument(
      publication,
      "artist_practice",
      (candidate) => candidate.artistIds.includes(artist.id)
    );
    const typedProfile = publication.documents.find(
      (candidate) =>
        candidate.kind === "artist_practice" &&
        artist.documentIds.includes(candidate.id)
    );
    const primaryPath =
      typedProfile?.sourcePath ?? document?.sourcePath ?? artist.sourcePaths[0];
    add(
      `${MUSEUM_ROOT}/artists/${encodeURIComponent(artist.slug)}`,
      primaryPath,
      [
        ...artist.sourcePaths.map((path) => ({
          path,
          label: "machineRecord" as const,
        })),
        { path: document?.sourcePath, label: "supportingRecord" as const },
      ]
    );
  }

  for (const project of publication.projects) {
    const document = firstDocument(publication, "project_essay", (candidate) =>
      candidate.projectIds.includes(project.id)
    );
    const typedEssay = publication.documents.find(
      (candidate) =>
        candidate.kind === "project_essay" &&
        project.documentIds.includes(candidate.id)
    );
    const primaryPath =
      typedEssay?.sourcePath ?? document?.sourcePath ?? project.sourcePaths[0];
    add(
      `${MUSEUM_ROOT}/projects/${encodeURIComponent(project.slug)}`,
      primaryPath,
      [
        ...project.sourcePaths.map((path) => ({
          path,
          label: "machineRecord" as const,
        })),
        { path: document?.sourcePath, label: "supportingRecord" as const },
      ]
    );
    if (CASEY_GENERATIVE_DOSSIER_SLUGS.has(project.slug)) {
      add(
        `${MUSEUM_ROOT}/projects/${encodeURIComponent(project.slug)}/system`,
        `${CASEY_GENERATIVE_DOSSIER_ROOT}/${project.slug}.md`,
        [{ path: document?.sourcePath, label: "projectEssay" }]
      );
    }
  }

  if (publication.researchPublications !== undefined) {
    for (const research of publication.researchPublications) {
      add(
        `${MUSEUM_ROOT}/research/${encodeURIComponent(research.slug)}`,
        research.sourcePath,
        [
          {
            path: publication.documents.find(
              (document) =>
                document.id === research.id ||
                buildImmutableMuseumBlobUrl(
                  publication.identity.commit,
                  document.sourcePath
                ) === research.publicationUri
            )?.sourcePath,
            label: "supportingRecord",
          },
        ]
      );
    }
  }
  for (const document of publication.documents) {
    if (
      document.kind === "collection_essay" ||
      document.kind === "artist_practice" ||
      document.kind === "project_essay" ||
      document.kind === "source_chronology_matrix" ||
      document.kind === "institutional_practice_study" ||
      document.kind === "institutional_practice_adjacent" ||
      document.kind === "scholarship_editorial_standard" ||
      document.kind === "data_architecture_overview" ||
      document.kind === "data_architecture_standard"
    ) {
      add(
        `${MUSEUM_ROOT}/research/${encodeURIComponent(document.id)}`,
        document.sourcePath
      );
    }
  }

  return [...routes.entries()]
    .map(([pathname, source]) => ({ pathname, source }))
    .sort((left, right) => left.pathname.localeCompare(right.pathname));
}
