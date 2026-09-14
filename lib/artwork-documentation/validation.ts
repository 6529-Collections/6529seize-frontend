import type { ApiArtworkDocumentationValueSchema } from "@/generated/models/ApiArtworkDocumentationValueSchema";
import type { ApiArtworkDocumentationContext } from "@/generated/models/ApiArtworkDocumentationContext";
import {
  ApiArtworkDocumentationOperationOpEnum,
  type ApiArtworkDocumentationOperation,
} from "@/generated/models/ApiArtworkDocumentationOperation";
import { ApiArtworkDocumentationAnswerStatusEnum } from "@/generated/models/ApiArtworkDocumentationAnswer";
import type { ApiArtworkDocumentationAnswer } from "@/generated/models/ApiArtworkDocumentationAnswer";
import type { ApiArtworkDocumentationProfile } from "@/generated/models/ApiArtworkDocumentationProfile";

/** Client guidance uses the server's registered schema; server validation remains authoritative. */
export function matchesDocumentationSchema(
  value: unknown,
  schema: ApiArtworkDocumentationValueSchema
): boolean {
  // Match server normalization for validation without changing the artist's answer.
  const normalizedValue =
    typeof value === "string"
      ? value.replace(/\r\n?/g, "\n").normalize("NFC")
      : value;
  const oneOf = wireProperty(schema, "one_of", "oneOf");
  const options = wireProperty(schema, "_enum", "enum");
  if (oneOf)
    return (
      oneOf.filter((candidate) => matchesDocumentationSchema(value, candidate))
        .length === 1
    );
  if (options && !options.some((option: unknown) => option === normalizedValue))
    return false;
  switch (schema.type) {
    case "string":
      return (
        typeof normalizedValue === "string" &&
        Array.from(normalizedValue).length >=
          (wireProperty(schema, "min_length", "minLength") ?? 0) &&
        Array.from(normalizedValue).length <=
          (wireProperty(schema, "max_length", "maxLength") ?? Infinity) &&
        matchesDocumentationUriFormat(normalizedValue, schema.format)
      );
    case "integer":
      return (
        typeof value === "number" &&
        Number.isSafeInteger(value) &&
        value >= (schema.minimum ?? -Infinity) &&
        value <= (schema.maximum ?? Infinity)
      );
    case "number":
      return (
        typeof value === "number" &&
        Number.isFinite(value) &&
        value >= (schema.minimum ?? -Infinity) &&
        value <= (schema.maximum ?? Infinity)
      );
    case "boolean":
      return typeof value === "boolean";
    case "array":
      return (
        Array.isArray(value) &&
        value.length >= (wireProperty(schema, "min_items", "minItems") ?? 0) &&
        value.length <=
          (wireProperty(schema, "max_items", "maxItems") ?? Infinity) &&
        (!schema.items ||
          value.every((item) =>
            matchesDocumentationSchema(item, schema.items!)
          ))
      );
    case "object": {
      if (value === null || typeof value !== "object" || Array.isArray(value))
        return false;
      const record = value as Record<string, unknown>;
      const properties = schema.properties ?? {};
      return (
        (schema.required ?? []).every((field) =>
          Object.hasOwn(record, field)
        ) &&
        Object.entries(record).every(([key, item]) =>
          properties[key]
            ? matchesDocumentationSchema(item, properties[key])
            : wireProperty(
                schema,
                "additional_properties",
                "additionalProperties"
              ) !== false
        )
      );
    }
    case undefined:
    default:
      return true;
  }
}

function matchesDocumentationUriFormat(
  value: string,
  format?: string
): boolean {
  if (format !== "uri" && format !== "authority-uri") return true;
  try {
    const url = new URL(value);
    const protocols =
      format === "uri" ? ["https:", "ipfs:", "ar:"] : ["http:", "https:"];
    return protocols.includes(url.protocol) && !url.username && !url.password;
  } catch {
    return false;
  }
}

export function requiredRightsDetailField(
  moduleId: string,
  fieldId: string,
  value: unknown
): "detail" | "details" | null {
  if (moduleId !== "rights" || value === null || typeof value !== "object")
    return null;
  const item = value as Record<string, unknown>;
  if (
    fieldId === "rights_basis" &&
    typeof item["kind"] === "string" &&
    item["kind"].length > 0 &&
    item["kind"] !== "artist_owned"
  )
    return "detail";
  if (fieldId === "third_party_material" && item["kind"] === "present")
    return "details";
  return null;
}

function hasRequiredRightsDetails(
  moduleId: string,
  fieldId: string,
  value: unknown
): boolean {
  const required = requiredRightsDetailField(moduleId, fieldId, value);
  return !required || Boolean((value as Record<string, unknown>)[required]);
}

// common-api returns wire JSON; the generator renames a few JSON Schema keywords.
function wireProperty<K extends keyof ApiArtworkDocumentationValueSchema>(
  schema: ApiArtworkDocumentationValueSchema,
  property: K,
  wireName: string
): ApiArtworkDocumentationValueSchema[K] {
  return (Reflect.get(schema, wireName) ??
    schema[property]) as ApiArtworkDocumentationValueSchema[K];
}

export function validDocumentationOperation(
  context: ApiArtworkDocumentationContext,
  moduleId: string,
  operation: ApiArtworkDocumentationOperation
): boolean {
  if (operation.op === ApiArtworkDocumentationOperationOpEnum.Unset)
    return true;
  if (
    moduleId === "artwork" &&
    operation.field === "canonical_asset_id" &&
    context.latest_revision_id &&
    operation.answer?.value !==
      context.modules["artwork"]?.answers["canonical_asset_id"]?.value
  ) {
    const reason: unknown = Reflect.get(operation, "replacementReason");
    if (
      typeof reason !== "string" ||
      reason.trim().length < 20 ||
      reason.length > 1000
    )
      return false;
  }
  return (
    !!operation.answer &&
    validDocumentationAnswer(
      context.profile,
      moduleId,
      operation.field,
      operation.answer
    )
  );
}

export function validDocumentationAnswer(
  profile: ApiArtworkDocumentationProfile,
  moduleId: string,
  fieldId: string,
  answer: ApiArtworkDocumentationAnswer
): boolean {
  const definition = profile.modules
    .find((module) => String(module.id) === moduleId)
    ?.fields.find((field) => field.id === fieldId);
  if (
    !definition?.allowed_statuses.some(
      (status) => String(status) === String(answer.status)
    )
  )
    return false;
  if (answer.status !== ApiArtworkDocumentationAnswerStatusEnum.Provided)
    return !answer.explanation || Array.from(answer.explanation).length <= 1000;
  return (
    matchesDocumentationSchema(answer.value, definition.value_schema) &&
    hasRequiredRightsDetails(moduleId, fieldId, answer.value)
  );
}
