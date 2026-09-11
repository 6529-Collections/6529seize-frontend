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
function matchesDocumentationSchema(
  value: unknown,
  schema: ApiArtworkDocumentationValueSchema
): boolean {
  const oneOf = wireProperty(schema, "one_of", "oneOf");
  const options = wireProperty(schema, "_enum", "enum");
  if (oneOf)
    return (
      oneOf.filter((candidate) => matchesDocumentationSchema(value, candidate))
        .length === 1
    );
  if (options && !options.some((option: unknown) => option === value))
    return false;
  switch (schema.type) {
    case "string":
      return (
        typeof value === "string" &&
        Array.from(value).length >=
          (wireProperty(schema, "min_length", "minLength") ?? 0) &&
        Array.from(value).length <=
          (wireProperty(schema, "max_length", "maxLength") ?? Infinity)
      );
    case "integer":
      return (
        typeof value === "number" &&
        Number.isSafeInteger(value) &&
        value >= (schema.minimum ?? -Infinity) &&
        value <= (schema.maximum ?? Infinity)
      );
    case "number":
      return typeof value === "number" && Number.isFinite(value);
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
  return matchesDocumentationSchema(answer.value, definition.value_schema);
}
