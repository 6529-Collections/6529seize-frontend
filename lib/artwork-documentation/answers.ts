import type { ApiArtworkDocumentationAnswer } from "@/generated/models/ApiArtworkDocumentationAnswer";
import type { ApiArtworkDocumentationContext } from "@/generated/models/ApiArtworkDocumentationContext";
import { ApiArtworkDocumentationOperationOpEnum } from "@/generated/models/ApiArtworkDocumentationOperation";
import type { PendingEdit } from "./draft-controller";
import { recordValue, type FieldValue, type ModuleId } from "./registry";

export function isRedacted(value: unknown): boolean {
  return (
    value !== null &&
    typeof value === "object" &&
    "redacted" in value &&
    value.redacted === true
  );
}
export function readAnswer(
  context: ApiArtworkDocumentationContext,
  moduleId: string,
  field: string,
  edits: readonly PendingEdit[] = []
): ApiArtworkDocumentationAnswer | undefined {
  const pending = edits.find(
    (edit) => edit.moduleId === moduleId && edit.operation.field === field
  );
  if (pending)
    return pending.operation.op === ApiArtworkDocumentationOperationOpEnum.Set
      ? pending.operation.answer
      : undefined;
  const answer = context.modules[moduleId]?.answers[field];
  return !answer || isRedacted(answer) ? undefined : answer;
}
export function answerValue(
  context: ApiArtworkDocumentationContext,
  moduleId: string,
  field: string,
  edits: readonly PendingEdit[] = []
): FieldValue | undefined {
  return readAnswer(context, moduleId, field, edits)?.value as
    | FieldValue
    | undefined;
}
export function documentationTitle(
  context: ApiArtworkDocumentationContext
): string | null {
  const value = answerValue(context, "artwork", "title");
  return typeof value === "string" ? value : null;
}
export function requiredPaths(
  context: ApiArtworkDocumentationContext,
  edits: readonly PendingEdit[] = []
): Set<string> {
  const result = new Set(context.profile.required_for_review);
  const techniques = recordValue(
    answerValue(context, "process", "techniques", edits)
  )["kinds"];
  if (
    Array.isArray(techniques) &&
    techniques.some((kind) => kind === "composite" || kind === "collage")
  )
    result.add("process.ingredients");
  if (Array.isArray(techniques) && techniques.includes("miniature"))
    result.add("process.construction_note");
  const people = answerValue(context, "rights", "people_depicted", edits);
  if (typeof people === "string" && people !== "" && people !== "none")
    result.add("rights.consent_status");
  if (people === "includes_minors" || people === "uncertain")
    result.add("rights.identifiability_note");
  if (
    answerValue(context, "rights", "consent_status", edits) ===
    "documents_supplied"
  )
    result.add("rights.consent_asset_ids");
  return result;
}
export function visibleField(
  context: ApiArtworkDocumentationContext,
  moduleId: ModuleId,
  field: string,
  edits: readonly PendingEdit[]
): boolean {
  if (readAnswer(context, moduleId, field, edits)) return true;
  if (
    [
      "ingredients",
      "construction_note",
      "consent_status",
      "consent_asset_ids",
      "identifiability_note",
    ].includes(field)
  )
    return requiredPaths(context, edits).has(`${moduleId}.${field}`);
  if (moduleId === "interview" && /^q[1-8]$/.test(field))
    return answerValue(context, moduleId, "mode", edits) === "written";
  return true;
}
