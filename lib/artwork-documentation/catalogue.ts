import type { ApiArtworkDocumentationContext } from "@/generated/models/ApiArtworkDocumentationContext";
import type { ApiArtworkDocumentationField } from "@/generated/models/ApiArtworkDocumentationField";
import type { ApiArtworkDocumentationProfile } from "@/generated/models/ApiArtworkDocumentationProfile";
import type { ApiArtworkDocumentationValueSchema } from "@/generated/models/ApiArtworkDocumentationValueSchema";
import {
  documentationEntryLabel,
  documentationSchemaLabel,
} from "@/i18n/messages/artwork-documentation-fields";
import { readAnswer } from "./answers";
import type { PendingEdit } from "./draft-controller";
import {
  MODULE_FIELDS,
  SECTIONS,
  fieldSection,
  recordValue,
  type DocumentationField,
  type DocumentationSection,
  type ModuleId,
  type ValueEditor,
} from "./registry";

const MUSEUM_SECTIONS: readonly DocumentationSection[] = [
  "artwork",
  "story",
  "materials",
  "conversation",
  "preservation",
  "rights",
  "review",
];

function member(value: object, key: string): unknown {
  return Reflect.get(value, key);
}
function stringMember(value: object, key: string): string | undefined {
  const item = member(value, key);
  return typeof item === "string" ? item : undefined;
}
function strings(value: unknown): string[] {
  return Array.isArray(value)
    ? value.filter((item): item is string => typeof item === "string")
    : [];
}
function numberMember(
  value: object,
  camel: string,
  snake: string
): number | undefined {
  const item = member(value, camel) ?? member(value, snake);
  return typeof item === "number" ? item : undefined;
}
export function documentationMediaProfiles(
  profile: ApiArtworkDocumentationProfile
): {
  id: string;
  label: string;
  description: string;
  requiredFields: string[];
}[] {
  return (profile.media_profiles ?? []).map((value) => ({
    id: value.id,
    label: value.label,
    description: value.description,
    requiredFields: value.required_fields,
  }));
}
export function isMuseumRecord(
  profile: ApiArtworkDocumentationProfile
): boolean {
  return documentationMediaProfiles(profile).length > 0;
}
export function documentationSections(
  profile: ApiArtworkDocumentationProfile
): readonly DocumentationSection[] {
  return isMuseumRecord(profile) ? MUSEUM_SECTIONS : SECTIONS;
}
export function documentationChapterKey(
  profile: ApiArtworkDocumentationProfile,
  section: DocumentationSection
): string {
  return `${isMuseumRecord(profile) ? "museum.chapter" : "chapters"}.${section}`;
}
const CHAPTERS: Readonly<Record<string, DocumentationSection>> = {
  work: "artwork",
  account: "story",
  making: "story",
  artist: "rights",
  credits: "rights",
  materials: "materials",
  conversation: "conversation",
  care: "preservation",
  history: "review",
  legacy_conversation: "conversation",
  legacy_terms: "rights",
};
export function documentationFieldSection(
  profile: ApiArtworkDocumentationProfile | undefined,
  moduleId: ModuleId,
  fieldId: string
): DocumentationSection {
  const definition = profile?.modules
    .find((module) => String(module.id) === moduleId)
    ?.fields.find((field) => field.id === fieldId);
  const chapter = definition && stringMember(definition, "chapter");
  return (
    (chapter ? CHAPTERS[chapter] : undefined) ?? fieldSection(moduleId, fieldId)
  );
}

function referenceTarget(key: string): string {
  if (key.includes("agent") || key === "creators" || key === "authors")
    return "agents";
  if (key.includes("document")) return "documents";
  if (key.includes("session")) return "sessions";
  if (key.includes("place")) return "places";
  if (key.includes("source")) return "sources";
  if (key.includes("component")) return "components";
  return "all";
}
function stringEditor(
  schema: ApiArtworkDocumentationValueSchema,
  key: string
): ValueEditor {
  if (key === "id") return { kind: "identity" };
  if (
    schema.format === "bcp47" ||
    ["language", "title_language", "record_language"].includes(key)
  )
    return { kind: "language" };
  if (key === "question_id") return { kind: "reference", target: "questions" };
  const options = strings(member(schema, "enum") ?? schema._enum);
  if (options.length) return { kind: "choice", options };
  if (schema.format === "uuid") {
    if (key.includes("asset")) return { kind: "asset" };
    return { kind: "reference", target: referenceTarget(key) };
  }
  const max = numberMember(schema, "maxLength", "max_length") ?? 1000;
  return { kind: "text", max, multiline: max >= 3000 };
}
function structuredEditor(
  schema: ApiArtworkDocumentationValueSchema,
  key: string
): ValueEditor {
  if (schema.type === "array" && schema.items) {
    const item = editorForSchema(schema.items, key);
    if (item.kind === "asset" || item.kind === "reference")
      return { ...item, multiple: true };
    return {
      kind: "list",
      item: { ...item, label: documentationEntryLabel(key) },
      max: numberMember(schema, "maxItems", "max_items") ?? 30,
    };
  }
  const properties = schema.properties ?? {};
  if (properties["primary_language"] && properties["versions"])
    return {
      kind: "localized",
      max:
        numberMember(
          properties["versions"].items?.properties?.["text"] ?? {},
          "maxLength",
          "max_length"
        ) ?? 12000,
    };
  if (
    properties["precision"] &&
    properties["start"] &&
    properties["approximate"]
  )
    return { kind: "date", note: !!properties["note"] };
  return {
    kind: "object",
    fields: Object.fromEntries(
      Object.entries(properties).map(([name, value]) => [
        name,
        editorForSchema(value, name),
      ])
    ),
    required: schema.required ?? [],
  };
}
export function editorForSchema(
  schema: ApiArtworkDocumentationValueSchema,
  key: string
): ValueEditor {
  let editor: ValueEditor;
  if (schema.type === "boolean") editor = { kind: "boolean", explicit: true };
  else if (schema.type === "number" || schema.type === "integer")
    editor = {
      kind: "number",
      ...(schema.minimum === undefined ? {} : { min: schema.minimum }),
      ...(schema.maximum === undefined ? {} : { max: schema.maximum }),
      integer: schema.type === "integer",
    };
  else if (schema.type === "object" || schema.type === "array")
    editor = structuredEditor(schema, key);
  else editor = stringEditor(schema, key);
  const label = documentationSchemaLabel(key, stringMember(schema, "title"));
  return {
    ...editor,
    ...(label ? { label } : {}),
    ...(schema.description ? { guidance: schema.description } : {}),
  };
}
function catalogueField(
  profile: ApiArtworkDocumentationProfile,
  moduleId: ModuleId,
  definition: ApiArtworkDocumentationField
): DocumentationField {
  const legacy = MODULE_FIELDS[moduleId].find(
    (field) => field.id === definition.id
  );
  const metadataEditor = stringMember(definition, "editor");
  let editor = editorForSchema(definition.value_schema, definition.id);
  if (metadataEditor === "media_profiles")
    editor = {
      kind: "multi_choice",
      options: documentationMediaProfiles(profile),
    };
  else if (legacy?.editor.kind === "asset") editor = legacy.editor;
  const label = documentationSchemaLabel(
    definition.id,
    stringMember(definition, "label")
  );
  const guidance = stringMember(definition, "guidance");
  return {
    ...legacy,
    id: definition.id,
    editor,
    ...(label ? { label } : {}),
    ...(guidance ? { guidance } : {}),
    mediaProfiles: strings(member(definition, "media_profiles")),
    readOnly: member(definition, "read_only") === true,
    legacy: stringMember(definition, "chapter")?.startsWith("legacy_") ?? false,
  };
}
export function documentationFields(
  profile: ApiArtworkDocumentationProfile | undefined,
  moduleId: ModuleId
): readonly DocumentationField[] {
  if (!profile || !isMuseumRecord(profile)) return MODULE_FIELDS[moduleId];
  return (
    profile.modules
      .find((module) => String(module.id) === moduleId)
      ?.fields.map((definition) =>
        catalogueField(profile, moduleId, definition)
      ) ?? []
  );
}
export function selectedDocumentationMedia(
  context: ApiArtworkDocumentationContext,
  edits: readonly PendingEdit[] = []
): string[] {
  return strings(
    readAnswer(context, "artwork", "media_profiles", edits)?.value
  );
}
export function fieldAppliesToMedia(
  field: DocumentationField,
  selected: readonly string[]
): boolean {
  return (
    (field.mediaProfiles?.length ?? 0) === 0 ||
    field.mediaProfiles?.some((media) => selected.includes(media)) === true
  );
}
export interface DocumentationReferenceChoice {
  readonly id: string;
  readonly label: string;
  readonly target: string;
}
const REFERENCE_COLLECTIONS: readonly [ModuleId, string][] = [
  ["identity", "agents"],
  ["artwork", "components"],
  ["artwork", "physical_objects"],
  ["artwork", "places"],
  ["context", "documents"],
  ["context", "sources"],
  ["interview", "sessions"],
  ["files", "described_materials"],
  ["artwork", "related_works"],
  ["artwork", "token_references"],
  ["preservation", "presentation_scenes"],
];
function referenceEntries(
  value: unknown,
  target: string
): DocumentationReferenceChoice[] {
  if (!Array.isArray(value)) return [];
  return value.flatMap((entry) => {
    const item = recordValue(entry);
    if (typeof item["id"] !== "string") return [];
    const label =
      item["name"] ?? item["title"] ?? item["label"] ?? item["text"];
    return [
      {
        id: item["id"],
        label: typeof label === "string" && label.trim() ? label : item["id"],
        target,
      },
    ];
  });
}
function questionReferences(value: unknown): DocumentationReferenceChoice[] {
  if (!Array.isArray(value)) return [];
  return value.flatMap((session) =>
    referenceEntries(
      recordValue(recordValue(session)["instrument"])["questions"],
      "questions"
    )
  );
}
export function documentationReferences(
  context: ApiArtworkDocumentationContext,
  edits: readonly PendingEdit[] = []
): DocumentationReferenceChoice[] {
  const title: unknown = readAnswer(context, "artwork", "title", edits)?.value;
  const result: DocumentationReferenceChoice[] = [
    {
      id: context.work_id,
      label:
        typeof title === "string" && title.trim() ? title : context.work_id,
      target: "work",
    },
  ];
  result.push(
    ...context.assets.map((asset) => ({
      id: asset.id,
      label: asset.filename,
      target: "assets",
    }))
  );
  for (const [module, field] of REFERENCE_COLLECTIONS) {
    const value: unknown = readAnswer(context, module, field, edits)?.value;
    result.push(...referenceEntries(value, field));
    if (field === "sessions") result.push(...questionReferences(value));
  }
  return result;
}
