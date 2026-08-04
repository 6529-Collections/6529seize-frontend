import { parseHeading } from "./legacyCaseyMarkdown";
import type {
  MuseumInstitutionalPractice,
  MuseumInstitutionProfile,
  MuseumInstitutionProfileSlug,
  MuseumPublicDocument,
  MuseumPublicDocumentKind,
  MuseumSourceDocument,
} from "./types";

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

const INSTITUTIONAL_PRACTICE_OVERVIEW_CONTRACT = {
  id: "institutional-practice:a-field-of-practice",
  path: "records/institutional-practice/a-field-of-practice.md",
  title: "A field of practice",
  kind: "institutional_practice_study",
} as const satisfies InstitutionalPracticeDocumentContract;

export const INSTITUTIONAL_PRACTICE_PROFILE_CONTRACTS = [
  {
    id: "institutional-practice:met",
    slug: "met",
    path: "records/institutional-practice/profiles/met.md",
    title: "The Metropolitan Museum of Art",
    kind: "institution_profile",
  },
  {
    id: "institutional-practice:getty",
    slug: "getty",
    path: "records/institutional-practice/profiles/getty.md",
    title: "Getty",
    kind: "institution_profile",
  },
  {
    id: "institutional-practice:moma",
    slug: "moma",
    path: "records/institutional-practice/profiles/moma.md",
    title: "The Museum of Modern Art",
    kind: "institution_profile",
  },
  {
    id: "institutional-practice:whitney",
    slug: "whitney",
    path: "records/institutional-practice/profiles/whitney.md",
    title: "Whitney Museum of American Art",
    kind: "institution_profile",
  },
  {
    id: "institutional-practice:tate",
    slug: "tate",
    path: "records/institutional-practice/profiles/tate.md",
    title: "Tate",
    kind: "institution_profile",
  },
  {
    id: "institutional-practice:centre-pompidou",
    slug: "centre-pompidou",
    path: "records/institutional-practice/profiles/centre-pompidou.md",
    title: "Centre Pompidou",
    kind: "institution_profile",
  },
  {
    id: "institutional-practice:sfmoma",
    slug: "sfmoma",
    path: "records/institutional-practice/profiles/sfmoma.md",
    title: "San Francisco Museum of Modern Art",
    kind: "institution_profile",
  },
  {
    id: "institutional-practice:guggenheim",
    slug: "guggenheim",
    path: "records/institutional-practice/profiles/guggenheim.md",
    title: "Solomon R. Guggenheim Museum",
    kind: "institution_profile",
  },
  {
    id: "institutional-practice:zkm",
    slug: "zkm",
    path: "records/institutional-practice/profiles/zkm.md",
    title: "ZKM | Center for Art and Media",
    kind: "institution_profile",
  },
  {
    id: "institutional-practice:ars-electronica",
    slug: "ars-electronica",
    path: "records/institutional-practice/profiles/ars-electronica.md",
    title: "Ars Electronica",
    kind: "institution_profile",
  },
  {
    id: "institutional-practice:rhizome-new-museum",
    slug: "rhizome-new-museum",
    path: "records/institutional-practice/profiles/rhizome-new-museum.md",
    title: "Rhizome and the New Museum",
    kind: "institution_profile",
  },
  {
    id: "institutional-practice:serpentine-arts-technologies",
    slug: "serpentine-arts-technologies",
    path: "records/institutional-practice/profiles/serpentine-arts-technologies.md",
    title: "Serpentine Arts Technologies",
    kind: "institution_profile",
  },
  {
    id: "institutional-practice:v-and-a",
    slug: "v-and-a",
    path: "records/institutional-practice/profiles/v-and-a.md",
    title: "Victoria and Albert Museum",
    kind: "institution_profile",
  },
  {
    id: "institutional-practice:lacma",
    slug: "lacma",
    path: "records/institutional-practice/profiles/lacma.md",
    title: "Los Angeles County Museum of Art",
    kind: "institution_profile",
  },
] as const satisfies readonly InstitutionProfileContract[];

const INSTITUTIONAL_PRACTICE_SOURCE_REGISTER_CONTRACT = {
  id: "institutional-practice:source-register",
  path: "records/institutional-practice/source-register.md",
  title: "Source register: A field of practice",
  kind: "institutional_practice_source_register",
} as const satisfies InstitutionalPracticeDocumentContract;

export const INSTITUTIONAL_PRACTICE_DOCUMENT_CONTRACTS = [
  INSTITUTIONAL_PRACTICE_OVERVIEW_CONTRACT,
  ...INSTITUTIONAL_PRACTICE_PROFILE_CONTRACTS,
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
    ids.size !== 16 ||
    paths.size !== 16 ||
    slugs.size !== 14 ||
    INSTITUTIONAL_PRACTICE_REQUIRED_PATHS.some(
      (path) =>
        !path.startsWith("records/institutional-practice/") ||
        !path.endsWith(".md")
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

  const title = parseHeading(source.text);
  const firstLine = source.text.split(/\r?\n/u, 1)[0];
  if (title !== contract.title || firstLine !== `# ${contract.title}`) {
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

  return {
    id: "institutional-practice:a-field-of-practice",
    slug: "a-field-of-practice",
    introduction,
    profiles,
    sourceRegister,
  };
}

export function institutionalPracticeDocuments(
  practice: MuseumInstitutionalPractice
): readonly MuseumPublicDocument[] {
  return [
    practice.introduction,
    ...practice.profiles.map((profile) => profile.document),
    practice.sourceRegister,
  ];
}
