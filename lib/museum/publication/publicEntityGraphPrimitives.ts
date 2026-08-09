import {
  assertGovernedMuseumMediaPath,
  assertGovernedMuseumPath,
} from "./security";
import type {
  MuseumPublicEntityRecord,
  MuseumPublicEntityType,
  MuseumPublicRelationRecord,
  MuseumPublicRelationType,
  MuseumSourceDocument,
} from "./types";
import {
  ENTITY_PATH_PATTERN,
  ENTITY_TYPES,
  PUBLIC_ENTITY_SCHEMA_ID,
  PUBLIC_RELATION_SCHEMA_ID,
  RELATION_PATH_PATTERN,
  RELATION_TYPES,
} from "./publicEntityGraphSchema";

export function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

export function requiredRecord(
  value: unknown,
  code: string
): Record<string, unknown> {
  if (!isRecord(value)) throw new Error(code);
  return value;
}

export function requiredString(
  record: Record<string, unknown>,
  key: string,
  code: string
): string {
  const value = record[key];
  if (typeof value !== "string" || value.trim().length === 0) {
    throw new Error(code);
  }
  return value;
}

export function optionalString(
  record: Record<string, unknown>,
  key: string,
  code: string
): string | null {
  const value = record[key];
  if (value === null || value === undefined) return null;
  if (typeof value !== "string" || value.trim().length === 0) {
    throw new Error(code);
  }
  return value;
}

export function requiredObject(
  record: Record<string, unknown>,
  key: string,
  code: string
): Record<string, unknown> {
  return requiredRecord(record[key], code);
}

export function stringArray(
  record: Record<string, unknown>,
  key: string,
  code: string,
  required = true
): string[] {
  const value = record[key];
  if (value === undefined || value === null) {
    if (required) throw new Error(code);
    return [];
  }
  if (!Array.isArray(value) || (required && value.length === 0)) {
    throw new Error(code);
  }
  if (
    value.some((entry) => typeof entry !== "string" || entry.trim().length === 0)
  ) {
    throw new Error(code);
  }
  const result = value as string[];
  if (new Set(result).size !== result.length) throw new Error(code);
  return [...result];
}

export function requiredEvidenceRefs(
  record: Record<string, unknown>,
  key: string,
  code: string
): void {
  const refs = record[key];
  if (!Array.isArray(refs) || refs.length === 0) throw new Error(code);
  for (const ref of refs) {
    const object = requiredRecord(ref, code);
    requiredString(object, "uri", code);
    requiredString(object, "label", code);
    assertDateTime(object, "observed_at", code);
    const evidenceClass = requiredString(object, "evidence_class", code);
    if (!(new Set(["A", "B", "C", "D", "E"]) as ReadonlySet<string>).has(evidenceClass)) {
      throw new Error(code);
    }
  }
}

export function typedReferenceArray(
  record: Record<string, unknown>,
  key: string,
  code: string
): void {
  const value = record[key];
  if (value === undefined || value === null) return;
  if (!Array.isArray(value)) throw new Error(code);
  for (const entry of value) {
    const reference = requiredRecord(entry, code);
    requiredString(reference, "record_id", code);
    requiredString(reference, "source_record_id", code);
    requiredString(reference, "reference_type", code);
    requiredEvidenceRefs(reference, "evidence_refs", code);
  }
}

export function typedNameVariantArray(
  record: Record<string, unknown>,
  key: string,
  code: string
): void {
  const value = record[key];
  if (!Array.isArray(value) || value.length === 0) throw new Error(code);
  for (const entry of value) {
    const variant = requiredRecord(entry, code);
    requiredString(variant, "value", code);
    requiredString(variant, "source_kind", code);
    requiredString(variant, "variant_role", code);
    requiredEvidenceRefs(variant, "evidence_refs", code);
  }
}

export function validDateTime(value: unknown): boolean {
  return (
    typeof value === "string" &&
    value.trim().length > 0 &&
    !Number.isNaN(Date.parse(value))
  );
}

export function assertDateTime(
  record: Record<string, unknown>,
  key: string,
  code: string
): void {
  if (!validDateTime(record[key])) throw new Error(code);
}

export function assertStringEnum(
  record: Record<string, unknown>,
  key: string,
  values: ReadonlySet<string>,
  code: string
): string {
  const value = requiredString(record, key, code);
  if (!values.has(value)) throw new Error(code);
  return value;
}

export function assertSourcePath(path: string, code: string): void {
  try {
    assertGovernedMuseumPath(path);
  } catch {
    throw new Error(code);
  }
}

export function assertMediaSourcePath(path: string, code: string): void {
  try {
    assertGovernedMuseumMediaPath(path);
  } catch {
    throw new Error(code);
  }
}

export function parseDocument(
  document: MuseumSourceDocument,
  expectedRecordType: "PUBLIC_ENTITY" | "PUBLIC_RELATION",
  sourceCommit?: string
): Record<string, unknown> {
  let root: unknown;
  try {
    root = JSON.parse(document.text) as unknown;
  } catch {
    throw new Error("public_entity_graph_json_invalid");
  }
  const rootRecord = requiredRecord(root, "public_entity_graph_record_shape");
  const envelope = requiredObject(
    rootRecord,
    "envelope",
    "public_entity_graph_envelope"
  );
  const payload = requiredObject(
    rootRecord,
    "payload",
    "public_entity_graph_payload"
  );
  const schemaId =
    expectedRecordType === "PUBLIC_ENTITY"
      ? PUBLIC_ENTITY_SCHEMA_ID
      : PUBLIC_RELATION_SCHEMA_ID;
  if (envelope["recordType"] !== expectedRecordType) {
    throw new Error("public_entity_graph_envelope_type_mismatch");
  }
  if (envelope["schemaId"] !== schemaId) {
    throw new Error("public_entity_graph_envelope_schema_mismatch");
  }
  const envelopeSubjectId = requiredString(
    envelope,
    "subjectId",
    "public_entity_graph_envelope_subject"
  );
  if (!/^0x[0-9a-f]{64}$/iu.test(envelopeSubjectId)) {
    throw new Error("public_entity_graph_envelope_subject");
  }
  const uri = requiredString(
    envelope,
    "uri",
    "public_entity_graph_envelope_uri"
  );
  let parsedUri: URL;
  try {
    parsedUri = new URL(uri);
  } catch {
    throw new Error("public_entity_graph_envelope_uri");
  }
  const stableRecordUri =
    `https://6529networkmuseum.org/${document.path}`;
  const immutableBlobUri =
    sourceCommit === undefined
      ? null
      : `https://github.com/6529-Collections/6529networkmuseum/blob/${sourceCommit}/${document.path}`;
  if (
    parsedUri.protocol !== "https:" ||
    !(
      uri === stableRecordUri ||
      (immutableBlobUri !== null && uri === immutableBlobUri)
    ) ||
    parsedUri.username.length > 0 ||
    parsedUri.password.length > 0 ||
    parsedUri.port.length > 0 ||
    parsedUri.search.length > 0 ||
    parsedUri.hash.length > 0 ||
    !parsedUri.pathname.endsWith(`/${document.path}`)
  ) {
    throw new Error("public_entity_graph_envelope_uri");
  }
  if (payload["record_type"] !== expectedRecordType) {
    throw new Error("public_entity_graph_payload_type_mismatch");
  }
  if (payload["schema_id"] !== schemaId) {
    throw new Error("public_entity_graph_payload_schema_mismatch");
  }
  requiredString(payload, "record_id", "public_entity_graph_record_id");
  requiredString(payload, "subject_id", "public_entity_graph_subject_id");
  if (payload["record_id"] !== payload["subject_id"]) {
    throw new Error("public_entity_graph_subject_id_mismatch");
  }
  if (payload["visibility"] !== "public") {
    throw new Error("public_entity_graph_visibility");
  }
  requiredString(payload, "record_version", "public_entity_graph_record_version");
  assertDateTime(payload, "created_at", "public_entity_graph_created_at");
  assertDateTime(payload, "effective_at", "public_entity_graph_effective_at");
  requiredEvidenceRefs(payload, "evidence_refs", "public_entity_graph_evidence");
  return payload;
}

export function isEntityType(value: unknown): value is MuseumPublicEntityType {
  return typeof value === "string" && ENTITY_TYPES.has(value as MuseumPublicEntityType);
}

export function isRelationType(value: unknown): value is MuseumPublicRelationType {
  return typeof value === "string" && RELATION_TYPES.has(value as MuseumPublicRelationType);
}

export function parseEntityEnvelopeIdentity(
  document: MuseumSourceDocument,
  entityId: string
): void {
  const fileMatch = ENTITY_PATH_PATTERN.exec(document.path);
  if (fileMatch?.[1] !== entityId) {
    throw new Error("public_entity_graph_entity_path");
  }
}

export function parseRelationEnvelopeIdentity(
  document: MuseumSourceDocument,
  relationId: string
): void {
  const fileMatch = RELATION_PATH_PATTERN.exec(document.path);
  if (fileMatch?.[1] !== relationId) {
    throw new Error("public_entity_graph_relation_path");
  }
}

export type ParsedEntity = MuseumPublicEntityRecord;
export type ParsedRelation = MuseumPublicRelationRecord;
