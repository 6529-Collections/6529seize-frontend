import { assertGovernedMuseumPath } from "./security";
import type {
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
  | "collectionEssay"
  | "foundingPrinciples"
  | "giftNarrative"
  | "keysAndGates"
  | "machineRecord"
  | "onchainTransition"
  | "programRecord"
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

export function buildMuseumPageSourceCatalog(
  publication: MuseumPublication
): MuseumPageSourceCatalog {
  const admittedPaths = admittedGovernedPaths(publication.declaredSourcePaths);
  const routes = new Map<string, MuseumPageSourceProjection>();

  const add = (
    pathname: string,
    primaryCandidate: string | null | undefined,
    relatedCandidates: readonly MuseumRelatedPageSourceCandidate[] = []
  ) => {
    const normalized = normalizedMuseumPathname(pathname);
    const primaryPath = admittedPath(admittedPaths, primaryCandidate);
    if (normalized === null || primaryPath === null || routes.has(normalized)) {
      return;
    }
    const relatedSources = admittedRelatedSources(
      admittedPaths,
      primaryPath,
      relatedCandidates
    );
    routes.set(normalized, { primaryPath, relatedSources });
  };

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
  add(`${MUSEUM_ROOT}/about`, openMuseum?.sourcePath, [
    { path: transition?.sourcePath, label: "onchainTransition" },
    { path: founding?.sourcePath, label: "foundingPrinciples" },
  ]);
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
