import type { ApiArtworkDocumentationProfile } from "@/generated/models/ApiArtworkDocumentationProfile";
import { ApiArtworkDocumentationProfileIntakeModeEnum } from "@/generated/models/ApiArtworkDocumentationProfile";
import type { ApiArtworkDocumentationAnswer } from "@/generated/models/ApiArtworkDocumentationAnswer";
import type { ApiArtworkDocumentationValueSchema } from "@/generated/models/ApiArtworkDocumentationValueSchema";
import type { ValueEditor } from "./registry";
import { ApiArtworkDocumentationAnswerIntendedVisibilityEnum } from "@/generated/models/ApiArtworkDocumentationAnswer";
import { validDocumentationAnswer } from "./validation";

export function isPublicationOnly(
  profile: ApiArtworkDocumentationProfile
): boolean {
  return (
    profile.intake_mode ===
    ApiArtworkDocumentationProfileIntakeModeEnum.PublicationOnly
  );
}

export function latestDocumentationProfiles(
  profiles: readonly ApiArtworkDocumentationProfile[]
): ApiArtworkDocumentationProfile[] {
  const latest = new Map<string, ApiArtworkDocumentationProfile>();
  for (const profile of profiles) {
    const key = JSON.stringify([
      profile.profile_id,
      profile.program_id,
      profile.wave_id,
    ]);
    const previous = latest.get(key);
    if (!previous || previous.version < profile.version)
      latest.set(key, profile);
  }
  return [...latest.values()];
}

export function canImportDocumentationAnswer(
  profile: ApiArtworkDocumentationProfile,
  path: string,
  answer: ApiArtworkDocumentationAnswer
): boolean {
  if (!isPublicationOnly(profile)) return true;
  const [moduleId, fieldId] = path.split(".");
  return (
    moduleId !== undefined &&
    fieldId !== undefined &&
    validDocumentationAnswer(profile, moduleId, fieldId, answer) &&
    answer.intended_visibility ===
      ApiArtworkDocumentationAnswerIntendedVisibilityEnum.PublicRecord &&
    profile.modules.some(
      (module) =>
        String(module.id) === moduleId &&
        module.fields.some(
          (field) => field.id === fieldId && !field.locked_restricted
        )
    )
  );
}

export function documentationChoiceEditor(
  editor: ValueEditor,
  schema: ApiArtworkDocumentationValueSchema
): ValueEditor {
  if (editor.kind !== "choice") return editor;
  const options: unknown = Reflect.get(schema, "enum") ?? schema._enum;
  return Array.isArray(options) &&
    options.every((option: unknown) => typeof option === "string")
    ? { ...editor, options }
    : editor;
}
