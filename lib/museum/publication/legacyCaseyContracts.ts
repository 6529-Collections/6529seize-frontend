import {
  CASEY_ACCESSION_ID,
  CASEY_GIFT_AUTHORIZATION_PATH,
  CASEY_GIFT_NARRATIVE_PATH,
  CASEY_OBJECT_IDS,
  CASEY_OBJECT_PATHS,
  CASEY_SOURCE_MATRIX_PATH,
  CASEY_VISUAL_OBSERVATION_PATH,
} from "./legacyCaseyIdentifiers";
import { PROJECT_PUBLIC_DOCUMENTS } from "./legacyCaseyProjectDocuments";
import {
  MUSEUM_CONTRIBUTOR_GUIDE_PATH,
  MUSEUM_ONCHAIN_TRANSITION_PATH,
  MUSEUM_OPEN_STATEMENT_PATH,
} from "./openMuseum";
import { DATA_ARCHITECTURE_REQUIRED_PATHS } from "./dataArchitecture";
import { INSTITUTIONAL_PRACTICE_REQUIRED_PATHS } from "./institutionalPractice";
import { MUSEUM_RIGHTS_REQUIRED_PATHS } from "./rightsHandbook";
import type { MuseumPublicDocumentKind } from "./types";

interface PublicDocumentContract {
  readonly id: string;
  readonly path: string;
  readonly kind: MuseumPublicDocumentKind;
  readonly artworkId: string | null;
  readonly relation:
    | "institution"
    | "artist"
    | "gift"
    | "collection"
    | "object"
    | "research";
}

export function artworkIdsForDocument(
  contract: PublicDocumentContract
): readonly string[] {
  if (contract.relation === "research") {
    return [...CASEY_OBJECT_IDS];
  }
  return contract.artworkId === null ? [] : [contract.artworkId];
}

export const CASEY_PUBLIC_DOCUMENTS: readonly PublicDocumentContract[] = [
  {
    id: "founding-and-operating-principles",
    path: "policies/founding-and-operating-principles.md",
    kind: "founding_principles",
    artworkId: null,
    relation: "institution",
  },
  {
    id: "open-museum",
    path: MUSEUM_OPEN_STATEMENT_PATH,
    kind: "open_museum_statement",
    artworkId: null,
    relation: "institution",
  },
  {
    id: "onchain-transition",
    path: MUSEUM_ONCHAIN_TRANSITION_PATH,
    kind: "onchain_transition",
    artworkId: null,
    relation: "institution",
  },
  {
    id: "museum-contributor-guide",
    path: MUSEUM_CONTRIBUTOR_GUIDE_PATH,
    kind: "contributor_guide",
    artworkId: null,
    relation: "institution",
  },
  {
    id: "generative-system-analysis-standard",
    path: "docs/generative-system-analysis.md",
    kind: "source_record",
    artworkId: null,
    relation: "institution",
  },
  {
    id: "generative-trait-analysis",
    path: "docs/generative-trait-analysis.md",
    kind: "source_record",
    artworkId: null,
    relation: "institution",
  },
  {
    id: "casey-reas-artist-practice",
    path: `records/accessions/${CASEY_ACCESSION_ID}/public/casey-reas-artist-practice.md`,
    kind: "artist_practice",
    artworkId: null,
    relation: "artist",
  },
  {
    id: "casey-reas-collection-essay",
    path: `records/accessions/${CASEY_ACCESSION_ID}/public/casey-reas-collection-essay.md`,
    kind: "collection_essay",
    artworkId: null,
    relation: "collection",
  },
  {
    id: "casey-reas-curatorial-accession-review",
    path: `records/accessions/${CASEY_ACCESSION_ID}/public/curatorial-accession-review.md`,
    kind: "curatorial_accession_review",
    artworkId: null,
    relation: "gift",
  },
  {
    id: "casey-reas-accession-certificate",
    path: `records/accessions/${CASEY_ACCESSION_ID}/public/accession-certificate.md`,
    kind: "accession_certificate",
    artworkId: null,
    relation: "gift",
  },
  {
    id: "casey-reas-gift-acceptance-authorization",
    path: `records/accessions/${CASEY_ACCESSION_ID}/public/gift-acceptance-authorization.md`,
    kind: "gift_acceptance_authorization",
    artworkId: null,
    relation: "gift",
  },
  {
    id: "casey-reas-technical-condition-review",
    path: `records/accessions/${CASEY_ACCESSION_ID}/public/technical-and-condition-review.md`,
    kind: "technical_condition_review",
    artworkId: null,
    relation: "gift",
  },
  {
    id: "casey-reas-title-rights-accession-review",
    path: `records/accessions/${CASEY_ACCESSION_ID}/public/title-rights-and-accession-review.md`,
    kind: "title_rights_accession_review",
    artworkId: null,
    relation: "gift",
  },
  {
    id: "casey-reas-custody-title-compliance-diligence",
    path: `records/accessions/${CASEY_ACCESSION_ID}/public/custody-title-and-compliance-diligence.md`,
    kind: "custody_title_compliance_diligence",
    artworkId: null,
    relation: "gift",
  },
  {
    id: "casey-reas-gift-into-public-trust",
    path: CASEY_GIFT_NARRATIVE_PATH,
    kind: "gift_narrative",
    artworkId: null,
    relation: "gift",
  },
  {
    id: "casey-reas-source-and-chronology-matrix",
    path: CASEY_SOURCE_MATRIX_PATH,
    kind: "source_chronology_matrix",
    artworkId: null,
    relation: "research",
  },
  ...CASEY_OBJECT_IDS.map(
    (objectId): PublicDocumentContract => ({
      id: `${objectId}:public-entry`,
      path: `records/accessions/${CASEY_ACCESSION_ID}/public/${objectId}.md`,
      kind: "object_entry",
      artworkId: objectId,
      relation: "object",
    })
  ),
];

export const PROJECT_CONTRACTS = {
  "923 EMPTY ROOMS": {
    id: "casey-reas-923-empty-rooms",
    slug: "923-empty-rooms",
  },
  CENTURY: { id: "casey-reas-century", slug: "century" },
  "Ex Nihilo (Cosmos)": {
    id: "casey-reas-ex-nihilo-cosmos",
    slug: "ex-nihilo-cosmos",
  },
  Phototaxis: { id: "casey-reas-phototaxis", slug: "phototaxis" },
  "Pre-Process": { id: "casey-reas-pre-process", slug: "pre-process" },
} as const;

export const LEGACY_CASEY_REQUIRED_PATHS = [
  ...CASEY_OBJECT_PATHS,
  CASEY_VISUAL_OBSERVATION_PATH,
  CASEY_GIFT_AUTHORIZATION_PATH,
  ...CASEY_PUBLIC_DOCUMENTS.map((document) => document.path),
  ...PROJECT_PUBLIC_DOCUMENTS.map((document) => document.path),
  ...INSTITUTIONAL_PRACTICE_REQUIRED_PATHS,
  ...DATA_ARCHITECTURE_REQUIRED_PATHS,
  ...MUSEUM_RIGHTS_REQUIRED_PATHS,
] as const;
