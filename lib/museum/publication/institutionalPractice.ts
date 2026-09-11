import { parseHeading } from "./legacyCaseyMarkdown";
import type {
  MuseumInstitutionalPractice,
  MuseumInstitutionProfile,
  MuseumInstitutionProfileSlug,
  MuseumPublicDocument,
  MuseumPublicDocumentKind,
  MuseumSourceDocument,
} from "./types";
import { parseInstitutionalPracticeHeading } from "./institutionalPracticeMarkdown";

interface InstitutionalPracticeDocumentContract {
  readonly id: string;
  readonly path: string;
  readonly title: string;
  readonly kind: MuseumPublicDocumentKind;
}

interface InstitutionProfileContract extends InstitutionalPracticeDocumentContract {
  readonly id: `institutional-practice:${MuseumInstitutionProfileSlug}`;
  readonly slug: MuseumInstitutionProfileSlug;
  readonly kind: "institution_profile";
}

function profileContract(
  slug: MuseumInstitutionProfileSlug,
  title: string
): InstitutionProfileContract {
  const id: InstitutionProfileContract["id"] = `institutional-practice:${slug}`;
  return {
    id,
    slug,
    path: `records/institutional-practice/profiles/${slug}.md`,
    title,
    kind: "institution_profile",
  };
}

const INSTITUTIONAL_PRACTICE_OVERVIEW_CONTRACT = {
  id: "institutional-practice:a-field-of-practice",
  path: "records/institutional-practice/a-field-of-practice.md",
  title: "A field of practice",
  kind: "institutional_practice_study",
} as const satisfies InstitutionalPracticeDocumentContract;

export const INSTITUTIONAL_PRACTICE_PROFILE_CONTRACTS = [
  profileContract("met", "The Metropolitan Museum of Art"),
  profileContract("getty", "Getty"),
  profileContract("moma", "The Museum of Modern Art"),
  profileContract("whitney", "Whitney Museum of American Art"),
  profileContract("tate", "Tate"),
  profileContract("centre-pompidou", "Centre Pompidou"),
  profileContract("sfmoma", "San Francisco Museum of Modern Art"),
  profileContract("guggenheim", "Solomon R. Guggenheim Museum"),
  profileContract("zkm", "ZKM | Center for Art and Media"),
  profileContract("ars-electronica", "Ars Electronica"),
  profileContract("rhizome-new-museum", "Rhizome and the New Museum"),
  profileContract(
    "serpentine-arts-technologies",
    "Serpentine Arts Technologies"
  ),
  profileContract("v-and-a", "Victoria and Albert Museum"),
  profileContract("lacma", "Los Angeles County Museum of Art"),
  profileContract("hek-basel", "HEK Basel"),
  profileContract("li-ma", "LI-MA"),
  profileContract("v2", "V2_"),
  profileContract("transmediale", "transmediale"),
  profileContract("acmi", "ACMI — Collecting and Preserving Screen Culture"),
  profileContract("m-plus", "M+ — Collecting Digital and Moving-Image Culture"),
  profileContract(
    "nam-june-paik-art-center",
    "Nam June Paik Art Center — Collection, Archive, and Media-Art Scholarship"
  ),
  profileContract(
    "ntt-icc",
    "NTT InterCommunication Center [ICC] — Media-Art Collection and Archive"
  ),
  profileContract(
    "centro-multimedia",
    "Centro Multimedia, CENART — Research and Production Center"
  ),
  profileContract(
    "laboratorio-arte-alameda",
    "Laboratorio Arte Alameda — Research and Documentation Center"
  ),
  profileContract("dia", "Dia Art Foundation"),
  profileContract("walker-art-center", "Walker Art Center"),
  profileContract("mca-chicago", "Museum of Contemporary Art Chicago"),
] as const satisfies readonly InstitutionProfileContract[];

const INSTITUTIONAL_PRACTICE_ADJACENT_CONTRACT = {
  id: "institutional-practice:adjacent-chain-native-practice",
  path: "records/institutional-practice/adjacent-chain-native-practice.md",
  title:
    "Adjacent practice: platforms, archives, festivals, and chain-native systems",
  kind: "institutional_practice_adjacent",
} as const satisfies InstitutionalPracticeDocumentContract;

const SCHOLARSHIP_EDITORIAL_STANDARD_CONTRACT = {
  id: "institutional-practice:scholarship-editorial-standard",
  path: "docs/curatorial-publication-standard.md",
  title: "Writing the 6529 Network Museum",
  kind: "scholarship_editorial_standard",
} as const satisfies InstitutionalPracticeDocumentContract;

const INSTITUTIONAL_PRACTICE_SOURCE_REGISTER_CONTRACT = {
  id: "institutional-practice:source-register",
  path: "records/institutional-practice/source-register.md",
  title: "Source register: A field of practice",
  kind: "institutional_practice_source_register",
} as const satisfies InstitutionalPracticeDocumentContract;

export const INSTITUTIONAL_PRACTICE_DOCUMENT_CONTRACTS = [
  INSTITUTIONAL_PRACTICE_OVERVIEW_CONTRACT,
  ...INSTITUTIONAL_PRACTICE_PROFILE_CONTRACTS,
  INSTITUTIONAL_PRACTICE_ADJACENT_CONTRACT,
  SCHOLARSHIP_EDITORIAL_STANDARD_CONTRACT,
  INSTITUTIONAL_PRACTICE_SOURCE_REGISTER_CONTRACT,
] as const;

export const INSTITUTIONAL_PRACTICE_REQUIRED_PATHS =
  INSTITUTIONAL_PRACTICE_DOCUMENT_CONTRACTS.map((contract) => contract.path);

function assertClosedContractInventory(): void {
  const ids = new Set<string>();
  const paths = new Set<string>();
  const slugs = new Set<string>();
  for (const contract of INSTITUTIONAL_PRACTICE_DOCUMENT_CONTRACTS) {
    ids.add(contract.id);
    paths.add(contract.path);
    if ("slug" in contract) {
      slugs.add(contract.slug);
    }
  }
  if (
    ids.size !== 31 ||
    paths.size !== 31 ||
    slugs.size !== 27 ||
    INSTITUTIONAL_PRACTICE_REQUIRED_PATHS.some(
      (path) =>
        !(
          path.startsWith("records/institutional-practice/") ||
          path === "docs/curatorial-publication-standard.md"
        ) || !path.endsWith(".md")
    )
  ) {
    throw new Error("publication_institutional_practice_contract_invalid");
  }
}

assertClosedContractInventory();

function requiredMarkdownDocument(
  documents: ReadonlyMap<string, MuseumSourceDocument>,
  contract: InstitutionalPracticeDocumentContract
): MuseumPublicDocument {
  const source = documents.get(contract.path);
  if (source?.mediaType !== "text/markdown") {
    throw new Error("publication_required_document_missing");
  }

  const parsedHeading = parseHeading(source.text);
  const title = parseInstitutionalPracticeHeading(source.text);
  if (parsedHeading !== contract.title || title !== contract.title) {
    throw new Error("publication_institutional_practice_title_mismatch");
  }

  return {
    id: contract.id,
    kind: contract.kind,
    title,
    markdown: source.text,
    sha256: source.sha256,
    sourcePath: contract.path,
    artistIds: [],
    projectIds: [],
    giftIds: [],
    artworkIds: [],
  };
}

export function assembleInstitutionalPractice(
  documents: ReadonlyMap<string, MuseumSourceDocument>
): MuseumInstitutionalPractice {
  const introduction = requiredMarkdownDocument(
    documents,
    INSTITUTIONAL_PRACTICE_OVERVIEW_CONTRACT
  );
  const profiles = INSTITUTIONAL_PRACTICE_PROFILE_CONTRACTS.map(
    (contract): MuseumInstitutionProfile => ({
      id: contract.id,
      slug: contract.slug,
      document: requiredMarkdownDocument(documents, contract),
    })
  );
  const sourceRegister = requiredMarkdownDocument(
    documents,
    INSTITUTIONAL_PRACTICE_SOURCE_REGISTER_CONTRACT
  );
  const adjacentPractice = requiredMarkdownDocument(
    documents,
    INSTITUTIONAL_PRACTICE_ADJACENT_CONTRACT
  );
  const editorialStandard = requiredMarkdownDocument(
    documents,
    SCHOLARSHIP_EDITORIAL_STANDARD_CONTRACT
  );

  return {
    id: "institutional-practice:a-field-of-practice",
    slug: "a-field-of-practice",
    introduction,
    profiles,
    adjacentPractice,
    editorialStandard,
    sourceRegister,
  };
}

export function institutionalPracticeDocuments(
  practice: MuseumInstitutionalPractice
): readonly MuseumPublicDocument[] {
  return [
    practice.introduction,
    ...practice.profiles.map((profile) => profile.document),
    practice.adjacentPractice,
    practice.editorialStandard,
    practice.sourceRegister,
  ];
}
