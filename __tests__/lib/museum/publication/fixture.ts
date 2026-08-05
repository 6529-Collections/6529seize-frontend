import { createHash } from "node:crypto";
import {
  INSTITUTIONAL_PRACTICE_DOCUMENT_CONTRACTS,
  LEGACY_CASEY_REQUIRED_PATHS,
  MUSEUM_RIGHTS_ARTIST_GUIDE_PATH,
  MUSEUM_RIGHTS_COLLECTOR_GUIDE_PATH,
  MUSEUM_RIGHTS_INTRODUCTION_PATH,
  MUSEUM_RIGHTS_LEGAL_TEXT_PATHS,
  MUSEUM_RIGHTS_REGISTRY_PATH,
} from "@/lib/museum/publication";

export const EXACT_COMMIT = "a".repeat(40);

const CASEY_OBJECTS = [
  {
    id: "6529NM.2026.001.01",
    title: "CENTURY #31",
    project: "CENTURY",
    platform: "Art Blocks Curated",
    year: 2021,
    contract: "a7d8d9ef8d8ce8992df33d8b8cf4aebabd5bd270",
    token: "100000031",
  },
  {
    id: "6529NM.2026.001.02",
    title: "CENTURY #724",
    project: "CENTURY",
    platform: "Art Blocks Curated",
    year: 2021,
    contract: "a7d8d9ef8d8ce8992df33d8b8cf4aebabd5bd270",
    token: "100000724",
  },
  {
    id: "6529NM.2026.001.03",
    title: "CENTURY #401",
    project: "CENTURY",
    platform: "Art Blocks Curated",
    year: 2021,
    contract: "a7d8d9ef8d8ce8992df33d8b8cf4aebabd5bd270",
    token: "100000401",
  },
  {
    id: "6529NM.2026.001.04",
    title: "Pre-Process #63",
    project: "Pre-Process",
    platform: "Art Blocks Curated",
    year: 2022,
    contract: "99a9b7c1116f9ceeb1652de04d5969cce509b069",
    token: "383000063",
  },
  {
    id: "6529NM.2026.001.05",
    title: "Phototaxis #308",
    project: "Phototaxis",
    platform: "Art Blocks Playground",
    year: 2021,
    contract: "a7d8d9ef8d8ce8992df33d8b8cf4aebabd5bd270",
    token: "164000308",
  },
  {
    id: "6529NM.2026.001.06",
    title: "923 EMPTY ROOMS #713",
    project: "923 EMPTY ROOMS",
    platform: "Art Blocks x Bright Moments",
    year: 2023,
    contract: "145789247973c5d612bf121e9e4eef84b63eb707",
    token: "1000713",
  },
  {
    id: "6529NM.2026.001.07",
    title: "Ex Nihilo (Cosmos) #248",
    project: "Ex Nihilo (Cosmos)",
    platform: "Art Blocks Studio | 92",
    year: 2026,
    contract: "0000000c687daed0fba60d1dba4e5f6149e8b894",
    token: "248",
  },
] as const;

function sha256(text: string): `sha256:${string}` {
  return `sha256:${createHash("sha256").update(text, "utf8").digest("hex")}`;
}

function objectPath(id: string): string {
  return `records/accessions/6529NM.2026.001/objects/${id}.json`;
}

function buildBaseDocuments(): Record<string, string> {
  const documents: Record<string, string> = {};
  for (const slug of [
    "century",
    "pre-process",
    "phototaxis",
    "923-empty-rooms",
    "ex-nihilo-cosmos",
  ]) {
    documents[`notes/research/generative-systems/casey-reas/${slug}.md`] =
      `# ${slug}\n\nGoverned technical study.`;
  }
  for (const artwork of CASEY_OBJECTS) {
    documents[objectPath(artwork.id)] = JSON.stringify({
      envelope: { event_type: "MUSEUM_RECORD_COMMITTED" },
      payload: {
        object_id: artwork.id,
        accession_lot_id: "6529NM.2026.001",
        current_state: "accessioned",
        title: artwork.title,
        artist: { preferred_name: "Casey REAS" },
        project: {
          name: artwork.project,
          platform: artwork.platform,
          release_year: artwork.year,
          platform_metadata_license_label: "CC BY-NC 4.0",
        },
        medium:
          "On-chain generative software associated with an ERC-721 token.",
        credit_line: `Gift of punk6529; Casey REAS; ${artwork.title}; 6529 Network Museum, ${artwork.id}. Licensed CC BY-NC 4.0.`,
      },
    });
  }

  documents[
    "records/accessions/6529NM.2026.001/visual-observation-record.json"
  ] = JSON.stringify({
    payload: {
      objects: CASEY_OBJECTS.map((artwork) => {
        const imageUrl = `https://media-proxy.artblocks.io/1/0x${artwork.contract}/${artwork.token}.png`;
        const generatorUrl = `https://generator.artblocks.io/1/0x${artwork.contract}/${artwork.token}`;
        return {
          object_id: artwork.id,
          raw_metadata_source: {
            image_url: imageUrl,
            generator_url: generatorUrl,
          },
          static_capture: {
            source_url: imageUrl,
            media_type: "image/png",
            retention: { bytes_retained_in_public_repository: false },
          },
          live_capture: {
            source_url: generatorUrl,
            retention: { bytes_retained_in_public_repository: false },
          },
        };
      }),
    },
  });

  documents[
    "records/accessions/6529NM.2026.001/gift-acceptance-authorization.json"
  ] = JSON.stringify({
    payload: {
      subject_id: "6529NM.2026.001",
      authorization_id: "6529NM.2026.001.GAA-01",
      acquisition_method: "donation",
      authorization_status: "formally_accepted",
      completion_boundary: { current_state: "accessioned" },
      donor_public_credit: "punk6529",
      formal_acceptance_date: "2026-08-01T22:55:00Z",
      assets: CASEY_OBJECTS.map((artwork) => ({ object_id: artwork.id })),
    },
  });

  for (const path of LEGACY_CASEY_REQUIRED_PATHS) {
    if (path.endsWith(".md")) {
      const stem = path.split("/").at(-1)?.replace(/\.md$/u, "") ?? "Museum";
      const heading =
        stem === "gift-into-public-trust" ? "Gift into Public Trust" : stem;
      documents[path] = `# ${heading}\n\nGoverned public writing.`;
    }
  }
  for (const contract of INSTITUTIONAL_PRACTICE_DOCUMENT_CONTRACTS) {
    documents[contract.path] =
      `# ${contract.title}\n\nGoverned institutional research.`;
  }
  const architectureStandards = [
    [
      "spectrum",
      "Spectrum 5.1",
      "Spectrum 5.1: the work of running a collection",
      "operational",
    ],
    [
      "cidoc-crm",
      "CIDOC CRM",
      "CIDOC CRM: a history made of events",
      "source_fields_present",
    ],
    [
      "lido",
      "LIDO",
      "LIDO: a public catalogue record that can travel",
      "source_fields_present",
    ],
    [
      "premis",
      "PREMIS",
      "PREMIS: keeping a digital artwork usable",
      "source_fields_present",
    ],
    [
      "prov-o",
      "PROV-O",
      "PROV-O: following the evidence",
      "source_fields_present",
    ],
    [
      "getty-aat-ulan",
      "Getty AAT and ULAN",
      "Getty AAT and ULAN: shared names for art and artists",
      "conceptual_mapping",
    ],
    [
      "iiif",
      "IIIF Presentation API",
      "IIIF: a shared plan for presenting digital objects",
      "conceptual_mapping",
    ],
    [
      "c2pa",
      "C2PA Content Credentials",
      "C2PA: signed claims about media",
      "conceptual_mapping",
    ],
    [
      "bagit",
      "BagIt",
      "BagIt: a package that can be checked on arrival",
      "conceptual_mapping",
    ],
    ["ocfl", "OCFL", "OCFL: preserving every version", "conceptual_mapping"],
    [
      "caip-19",
      "CAIP-19",
      "CAIP-19: an address for a chain asset",
      "source_fields_present",
    ],
  ] as const;
  documents["docs/data-architecture.md"] =
    "# How the Museum knows and cares for art\n\nA public introduction to the Museum data architecture.";
  for (const [slug, , title] of architectureStandards) {
    documents[`docs/data-architecture/${slug}.md`] =
      `# ${title}\n\n## The question\n\nA governed standards profile.`;
  }
  documents["docs/data-architecture/casey-reas-implementation.md"] =
    "# Casey Reas: the first implementation audit\n\nThe first accession tests the architecture against seven works.";
  documents["docs/data-architecture/profile.json"] = JSON.stringify({
    profile_id: "6529NM_DATA_ARCHITECTURE_V1",
    profile_version: "1.0.0",
    status: "working_standard",
    observed_on: "2026-08-05",
    title: "How the Museum knows and cares for art",
    source_document: "docs/data-architecture.md",
    implementation_states: [
      "conceptual_mapping",
      "source_fields_present",
      "serialized",
      "validated",
      "operational",
    ],
    standards: architectureStandards.map(([slug, name, , caseyState]) => ({
      slug,
      name,
      category: `${slug}_category`,
      human_question: `What does ${name} contribute?`,
      authority: `${name} authority`,
      version: "test-version",
      authority_status: "current",
      official_url: `https://example.test/${slug}`,
      document_path: `docs/data-architecture/${slug}.md`,
      casey_state: caseyState,
    })),
    case_study_path: "docs/data-architecture/casey-reas-implementation.md",
    case_study_data_path:
      "docs/data-architecture/casey-reas-machine-schedule.json",
    stream_convergence: {
      normative_for_profile: false,
      status: "deferred_until_museum_profile_release",
      document_path: "docs/stream-interoperability.md",
    },
  });
  documents["docs/data-architecture/casey-reas-machine-schedule.json"] =
    JSON.stringify({
      profile_id: "6529NM_DATA_ARCHITECTURE_V1",
      accession_lot_id: "6529NM.2026.001",
      custody_transaction: `0x${"1".repeat(64)}`,
      custody_block: 25660311,
      evidence_manifest_path: "evidence/casey-reas/manifest.json",
      metadata_digest_scope: "retained raw metadata response bytes",
      generator_digest_scope: "recorded generator observation",
      objects: CASEY_OBJECTS.map((artwork, index) => ({
        object_id: artwork.id,
        title: artwork.title,
        caip19: `eip155:1/erc721:0x${artwork.contract}/${artwork.token}`,
        custody_receipt_log: 60 - index,
        metadata_sha256: `sha256:${"2".repeat(64)}`,
        generator_observation_sha256: `sha256:${"3".repeat(64)}`,
        generator_bytes_retained: false,
        accession_state: "accessioned",
        preservation_state: "in_progress",
      })),
    });
  documents[MUSEUM_RIGHTS_INTRODUCTION_PATH] =
    "# Rights in digital art\n\n## Buying the artwork usually does not buy its copyright\n\nGoverned public guide.";
  documents[MUSEUM_RIGHTS_ARTIST_GUIDE_PATH] =
    "# Rights for artists\n\nGoverned public guide.";
  documents[MUSEUM_RIGHTS_COLLECTOR_GUIDE_PATH] =
    "# Rights for collectors\n\n## The public domain is part of everyday collecting\n\nGoverned public guide.";

  const legalPathById: Readonly<Record<string, string>> = {
    "cc0-1.0": "docs/rights/legal-texts/cc0-1.0.txt",
    "cc-by-4.0": "docs/rights/legal-texts/cc-by-4.0.txt",
    "cc-by-sa-4.0": "docs/rights/legal-texts/cc-by-sa-4.0.txt",
    "cc-by-nd-4.0": "docs/rights/legal-texts/cc-by-nd-4.0.txt",
    "cc-by-nc-4.0": "docs/rights/legal-texts/cc-by-nc-4.0.txt",
    "cc-by-nc-sa-4.0": "docs/rights/legal-texts/cc-by-nc-sa-4.0.txt",
    "cc-by-nc-nd-4.0": "docs/rights/legal-texts/cc-by-nc-nd-4.0.txt",
  };
  for (const path of MUSEUM_RIGHTS_LEGAL_TEXT_PATHS) {
    documents[path] = `Exact official fixture text for ${path}.`;
  }
  const expressionIds = [
    "in-copyright-no-public-license",
    "cc0-1.0",
    "cc-by-4.0",
    "cc-by-sa-4.0",
    "cc-by-nd-4.0",
    "cc-by-nc-4.0",
    "cc-by-nc-sa-4.0",
    "cc-by-nc-nd-4.0",
    "public-domain-mark-1.0",
    "rightsstatements-inc",
    "rightsstatements-inc-ow-eu",
    "rightsstatements-inc-edu",
    "rightsstatements-inc-nc",
    "rightsstatements-inc-ruu",
    "rightsstatements-noc-cr",
    "rightsstatements-noc-nc",
    "rightsstatements-noc-oklr",
    "rightsstatements-noc-us",
    "rightsstatements-cne",
    "rightsstatements-und",
    "rightsstatements-nkc",
    "custom-license",
  ] as const;
  const useMatrix = {
    display_the_work: "status_only",
    publish_online: "status_only",
    publish_in_print: "status_only",
    make_preservation_copies: "status_only",
    share_an_adaptation: "status_only",
    make_commercial_use: "status_only",
  };
  const expressions = expressionIds.map((id) => {
    const legalPath = legalPathById[id];
    const group = id.startsWith("cc-by")
      ? "creative_commons_license"
      : id === "cc0-1.0" || id === "public-domain-mark-1.0"
        ? "creative_commons_tool"
        : id.startsWith("rightsstatements-")
          ? "rights_statement"
          : id === "custom-license"
            ? "custom_license"
            : "copyright_case";
    const instrumentKind = id.startsWith("cc-by")
      ? "public_license"
      : id === "cc0-1.0"
        ? "public_domain_dedication"
        : id === "public-domain-mark-1.0"
          ? "public_domain_mark"
          : id.startsWith("rightsstatements-")
            ? "descriptive_status"
            : id === "custom-license"
              ? "custom_terms"
              : "no_public_license";
    return {
      id,
      label: `Label for ${id}`,
      short_label: id === "cc-by-nc-4.0" ? "CC BY-NC 4.0" : id,
      group,
      instrument_kind: instrumentKind,
      version: id.includes("4.0") ? "4.0" : null,
      spdx_id: null,
      canonical_uri: null,
      legal_code:
        legalPath === undefined
          ? null
          : {
              path: legalPath,
              source_uri: `https://example.com/source/${id}`,
              publication_uri: `https://example.com/publication/${id}`,
              sha256: sha256(documents[legalPath] ?? ""),
            },
      summary: `A plain-language summary for ${id}.`,
      museum_can: ["Use the recorded term according to its conditions."],
      conditions: [],
      boundaries: ["Read the complete object record before reuse."],
      visitor_note: "Read the recorded rights information before reuse.",
      use_matrix: useMatrix,
    };
  });
  documents[MUSEUM_RIGHTS_REGISTRY_PATH] = JSON.stringify({
    $schema: "../../schemas/rights-expression-registry.schema.json",
    registry_type: "6529NM_RIGHTS_EXPRESSION_REGISTRY",
    registry_version: "1.0.0",
    published_at: "2026-08-05T17:01:32Z",
    actions: Object.keys(useMatrix),
    use_status_definitions: {
      allowed: "Allowed.",
      allowed_with_conditions: "Allowed with conditions.",
      not_licensed: "Not licensed.",
      status_only: "Status information only.",
      case_by_case: "Review case by case.",
    },
    sources: {
      creative_commons_data_repository:
        "https://github.com/creativecommons/cc-legal-tools-data",
      creative_commons_data_commit: "22fc2c31d0297a1feb8a257c0e6f84e95c9a38ae",
      creative_commons_license_guide:
        "https://creativecommons.org/share-your-work/use-remix/cc-licenses/",
      rightsstatements_documentation:
        "https://rightsstatements.org/en/documentation/",
      rightsstatements_usage_guidelines:
        "https://rightsstatements.org/en/documentation/usage_guidelines",
      observed_at: "2026-08-05T16:45:00Z",
    },
    expressions,
    object_assignments: CASEY_OBJECTS.map((artwork, index) => ({
      object_id: artwork.id,
      expression_id: "cc-by-nc-4.0",
      rights_record_path: `records/accessions/6529NM.2026.001/rights/6529NM.2026.001.RIGHTS.${String(index + 1).padStart(2, "0")}.json`,
      evidence_basis: "Reviewed object-specific Art Blocks metadata.",
    })),
    program_notes: [
      {
        program_id: "6529NM-AP-01",
        expression_id: "cc0-1.0",
        effective_status: "conditional_not_yet_effective",
        explanation:
          "Keys and Gates remains unminted, so this CC0 intention is not yet effective.",
      },
    ],
  });
  return documents;
}

export interface CaseyFixtureOptions {
  readonly documentOverrides?: Readonly<Record<string, string>>;
  readonly responseOverrides?: Readonly<Record<string, string>>;
  readonly manifestSizeOverrides?: Readonly<Record<string, number>>;
  readonly omittedManifestPath?: string;
  readonly commit?: string;
}

export interface CaseyFixture {
  readonly calls: string[];
  readonly documents: Readonly<Record<string, string>>;
  readonly manifest: string;
  readonly fetch: typeof fetch;
}

function mockResponse(text: string, status: number): Response {
  const bytes = Buffer.from(text, "utf8");
  return {
    ok: status >= 200 && status < 300,
    status,
    url: "",
    headers: {
      get: (name: string) =>
        name.toLowerCase() === "content-length"
          ? String(bytes.byteLength)
          : null,
    },
    arrayBuffer: async () =>
      bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength),
  } as unknown as Response;
}

export function createCaseyFixture(
  options: CaseyFixtureOptions = {}
): CaseyFixture {
  const commit = options.commit ?? EXACT_COMMIT;
  const documents = {
    ...buildBaseDocuments(),
    ...options.documentOverrides,
  };
  const entries = Object.entries(documents)
    .filter(([path]) => path !== options.omittedManifestPath)
    .map(([path, text]) => ({
      path,
      sha256: sha256(text),
      size:
        options.manifestSizeOverrides?.[path] ??
        Buffer.byteLength(text, "utf8"),
    }));
  entries.push({
    path: ".gitattributes",
    sha256: sha256("* text=auto"),
    size: Buffer.byteLength("* text=auto", "utf8"),
  });
  const manifest = JSON.stringify({
    manifest_type: "6529NM_RECORD_MANIFEST",
    manifest_version: "1.0.0",
    entries,
  });
  const calls: string[] = [];
  const responseOverrides = options.responseOverrides ?? {};

  const fetchImplementation = async (input: string | URL | Request) => {
    const url = typeof input === "string" ? input : input.toString();
    calls.push(url);
    if (url.startsWith("https://api.github.com/")) {
      return mockResponse(JSON.stringify({ object: { sha: commit } }), 200);
    }
    if (url.endsWith("/release-artifacts/latest/record-manifest.json")) {
      return mockResponse(manifest, 200);
    }

    const marker = `/${commit}/`;
    const markerIndex = url.indexOf(marker);
    const path =
      markerIndex === -1
        ? ""
        : decodeURIComponent(url.slice(markerIndex + marker.length));
    const text = responseOverrides[path] ?? documents[path];
    return text === undefined
      ? mockResponse("missing", 404)
      : mockResponse(text, 200);
  };

  return {
    calls,
    documents,
    manifest,
    fetch: fetchImplementation as typeof fetch,
  };
}

export function withObjectState(
  fixture: CaseyFixture,
  objectId: string,
  state: string
): string {
  const path = objectPath(objectId);
  const parsed = JSON.parse(fixture.documents[path] ?? "null") as {
    payload: { current_state: string };
  };
  parsed.payload.current_state = state;
  return JSON.stringify(parsed);
}
