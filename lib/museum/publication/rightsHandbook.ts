import { parseHeading } from "./legacyCaseyMarkdown";
import type {
  MuseumPublicDocument,
  MuseumPracticeUse,
  MuseumPracticeUseStatus,
  MuseumRightsAction,
  MuseumRightsCredit,
  MuseumRightsExpression,
  MuseumRightsHandbook,
  MuseumRightsObjectAssignment,
  MuseumRightsUseStatus,
  MuseumSourceDocument,
} from "./types";

export const MUSEUM_RIGHTS_REGISTRY_PATH = "docs/rights/registry.json" as const;
export const MUSEUM_RIGHTS_INTRODUCTION_PATH =
  "records/institutional-practice/rights-and-licenses.md" as const;
export const MUSEUM_RIGHTS_ARTIST_GUIDE_PATH =
  "records/institutional-practice/rights-for-artists.md" as const;
export const MUSEUM_RIGHTS_COLLECTOR_GUIDE_PATH =
  "records/institutional-practice/rights-for-collectors.md" as const;
export const MUSEUM_RIGHTS_LEGAL_TEXT_PATHS = [
  "docs/rights/legal-texts/cc0-1.0.txt",
  "docs/rights/legal-texts/cc-by-4.0.txt",
  "docs/rights/legal-texts/cc-by-sa-4.0.txt",
  "docs/rights/legal-texts/cc-by-nd-4.0.txt",
  "docs/rights/legal-texts/cc-by-nc-4.0.txt",
  "docs/rights/legal-texts/cc-by-nc-sa-4.0.txt",
  "docs/rights/legal-texts/cc-by-nc-nd-4.0.txt",
] as const;
export const MUSEUM_RIGHTS_REQUIRED_PATHS = [
  MUSEUM_RIGHTS_REGISTRY_PATH,
  MUSEUM_RIGHTS_INTRODUCTION_PATH,
  MUSEUM_RIGHTS_ARTIST_GUIDE_PATH,
  MUSEUM_RIGHTS_COLLECTOR_GUIDE_PATH,
  ...MUSEUM_RIGHTS_LEGAL_TEXT_PATHS,
] as const;

const EXPECTED_ACTIONS = [
  "display_the_work",
  "publish_online",
  "publish_in_print",
  "make_preservation_copies",
  "share_an_adaptation",
  "make_commercial_use",
] as const satisfies readonly MuseumRightsAction[];

const USE_STATUSES = [
  "allowed",
  "allowed_with_conditions",
  "not_licensed",
  "status_only",
  "case_by_case",
] as const satisfies readonly MuseumRightsUseStatus[];

const MUSEUM_PRACTICE_STATUSES = [
  "ordinary",
  "ordinary_with_terms",
  "purpose_limited",
  "contextual",
  "separate_basis",
] as const satisfies readonly MuseumPracticeUseStatus[];

const EXPECTED_EXPRESSION_IDS = new Set([
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
]);

const EXPECTED_CASEY_OBJECT_IDS = new Set(
  Array.from(
    { length: 7 },
    (_, index) => `6529NM.2026.001.${String(index + 1).padStart(2, "0")}`
  )
);

const REGISTRY_KEYS = [
  "$schema",
  "registry_type",
  "registry_version",
  "published_at",
  "actions",
  "use_status_definitions",
  "sources",
  "expressions",
  "object_assignments",
  "program_notes",
  "museum_practice_status_definitions",
] as const;

const REGISTRY_SOURCE_KEYS = [
  "creative_commons_data_repository",
  "creative_commons_data_commit",
  "creative_commons_license_guide",
  "rightsstatements_documentation",
  "rightsstatements_usage_guidelines",
  "observed_at",
  "college_art_association_fair_use",
  "us_public_display_law",
  "uk_public_exhibition_guidance",
  "us_nft_intellectual_property_study",
  "creative_commons_noncommercial_guidance",
  "rightsstatements_layer_guidance",
] as const;

const CREATIVE_COMMONS_DATA_COMMIT = "22fc2c31d0297a1feb8a257c0e6f84e95c9a38ae";

type JsonRecord = Record<string, unknown>;

function isRecord(value: unknown): value is JsonRecord {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function exactKeys(value: JsonRecord, keys: readonly string[]): boolean {
  const actual = Object.keys(value).sort((left, right) =>
    left.localeCompare(right)
  );
  const expected = [...keys].sort((left, right) => left.localeCompare(right));
  return (
    actual.length === expected.length &&
    actual.every((key, index) => key === expected[index])
  );
}

function requiredString(value: unknown, errorCode: string): string {
  if (typeof value !== "string" || value.trim().length === 0) {
    throw new Error(errorCode);
  }
  return value;
}

function nullableString(value: unknown, errorCode: string): string | null {
  if (value === null) return null;
  return requiredString(value, errorCode);
}

function requiredHttpsUrl(value: unknown, errorCode: string): string {
  const raw = requiredString(value, errorCode);
  let parsed: URL;
  try {
    parsed = new URL(raw);
  } catch {
    throw new Error(errorCode);
  }
  if (
    raw !== raw.trim() ||
    parsed.protocol !== "https:" ||
    parsed.hostname.length === 0 ||
    parsed.username.length > 0 ||
    parsed.password.length > 0
  ) {
    throw new Error(errorCode);
  }
  return raw;
}

function nullableHttpsUrl(value: unknown, errorCode: string): string | null {
  if (value === null) return null;
  return requiredHttpsUrl(value, errorCode);
}

function stringArray(value: unknown, errorCode: string): readonly string[] {
  if (
    !Array.isArray(value) ||
    value.some((item) => typeof item !== "string" || item.trim().length === 0)
  ) {
    throw new Error(errorCode);
  }
  return (value as unknown[]).map((item) => requiredString(item, errorCode));
}

function parseJson(source: MuseumSourceDocument): unknown {
  if (source.mediaType !== "application/json") {
    throw new Error("publication_rights_registry_missing");
  }
  try {
    return JSON.parse(source.text) as unknown;
  } catch {
    throw new Error("publication_rights_registry_json_invalid");
  }
}

function parseUseMatrix(
  value: unknown
): Readonly<Record<MuseumRightsAction, MuseumRightsUseStatus>> {
  if (!isRecord(value) || !exactKeys(value, EXPECTED_ACTIONS)) {
    throw new Error("publication_rights_use_matrix_invalid");
  }
  const entries = EXPECTED_ACTIONS.map((action) => {
    const status = value[action];
    if (!USE_STATUSES.includes(status as MuseumRightsUseStatus)) {
      throw new Error("publication_rights_use_matrix_invalid");
    }
    return [action, status] as const;
  });
  return Object.fromEntries(entries) as Record<
    MuseumRightsAction,
    MuseumRightsUseStatus
  >;
}

function parseMuseumPracticeMatrix(
  value: unknown
): Readonly<Record<MuseumRightsAction, MuseumPracticeUse>> {
  if (!isRecord(value) || !exactKeys(value, EXPECTED_ACTIONS)) {
    throw new Error("publication_rights_museum_practice_matrix_invalid");
  }
  return Object.fromEntries(
    EXPECTED_ACTIONS.map((action) => {
      const practice = value[action];
      if (
        !isRecord(practice) ||
        !exactKeys(practice, ["status", "note"]) ||
        !MUSEUM_PRACTICE_STATUSES.includes(
          practice["status"] as MuseumPracticeUseStatus
        )
      ) {
        throw new Error("publication_rights_museum_practice_matrix_invalid");
      }
      return [
        action,
        {
          status: practice["status"] as MuseumPracticeUseStatus,
          note: requiredString(
            practice["note"],
            "publication_rights_museum_practice_matrix_invalid"
          ),
        },
      ] as const;
    })
  ) as Record<MuseumRightsAction, MuseumPracticeUse>;
}

function parseExpression(
  value: unknown,
  documents: ReadonlyMap<string, MuseumSourceDocument>
): MuseumRightsExpression {
  const keys = [
    "id",
    "label",
    "short_label",
    "group",
    "instrument_kind",
    "version",
    "spdx_id",
    "canonical_uri",
    "legal_code",
    "summary",
    "museum_can",
    "conditions",
    "boundaries",
    "visitor_note",
    "use_matrix",
    "museum_practice_matrix",
  ] as const;
  if (!isRecord(value) || !exactKeys(value, keys)) {
    throw new Error("publication_rights_expression_shape_invalid");
  }

  const group = requiredString(
    value["group"],
    "publication_rights_expression_invalid"
  );
  const instrumentKind = requiredString(
    value["instrument_kind"],
    "publication_rights_expression_invalid"
  );
  if (
    ![
      "creative_commons_license",
      "creative_commons_tool",
      "rights_statement",
      "copyright_case",
      "custom_license",
    ].includes(group) ||
    ![
      "public_license",
      "public_domain_dedication",
      "public_domain_mark",
      "descriptive_status",
      "no_public_license",
      "custom_terms",
    ].includes(instrumentKind)
  ) {
    throw new Error("publication_rights_expression_invalid");
  }

  const legalValue = value["legal_code"];
  let legalCode: MuseumRightsExpression["legalCode"] = null;
  if (legalValue !== null) {
    if (
      !isRecord(legalValue) ||
      !exactKeys(legalValue, [
        "path",
        "source_uri",
        "publication_uri",
        "sha256",
      ])
    ) {
      throw new Error("publication_rights_legal_code_invalid");
    }
    const path = requiredString(
      legalValue["path"],
      "publication_rights_legal_code_invalid"
    );
    const sha256 = requiredString(
      legalValue["sha256"],
      "publication_rights_legal_code_invalid"
    );
    const source = documents.get(path);
    if (
      !path.startsWith("docs/rights/legal-texts/") ||
      !path.endsWith(".txt") ||
      source?.mediaType !== "text/plain" ||
      source.sha256 !== sha256 ||
      !/^sha256:[a-f0-9]{64}$/u.test(sha256)
    ) {
      throw new Error("publication_rights_legal_code_missing");
    }
    legalCode = {
      path,
      sourceUri: requiredHttpsUrl(
        legalValue["source_uri"],
        "publication_rights_legal_code_invalid"
      ),
      publicationUri: requiredHttpsUrl(
        legalValue["publication_uri"],
        "publication_rights_legal_code_invalid"
      ),
      sha256,
      text: source.text,
    };
  }

  return {
    id: requiredString(value["id"], "publication_rights_expression_invalid"),
    label: requiredString(
      value["label"],
      "publication_rights_expression_invalid"
    ),
    shortLabel: requiredString(
      value["short_label"],
      "publication_rights_expression_invalid"
    ),
    group: group as MuseumRightsExpression["group"],
    instrumentKind: instrumentKind as MuseumRightsExpression["instrumentKind"],
    version: nullableString(
      value["version"],
      "publication_rights_expression_invalid"
    ),
    spdxId: nullableString(
      value["spdx_id"],
      "publication_rights_expression_invalid"
    ),
    canonicalUri: nullableHttpsUrl(
      value["canonical_uri"],
      "publication_rights_expression_invalid"
    ),
    summary: requiredString(
      value["summary"],
      "publication_rights_expression_invalid"
    ),
    museumCan: stringArray(
      value["museum_can"],
      "publication_rights_expression_invalid"
    ),
    conditions: stringArray(
      value["conditions"],
      "publication_rights_expression_invalid"
    ),
    boundaries: stringArray(
      value["boundaries"],
      "publication_rights_expression_invalid"
    ),
    visitorNote: requiredString(
      value["visitor_note"],
      "publication_rights_expression_invalid"
    ),
    useMatrix: parseUseMatrix(value["use_matrix"]),
    museumPracticeMatrix: parseMuseumPracticeMatrix(
      value["museum_practice_matrix"]
    ),
    legalCode,
  };
}

function publicGuide(
  documents: ReadonlyMap<string, MuseumSourceDocument>,
  contract: {
    readonly id: string;
    readonly path: string;
    readonly title: string;
    readonly kind:
      | "rights_handbook"
      | "rights_artist_guide"
      | "rights_collector_guide";
  }
): MuseumPublicDocument {
  const source = documents.get(contract.path);
  if (
    source?.mediaType !== "text/markdown" ||
    parseHeading(source.text) !== contract.title
  ) {
    throw new Error("publication_rights_guide_missing");
  }
  return {
    id: contract.id,
    kind: contract.kind,
    title: contract.title,
    markdown: source.text,
    sha256: source.sha256,
    sourcePath: contract.path,
    artistIds: [],
    projectIds: [],
    giftIds: [],
    artworkIds: [],
  };
}

export function assembleRightsHandbook(
  documents: ReadonlyMap<string, MuseumSourceDocument>
): MuseumRightsHandbook {
  const registry = parseRegistry(documents);
  const expressions = parseExpressions(registry, documents);
  const expressionIds = new Set(expressions.map((expression) => expression.id));
  const useStatusDefinitions = parseStatusDefinitions(registry);
  const museumPracticeStatusDefinitions =
    parseMuseumPracticeStatusDefinitions(registry);
  const assignments = parseAssignments(registry, expressionIds);
  validateProgramNote(registry);

  const introduction = publicGuide(documents, {
    id: "rights:handbook",
    path: MUSEUM_RIGHTS_INTRODUCTION_PATH,
    title: "Rights in digital art",
    kind: "rights_handbook",
  });
  const artistGuide = publicGuide(documents, {
    id: "rights:artists",
    path: MUSEUM_RIGHTS_ARTIST_GUIDE_PATH,
    title: "Rights for artists",
    kind: "rights_artist_guide",
  });
  const collectorGuide = publicGuide(documents, {
    id: "rights:collectors",
    path: MUSEUM_RIGHTS_COLLECTOR_GUIDE_PATH,
    title: "Rights for collectors",
    kind: "rights_collector_guide",
  });

  return {
    introduction,
    artistGuide,
    collectorGuide,
    expressions,
    useStatusDefinitions,
    museumPracticeStatusDefinitions,
    objectAssignments: assignments,
    sourcePaths: [
      MUSEUM_RIGHTS_REGISTRY_PATH,
      introduction.sourcePath,
      artistGuide.sourcePath,
      collectorGuide.sourcePath,
      ...expressions.flatMap((expression) =>
        expression.legalCode === null ? [] : [expression.legalCode.path]
      ),
    ],
  };
}

function parseRegistry(
  documents: ReadonlyMap<string, MuseumSourceDocument>
): JsonRecord {
  const registrySource = documents.get(MUSEUM_RIGHTS_REGISTRY_PATH);
  if (registrySource === undefined) {
    throw new Error("publication_rights_registry_missing");
  }
  const registry = parseJson(registrySource);
  if (
    !isRecord(registry) ||
    !exactKeys(registry, REGISTRY_KEYS) ||
    registry["$schema"] !==
      "../../schemas/rights-expression-registry.schema.json" ||
    registry["registry_type"] !== "6529NM_RIGHTS_EXPRESSION_REGISTRY" ||
    registry["registry_version"] !== "1.1.0" ||
    typeof registry["published_at"] !== "string" ||
    !/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}Z$/u.test(registry["published_at"]) ||
    !Array.isArray(registry["actions"]) ||
    registry["actions"].length !== EXPECTED_ACTIONS.length ||
    registry["actions"].some(
      (action, index) => action !== EXPECTED_ACTIONS[index]
    ) ||
    !Array.isArray(registry["expressions"]) ||
    !Array.isArray(registry["object_assignments"]) ||
    !Array.isArray(registry["program_notes"]) ||
    !isRecord(registry["use_status_definitions"]) ||
    !isRecord(registry["museum_practice_status_definitions"]) ||
    !isRecord(registry["sources"])
  ) {
    throw new Error("publication_rights_registry_shape_invalid");
  }

  const sources = registry["sources"];
  if (
    !exactKeys(sources, REGISTRY_SOURCE_KEYS) ||
    sources["creative_commons_data_repository"] !==
      "https://github.com/creativecommons/cc-legal-tools-data" ||
    sources["creative_commons_data_commit"] !== CREATIVE_COMMONS_DATA_COMMIT ||
    sources["creative_commons_license_guide"] !==
      "https://creativecommons.org/share-your-work/use-remix/cc-licenses/" ||
    sources["rightsstatements_documentation"] !==
      "https://rightsstatements.org/en/documentation/" ||
    sources["rightsstatements_usage_guidelines"] !==
      "https://rightsstatements.org/en/documentation/usage_guidelines" ||
    sources["college_art_association_fair_use"] !==
      "https://www.collegeart.org/programs/caa-fair-use/best-practices" ||
    sources["us_public_display_law"] !==
      "https://www.copyright.gov/title17/92chap1.html" ||
    sources["uk_public_exhibition_guidance"] !==
      "https://www.gov.uk/government/publications/copyright-notice-public-exhibition-of-copyright-works" ||
    sources["us_nft_intellectual_property_study"] !==
      "https://www.copyright.gov/policy/nft-study/Joint-USPTO-USCO-Report-on-NFTs-and-Intellectual-Property.pdf" ||
    sources["creative_commons_noncommercial_guidance"] !==
      "https://wiki.creativecommons.org/wiki/NonCommercial_interpretation" ||
    sources["rightsstatements_layer_guidance"] !==
      "https://rightsstatements.org/en/2018/12/where-statements-apply.html" ||
    typeof sources["observed_at"] !== "string" ||
    !/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}Z$/u.test(sources["observed_at"])
  ) {
    throw new Error("publication_rights_registry_sources_invalid");
  }

  return registry;
}

function parseMuseumPracticeStatusDefinitions(
  registry: JsonRecord
): Readonly<Record<MuseumPracticeUseStatus, string>> {
  const definitions = registry["museum_practice_status_definitions"];
  if (
    !isRecord(definitions) ||
    !exactKeys(definitions, MUSEUM_PRACTICE_STATUSES)
  ) {
    throw new Error(
      "publication_rights_museum_practice_status_definitions_invalid"
    );
  }
  return Object.fromEntries(
    MUSEUM_PRACTICE_STATUSES.map((status) => [
      status,
      requiredString(
        definitions[status],
        "publication_rights_museum_practice_status_definitions_invalid"
      ),
    ])
  ) as Record<MuseumPracticeUseStatus, string>;
}

function parseExpressions(
  registry: JsonRecord,
  documents: ReadonlyMap<string, MuseumSourceDocument>
): readonly MuseumRightsExpression[] {
  const values = registry["expressions"];
  if (!Array.isArray(values)) {
    throw new TypeError("publication_rights_registry_shape_invalid");
  }
  const expressions = values.map((expression) =>
    parseExpression(expression, documents)
  );
  const expressionIds = new Set(expressions.map((expression) => expression.id));
  if (
    expressions.length !== EXPECTED_EXPRESSION_IDS.size ||
    expressionIds.size !== EXPECTED_EXPRESSION_IDS.size ||
    [...EXPECTED_EXPRESSION_IDS].some((id) => !expressionIds.has(id))
  ) {
    throw new Error("publication_rights_expression_inventory_invalid");
  }
  return expressions;
}

function parseStatusDefinitions(
  registry: JsonRecord
): Readonly<Record<MuseumRightsUseStatus, string>> {
  const definitionsValue = registry["use_status_definitions"];
  if (
    !isRecord(definitionsValue) ||
    !exactKeys(definitionsValue, USE_STATUSES)
  ) {
    throw new Error("publication_rights_status_definitions_invalid");
  }
  return Object.fromEntries(
    USE_STATUSES.map((status) => [
      status,
      requiredString(
        definitionsValue[status],
        "publication_rights_status_definitions_invalid"
      ),
    ])
  ) as Record<MuseumRightsUseStatus, string>;
}

function parseAssignments(
  registry: JsonRecord,
  expressionIds: ReadonlySet<string>
): readonly MuseumRightsObjectAssignment[] {
  const values = registry["object_assignments"];
  if (!Array.isArray(values)) {
    throw new TypeError("publication_rights_registry_shape_invalid");
  }
  const assignments = values.map((assignment): MuseumRightsObjectAssignment => {
    if (
      !isRecord(assignment) ||
      !exactKeys(assignment, [
        "object_id",
        "expression_id",
        "rights_record_path",
        "evidence_basis",
      ])
    ) {
      throw new Error("publication_rights_assignment_invalid");
    }
    const expressionId = requiredString(
      assignment["expression_id"],
      "publication_rights_assignment_invalid"
    );
    if (!expressionIds.has(expressionId)) {
      throw new Error("publication_rights_assignment_invalid");
    }
    return {
      objectId: requiredString(
        assignment["object_id"],
        "publication_rights_assignment_invalid"
      ),
      expressionId,
      rightsRecordPath: requiredString(
        assignment["rights_record_path"],
        "publication_rights_assignment_invalid"
      ),
      evidenceBasis: requiredString(
        assignment["evidence_basis"],
        "publication_rights_assignment_invalid"
      ),
    };
  });
  const assignmentIds = new Set(
    assignments.map((assignment) => assignment.objectId)
  );
  if (
    assignments.length !== EXPECTED_CASEY_OBJECT_IDS.size ||
    assignmentIds.size !== EXPECTED_CASEY_OBJECT_IDS.size ||
    [...EXPECTED_CASEY_OBJECT_IDS].some((id) => !assignmentIds.has(id)) ||
    assignments.some((assignment) => assignment.expressionId !== "cc-by-nc-4.0")
  ) {
    throw new Error("publication_rights_assignment_inventory_invalid");
  }
  return assignments;
}

function validateProgramNote(registry: JsonRecord): void {
  const programNotes = registry["program_notes"];
  if (
    !Array.isArray(programNotes) ||
    programNotes.length !== 1 ||
    !isRecord(programNotes[0]) ||
    !exactKeys(programNotes[0], [
      "program_id",
      "expression_id",
      "effective_status",
      "explanation",
    ]) ||
    programNotes[0]["program_id"] !== "6529NM-AP-01" ||
    programNotes[0]["expression_id"] !== "cc0-1.0" ||
    programNotes[0]["effective_status"] !== "conditional_not_yet_effective" ||
    typeof programNotes[0]["explanation"] !== "string" ||
    programNotes[0]["explanation"].trim().length === 0
  ) {
    throw new Error("publication_rights_program_note_invalid");
  }
}

export function rightsHandbookDocuments(
  handbook: MuseumRightsHandbook
): readonly MuseumPublicDocument[] {
  return [handbook.introduction, handbook.artistGuide, handbook.collectorGuide];
}

export function rightsCreditForObject(
  handbook: MuseumRightsHandbook,
  object: {
    readonly id: string;
    readonly creditLine: string;
    readonly licenseLabel: string | null;
    readonly sourcePath: string;
  }
): MuseumRightsCredit {
  const assignment = handbook.objectAssignments.find(
    (candidate) => candidate.objectId === object.id
  );
  const expression = handbook.expressions.find(
    (candidate) => candidate.id === assignment?.expressionId
  );
  if (assignment === undefined || expression === undefined) {
    throw new Error("publication_object_rights_incomplete");
  }
  return {
    creditLine: object.creditLine,
    licenseLabel: object.licenseLabel,
    licenseUrl: expression.canonicalUri,
    rightsExpressionId: expression.id,
    sourcePath: object.sourcePath,
  };
}
