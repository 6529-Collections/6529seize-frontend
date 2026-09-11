import type { ApiArtworkDocumentationProfile } from "@/generated/models/ApiArtworkDocumentationProfile";
import { ARTWORK_DOCUMENTATION_EXAMPLE_MESSAGES } from "@/i18n/messages/artwork-documentation-examples";
import {
  fieldSection,
  MODULE_FIELDS,
  MODULE_IDS,
  type DocumentationSection,
  type ModuleId,
} from "./registry";

export function documentationExampleKey(
  profile: ApiArtworkDocumentationProfile,
  moduleId: ModuleId,
  fieldId: string,
  part: "answer" | "why" | "starter"
): string | undefined {
  if (
    moduleId === "interview" &&
    /^q[1-8]$/.test(fieldId) &&
    (profile.interview_instrument.id !==
      "artwork-documentation-artist-interview-v1" ||
      profile.interview_instrument.version !== 1)
  )
    return undefined;
  const key = `examples.${moduleId}.${fieldId}.${part}`;
  return Object.hasOwn(
    ARTWORK_DOCUMENTATION_EXAMPLE_MESSAGES,
    `artworkDocumentation.${key}`
  )
    ? key
    : undefined;
}

export function documentationExampleFields(
  profile: ApiArtworkDocumentationProfile,
  section: DocumentationSection
) {
  return MODULE_IDS.flatMap((moduleId) => {
    const policy = profile.modules.find(
      (module) => String(module.id) === moduleId
    );
    if (policy?.version !== 1) return [];
    return MODULE_FIELDS[moduleId]
      .filter(
        (field) =>
          fieldSection(moduleId, field.id) === section &&
          policy.fields.some((definition) => definition.id === field.id) &&
          documentationExampleKey(profile, moduleId, field.id, "answer") !==
            undefined
      )
      .map((field) => ({ moduleId, field }));
  });
}
