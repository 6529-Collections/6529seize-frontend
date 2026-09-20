import type { ApiArtworkDocumentationValueSchema } from "@/generated/models/ApiArtworkDocumentationValueSchema";
import type { ApiArtworkDocumentationContext } from "@/generated/models/ApiArtworkDocumentationContext";
import {
  ApiArtworkDocumentationOperationOpEnum,
  type ApiArtworkDocumentationOperation,
} from "@/generated/models/ApiArtworkDocumentationOperation";
import {
  ApiArtworkDocumentationAnswerStatusEnum,
  type ApiArtworkDocumentationAnswer,
} from "@/generated/models/ApiArtworkDocumentationAnswer";
import {
  ApiArtworkDocumentationProfileIntakeModeEnum,
  type ApiArtworkDocumentationProfile,
} from "@/generated/models/ApiArtworkDocumentationProfile";

export type DocumentationValidationCode =
  | "required"
  | "invalid_value"
  | "invalid_language"
  | "invalid_date"
  | "invalid_uuid"
  | "invalid_address"
  | "invalid_integer_string"
  | "invalid_uri"
  | "too_long"
  | "out_of_range"
  | "duplicate_item"
  | "required_details"
  | "invalid_translations"
  | "invalid_time_range"
  | "incomplete_coordinates"
  | "invalid_authority"
  | "invalid_entry_document"
  | "presentation_bounds"
  | "fixed_terms"
  | "replacement_reason_required";

/** Paths are relative to answer.value. No artist values are copied into diagnostics. */
export interface DocumentationValidationIssue {
  code: DocumentationValidationCode;
  path: (string | number)[];
  kind: "incomplete" | "invalid";
}
type Issues = DocumentationValidationIssue[];
type Path = DocumentationValidationIssue["path"];
type Schema = ApiArtworkDocumentationValueSchema;
type RecordValue = Record<string, unknown>;
const issue = (
  code: DocumentationValidationCode,
  path: Path = [],
  kind: DocumentationValidationIssue["kind"] = "invalid"
): DocumentationValidationIssue => ({ code, path, kind });
const isRecord = (value: unknown): value is RecordValue =>
  value !== null && typeof value === "object" && !Array.isArray(value);

// common-api returns wire JSON; the generator renames JSON Schema keywords.
function wireProperty<K extends keyof Schema>(
  schema: Schema,
  key: K,
  wire: string
): Schema[K] {
  return (Reflect.get(schema, wire) ?? schema[key]) as Schema[K];
}

function normalizeString(value: string): string {
  for (let index = 0; index < value.length; index++) {
    const code = value.charCodeAt(index);
    if (code >= 0xd800 && code <= 0xdbff) {
      const next = value.charCodeAt(++index);
      if (!(next >= 0xdc00 && next <= 0xdfff)) throw new Error("invalid_value");
    } else if (code >= 0xdc00 && code <= 0xdfff)
      throw new Error("invalid_value");
  }
  return value.replace(/\r\n?/g, "\n").normalize("NFC");
}
function normalizeObject(value: unknown, depth: number): RecordValue {
  if (!isRecord(value)) throw new Error("invalid_value");
  const prototype: unknown = Object.getPrototypeOf(value);
  if (prototype !== Object.prototype && prototype !== null)
    throw new Error("invalid_value");
  const result: RecordValue = {};
  for (const [key, item] of Object.entries(value)) {
    if (["__proto__", "prototype", "constructor"].includes(key))
      throw new Error("invalid_value");
    result[key] = normalize(item, depth + 1);
  }
  return result;
}
function normalize(value: unknown, depth = 0): unknown {
  if (depth > 30) throw new Error("invalid_value");
  if (typeof value === "string") return normalizeString(value);
  if (value === null || typeof value === "boolean") return value;
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (Array.isArray(value))
    return value.map((item) => normalize(item, depth + 1));
  return normalizeObject(value, depth);
}

function validDate(value: unknown): value is string {
  if (
    typeof value !== "string" ||
    !/^(?:\d{4}|\d{4}-\d{2}|\d{4}-\d{2}-\d{2})$/.test(value)
  )
    return false;
  const [year = 0, month = 1, day = 1] = value.split("-").map(Number);
  const leap = year % 4 === 0 && (year % 100 !== 0 || year % 400 === 0);
  const days = [31, leap ? 29 : 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
  return (
    year >= 1 &&
    month >= 1 &&
    month <= 12 &&
    day >= 1 &&
    day <= days[month - 1]!
  );
}

function validIntegerString(value: string): boolean {
  const max =
    "115792089237316195423570985008687907853269984665640564039457584007913129639935";
  return (
    /^(0|[1-9]\d{0,77})$/.test(value) &&
    (value.length < max.length || value <= max)
  );
}
function validLanguage(value: string): boolean {
  try {
    return Intl.getCanonicalLocales(value).length === 1;
  } catch {
    return false;
  }
}
function validUri(value: string, authority: boolean): boolean {
  try {
    const url = new URL(value);
    const protocols = authority
      ? ["http:", "https:"]
      : ["https:", "ipfs:", "ar:"];
    return protocols.includes(url.protocol) && !url.username && !url.password;
  } catch {
    return false;
  }
}
function formatIssue(
  value: string,
  format: string | undefined
): DocumentationValidationCode | null {
  switch (format) {
    case "uuid":
      return /^[a-f\d]{8}-[a-f\d]{4}-[a-f\d]{4}-[a-f\d]{4}-[a-f\d]{12}$/i.test(
        value
      )
        ? null
        : "invalid_uuid";
    case "ethereum-address":
      return /^0x[a-f\d]{40}$/i.test(value) ? null : "invalid_address";
    case "uint256-string":
      return validIntegerString(value) ? null : "invalid_integer_string";
    case "partial-date":
      return validDate(value) ? null : "invalid_date";
    case "bcp47":
      return validLanguage(value) ? null : "invalid_language";
    case "uri":
      return validUri(value, false) ? null : "invalid_uri";
    case "authority-uri":
      return validUri(value, true) ? null : "invalid_uri";
    case undefined:
    default:
      return null;
  }
}

function stringIssues(value: unknown, schema: Schema, path: Path): Issues {
  if (typeof value !== "string") return [issue("invalid_value", path)];
  const length = Array.from(value).length;
  if (length < (wireProperty(schema, "min_length", "minLength") ?? 1))
    return [issue("required", path, "incomplete")];
  if (length > (wireProperty(schema, "max_length", "maxLength") ?? 12000))
    return [issue("too_long", path)];
  const code = formatIssue(value, schema.format);
  return code ? [issue(code, path)] : [];
}
function arrayIssues(value: unknown, schema: Schema, path: Path): Issues {
  if (!Array.isArray(value)) return [issue("invalid_value", path)];
  const result: Issues = [];
  if (value.length < (wireProperty(schema, "min_items", "minItems") ?? 0))
    result.push(issue("required", path, "incomplete"));
  if (value.length > (wireProperty(schema, "max_items", "maxItems") ?? 30))
    result.push(issue("too_long", path));
  const seen = new Set<string>();
  value.forEach((item, index) => {
    const key = JSON.stringify(item);
    if (wireProperty(schema, "unique_items", "uniqueItems") && seen.has(key))
      result.push(issue("duplicate_item", [...path, index]));
    seen.add(key);
    result.push(...schemaIssues(item, schema.items ?? {}, [...path, index]));
  });
  return result;
}
function objectIssues(value: unknown, schema: Schema, path: Path): Issues {
  if (!isRecord(value)) return [issue("invalid_value", path)];
  const result = (schema.required ?? [])
    .filter((key) => !Object.hasOwn(value, key))
    .map((key) => issue("required", [...path, key], "incomplete"));
  const properties = schema.properties ?? {};
  for (const [key, item] of Object.entries(value)) {
    if (Object.hasOwn(properties, key))
      result.push(...schemaIssues(item, properties[key]!, [...path, key]));
    else if (
      wireProperty(schema, "additional_properties", "additionalProperties") !==
      true
    )
      result.push(issue("invalid_value", path));
  }
  return result;
}
function alternativeIssues(
  value: unknown,
  alternatives: Schema[],
  path: Path
): Issues {
  const results = alternatives.map((item) => schemaIssues(value, item, path));
  const matches = results.filter((result) => result.length === 0).length;
  if (matches === 1) return [];
  if (matches > 1) return [issue("invalid_value", path)];
  return results.reduce(
    (best, next) => (next.length < best.length ? next : best),
    results[0] ?? [issue("invalid_value", path)]
  );
}
function numericIssues(value: unknown, schema: Schema, path: Path): Issues {
  if (
    typeof value !== "number" ||
    !Number.isFinite(value) ||
    (schema.type === "integer" && !Number.isInteger(value))
  )
    return [issue("invalid_value", path)];
  return value >= (schema.minimum ?? -Number.MAX_SAFE_INTEGER) &&
    value <= (schema.maximum ?? Number.MAX_SAFE_INTEGER)
    ? []
    : [issue("out_of_range", path)];
}
function schemaIssues(value: unknown, schema: Schema, path: Path): Issues {
  const alternatives = wireProperty(schema, "one_of", "oneOf");
  if (alternatives) return alternativeIssues(value, alternatives, path);
  const options = wireProperty(schema, "_enum", "enum");
  if (options && !options.includes(value))
    return [
      issue(
        value === "" ? "required" : "invalid_value",
        path,
        value === "" ? "incomplete" : "invalid"
      ),
    ];
  switch (schema.type) {
    case "string":
      return stringIssues(value, schema, path);
    case "boolean":
      return typeof value === "boolean" ? [] : [issue("invalid_value", path)];
    case "integer":
    case "number":
      return numericIssues(value, schema, path);
    case "array":
      return arrayIssues(value, schema, path);
    case "object":
      return objectIssues(value, schema, path);
    case undefined:
    default:
      return [issue("invalid_value", path)];
  }
}

export function documentationSchemaIssues(
  value: unknown,
  schema: Schema
): Issues {
  try {
    return schemaIssues(normalize(value), schema, []);
  } catch {
    return [issue("invalid_value")];
  }
}
export function matchesDocumentationSchema(
  value: unknown,
  schema: Schema
): boolean {
  return documentationSchemaIssues(value, schema).length === 0;
}

export function requiredRightsDetailField(
  moduleId: string,
  fieldId: string,
  value: unknown
): "detail" | "details" | null {
  if (moduleId !== "rights" || !isRecord(value)) return null;
  if (
    fieldId === "rights_basis" &&
    typeof value["kind"] === "string" &&
    value["kind"].length > 0 &&
    value["kind"] !== "artist_owned"
  )
    return "detail";
  if (fieldId === "third_party_material" && value["kind"] === "present")
    return "details";
  return null;
}
function dateIssues(value: RecordValue, path: Path): Issues {
  const precision =
    value["precision"] === "range"
      ? value["endpoint_precision"]
      : value["precision"];
  const length = ({ day: 10, month: 7, year: 4 } as Record<string, number>)[
    String(precision)
  ];
  const result: Issues = [];
  if (value["precision"] === "range" && !Boolean(value["endpoint_precision"]))
    result.push(
      issue("required", [...path, "endpoint_precision"], "incomplete")
    );
  const start = value["start"];
  if (!validDate(start) || start.length !== length)
    result.push(
      issue(
        "invalid_date",
        [...path, "start"],
        Boolean(start) ? "invalid" : "incomplete"
      )
    );
  if (value["precision"] === "range") {
    const end = value["end"];
    if (
      !validDate(end) ||
      end.length !== length ||
      (typeof start === "string" && end < start)
    )
      result.push(
        issue(
          "invalid_date",
          [...path, "end"],
          Boolean(end) ? "invalid" : "incomplete"
        )
      );
  } else if (
    value["end"] !== undefined ||
    value["endpoint_precision"] !== undefined
  )
    result.push(issue("invalid_date", path));
  return result;
}
function localizedIssues(value: RecordValue): Issues {
  if (!Array.isArray(value["versions"])) return [];
  const versions = value["versions"].filter(isRecord);
  const languages = versions.map((version) => version["language"]);
  return languages.includes(value["primary_language"]) &&
    new Set(languages).size === languages.length &&
    versions.filter((version) => version["authorship"] === "original")
      .length === 1
    ? []
    : [issue("invalid_translations", ["versions"])];
}
function needsKindDetail(path: string, kind: unknown): boolean {
  if (kind === "other") return true;
  if (path === "process.ai_use")
    return ["assistive", "generative"].includes(String(kind));
  return path === "rights.rights_basis" && kind !== "artist_owned";
}
function needsExplanation(path: string, value: RecordValue): boolean {
  const kind = value["kind"];
  if (path.startsWith("files."))
    return ["unavailable", "retained_by_artist", "not_applicable"].includes(
      String(kind)
    );
  if (path === "process.ingredients") return kind === "unavailable";
  return (
    path === "context.prior_mint_status" &&
    kind === "previously_minted" &&
    ((value["references"] as unknown[] | undefined)?.length ?? 0) === 0
  );
}
function requiredDetailIssues(path: string, value: RecordValue): Issues {
  const needed: string[] = [];
  if (needsKindDetail(path, value["kind"])) needed.push("detail");
  if (path === "rights.third_party_material" && value["kind"] === "present")
    needed.push("details");
  if (needsExplanation(path, value)) needed.push("explanation");
  if (
    path === "process.techniques" &&
    Array.isArray(value["kinds"]) &&
    value["kinds"].includes("other")
  )
    needed.push("other_detail");
  return needed
    .filter((key) => !Boolean(value[key]))
    .map((key) => issue("required_details", [key], "incomplete"));
}

function entriesIssues(path: string, value: RecordValue): Issues {
  if (
    ![
      "process.contributors",
      "process.ingredients",
      "context.history",
    ].includes(path)
  )
    return [];
  const entries = Array.isArray(value["entries"]) ? value["entries"] : [];
  const result: Issues = [];
  if (
    value["kind"] === "entries_supplied"
      ? entries.length === 0
      : entries.length > 0
  )
    result.push(
      issue(
        "required_details",
        ["entries"],
        entries.length > 0 ? "invalid" : "incomplete"
      )
    );
  if (path === "context.history")
    entries.forEach((entry, index) => {
      if (isRecord(entry) && isRecord(entry["date"]))
        result.push(...dateIssues(entry["date"], ["entries", index, "date"]));
    });
  return result;
}
function suppliedObjectIssues(path: string, value: RecordValue): Issues {
  const result = [
    ...requiredDetailIssues(path, value),
    ...entriesIssues(path, value),
  ];
  if ("precision" in value) result.push(...dateIssues(value, []));
  if ("versions" in value) result.push(...localizedIssues(value));
  if (
    path === "process.techniques" &&
    Array.isArray(value["kinds"]) &&
    new Set(value["kinds"]).size !== value["kinds"].length
  )
    result.push(issue("duplicate_item", ["kinds"]));
  return result;
}

function timeRangeIssues(value: RecordValue, path: Path): Issues {
  return (
    [
      ["start_seconds", "end_seconds"],
      ["source_start_seconds", "source_end_seconds"],
    ] as const
  ).flatMap(([startKey, endKey]) => {
    const start = value[startKey];
    const end = value[endKey];
    return typeof start === "number" && typeof end === "number" && end < start
      ? [issue("invalid_time_range", [...path, endKey])]
      : [];
  });
}
function dimensionIssues(value: RecordValue, path: Path): Issues {
  const result: Issues = [];
  const seconds = value["seconds"];
  if (
    value["kind"] === "fixed" &&
    !(typeof seconds === "number" && Number.isFinite(seconds) && seconds > 0)
  )
    result.push(
      issue(
        "required_details",
        [...path, "seconds"],
        seconds === undefined ? "incomplete" : "invalid"
      )
    );
  if (value["unit"] === "other" && !Boolean(value["unit_label"]))
    result.push(
      issue("required_details", [...path, "unit_label"], "incomplete")
    );
  if ("latitude" in value !== "longitude" in value)
    result.push(
      issue(
        "incomplete_coordinates",
        [...path, "latitude" in value ? "longitude" : "latitude"],
        "incomplete"
      )
    );
  return result;
}
function nestedObjectIssues(value: RecordValue, path: Path): Issues {
  const result = [
    ...timeRangeIssues(value, path),
    ...dimensionIssues(value, path),
  ];
  if ("precision" in value && "start" in value)
    result.push(...dateIssues(value, path));
  if (
    value["authority"] === "TGN" &&
    (!/^\d+$/.test(String(value["identifier"])) ||
      value["uri"] !==
        `http://vocab.getty.edu/tgn/${String(value["identifier"])}`)
  )
    result.push(issue("invalid_authority", [...path, "uri"]));
  return result;
}

function nestedIssues(value: unknown, path: Path = []): Issues {
  if (Array.isArray(value))
    return value.flatMap((item, index) => nestedIssues(item, [...path, index]));
  if (!isRecord(value)) return [];
  return [
    ...nestedObjectIssues(value, path),
    ...Object.entries(value).flatMap(([key, item]) =>
      nestedIssues(item, [...path, key])
    ),
  ];
}
function presentationIssues(value: unknown): Issues {
  if (!Array.isArray(value)) return [];
  return value.flatMap((scene, index) => {
    if (!isRecord(scene)) return [];
    return ["resources", "annotations"].flatMap((key) => {
      if (!Array.isArray(scene[key])) return [];
      return scene[key].flatMap((resource: unknown, position: number) => {
        if (!isRecord(resource)) return [];
        const path = [index, key, position];
        const outsideTime = ["start_seconds", "end_seconds"].some(
          (name) =>
            typeof scene["duration_seconds"] === "number" &&
            typeof resource[name] === "number" &&
            resource[name] > scene["duration_seconds"]
        );
        const outsideRegion = [
          ["x", "width"],
          ["y", "height"],
        ].some(
          ([offset, size]) =>
            typeof scene[size!] === "number" &&
            typeof resource[offset!] === "number" &&
            typeof resource[size!] === "number" &&
            (resource[offset!] as number) + (resource[size!] as number) >
              (scene[size!] as number)
        );
        return outsideTime || outsideRegion
          ? [issue("presentation_bounds", path)]
          : [];
      });
    });
  });
}
function semanticIssues(
  profile: ApiArtworkDocumentationProfile,
  moduleId: string,
  fieldId: string,
  value: unknown
): Issues {
  const path = `${moduleId}.${fieldId}`;
  const result = isRecord(value) ? suppliedObjectIssues(path, value) : [];
  if (profile.version !== 3) return result;
  result.push(...nestedIssues(value));
  if (
    path === "process.html" &&
    isRecord(value) &&
    typeof value["entry_document"] === "string"
  ) {
    const entry = value["entry_document"];
    if (
      /^[\\/]|^[a-z]+:|[\\?#]/i.test(entry) ||
      Array.from(entry).some((character) => character.codePointAt(0)! < 32) ||
      entry.split("/").some((part) => !part || part === "." || part === "..")
    )
      result.push(issue("invalid_entry_document", ["entry_document"]));
  }
  if (path === "preservation.presentation_scenes")
    result.push(...presentationIssues(value));
  return result;
}

function documentationAnswerIssues(
  profile: ApiArtworkDocumentationProfile,
  moduleId: string,
  fieldId: string,
  raw: ApiArtworkDocumentationAnswer
): Issues {
  const definition = profile.modules
    .find((module) => String(module.id) === moduleId)
    ?.fields.find((field) => field.id === fieldId);
  if (!definition) return [issue("invalid_value")];
  let answer: RecordValue;
  try {
    const normalized = normalize(raw);
    if (!isRecord(normalized)) return [issue("invalid_value")];
    answer = normalized;
  } catch {
    return [issue("invalid_value")];
  }
  if (
    !definition.allowed_statuses.includes(String(answer["status"])) ||
    Object.keys(answer).some(
      (key) =>
        !["status", "value", "explanation", "intended_visibility"].includes(key)
    )
  )
    return [issue("invalid_value")];
  if (
    !["public_record", "restricted"].includes(
      String(answer["intended_visibility"])
    ) ||
    (definition.locked_restricted &&
      answer["intended_visibility"] !== "restricted") ||
    (profile.intake_mode ===
      ApiArtworkDocumentationProfileIntakeModeEnum.PublicationOnly &&
      answer["intended_visibility"] !== "public_record")
  )
    return [issue("invalid_value")];
  const explanationIssues =
    answer["explanation"] === undefined
      ? []
      : schemaIssues(
          answer["explanation"],
          { type: "string", min_length: 1, max_length: 1000 },
          []
        );
  if (answer["status"] !== "provided") {
    if (answer["value"] !== undefined) return [issue("invalid_value")];
    if (
      moduleId === "process" &&
      fieldId === "capture_method" &&
      !Boolean(answer["explanation"])
    )
      return [issue("required_details", [], "incomplete")];
    return explanationIssues;
  }
  return [
    ...explanationIssues,
    ...schemaIssues(answer["value"], definition.value_schema, []),
    ...semanticIssues(profile, moduleId, fieldId, answer["value"]),
  ];
}

const COLLECTION_FIELDS = new Set([
  "identity.agents",
  "artwork.components",
  "artwork.physical_objects",
  "artwork.places",
  "artwork.measurements",
  "artwork.relationships",
  "artwork.related_works",
  "artwork.inscriptions",
  "files.described_materials",
  "artwork.classifications",
  "artwork.external_identifiers",
  "artwork.token_references",
  "context.documents",
  "context.sources",
  "context.events",
  "rights.material_rights",
  "interview.sessions",
  "preservation.presentation_scenes",
]);
function collectionIds(
  value: unknown
): { id: unknown; path: Path; annotation: boolean }[] {
  if (!Array.isArray(value)) return [];
  return value.flatMap((item, index) => {
    if (!isRecord(item)) return [];
    const ids = [
      { id: item["id"], path: [index, "id"] as Path, annotation: false },
    ];
    if (Array.isArray(item["annotations"]))
      item["annotations"].forEach((annotation, position) => {
        if (isRecord(annotation))
          ids.push({
            id: annotation["id"],
            path: [index, "annotations", position, "id"],
            annotation: true,
          });
      });
    return ids;
  });
}
function duplicateIds(
  context: ApiArtworkDocumentationContext,
  field: string,
  value: unknown
): Issues {
  if (context.profile.version !== 3 || !COLLECTION_FIELDS.has(field)) return [];
  const seen = new Set<unknown>([context.work_id]);
  const assetIds = new Set<unknown>(
    context.asset_links.map((link) => link.asset_id)
  );
  for (const [moduleId, module] of Object.entries(context.modules))
    for (const [fieldId, answer] of Object.entries(module.answers)) {
      const other = `${moduleId}.${fieldId}`;
      if (
        other !== field &&
        COLLECTION_FIELDS.has(other) &&
        answer.status === ApiArtworkDocumentationAnswerStatusEnum.Provided
      )
        collectionIds(answer.value).forEach(({ id }) => seen.add(id));
    }
  return collectionIds(value).flatMap(({ id, path, annotation }) => {
    const duplicate = seen.has(id) || (!annotation && assetIds.has(id));
    seen.add(id);
    return duplicate ? [issue("duplicate_item", path)] : [];
  });
}
export function documentationOperationIssues(
  context: ApiArtworkDocumentationContext,
  moduleId: string,
  operation: ApiArtworkDocumentationOperation
): Issues {
  const definition = context.profile.modules
    .find((module) => String(module.id) === moduleId)
    ?.fields.find((field) => field.id === operation.field);
  if (!definition) return [issue("invalid_value")];
  if (definition.read_only) return [issue("fixed_terms")];
  if (operation.op === ApiArtworkDocumentationOperationOpEnum.Unset)
    return operation.answer === undefined ? [] : [issue("invalid_value")];
  if (String(operation.op) !== "set" || !operation.answer)
    return [issue("required", [], "incomplete")];
  const result = documentationAnswerIssues(
    context.profile,
    moduleId,
    operation.field,
    operation.answer
  );
  if (
    moduleId === "artwork" &&
    operation.field === "canonical_asset_id" &&
    context.latest_revision_id &&
    operation.answer.value !==
      context.modules["artwork"]?.answers["canonical_asset_id"]?.value
  ) {
    const reason: unknown = Reflect.get(operation, "replacementReason");
    if (
      typeof reason !== "string" ||
      Array.from(reason).length < 20 ||
      Array.from(reason).length > 1000
    )
      result.push(issue("replacement_reason_required", [], "incomplete"));
  }
  if (
    operation.answer.status === ApiArtworkDocumentationAnswerStatusEnum.Provided
  )
    result.push(
      ...duplicateIds(
        context,
        `${moduleId}.${operation.field}`,
        operation.answer.value
      )
    );
  return result;
}
export function validDocumentationOperation(
  context: ApiArtworkDocumentationContext,
  moduleId: string,
  operation: ApiArtworkDocumentationOperation
): boolean {
  const issues = documentationOperationIssues(context, moduleId, operation);
  return issues.length === 0;
}
export function validDocumentationAnswer(
  profile: ApiArtworkDocumentationProfile,
  moduleId: string,
  fieldId: string,
  answer: ApiArtworkDocumentationAnswer
): boolean {
  const issues = documentationAnswerIssues(profile, moduleId, fieldId, answer);
  return issues.length === 0;
}
