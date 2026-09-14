import type { ApiArtworkDocumentationContext } from "@/generated/models/ApiArtworkDocumentationContext";
import { ApiArtworkDocumentationAnswerStatusEnum } from "@/generated/models/ApiArtworkDocumentationAnswer";
import { isPublicationOnly } from "./intake";

const MUSEUM_DOCUMENTATION_ASSET_ROLES = [
  "artwork_final",
  "preservation_master",
  "camera_original",
  "working_file",
  "process_evidence",
  "display_derivative",
  "interview_recording",
  "interview_transcript",
  "other_supporting",
  "print_output",
  "color_profile",
  "preset",
  "source_code",
  "dependency",
  "environment_package",
  "reference_capture",
  "captions",
  "notebook",
  "publication",
  "consent_instrument",
  "rights_instrument",
] as const;

function hasMuseumMedia(context: ApiArtworkDocumentationContext): boolean {
  const answer = context.modules["artwork"]?.answers["media_profiles"];
  return (
    context.profile.version === 3 &&
    answer?.status === ApiArtworkDocumentationAnswerStatusEnum.Provided &&
    Array.isArray(answer.value) &&
    answer.value.some(
      (media: unknown) =>
        typeof media === "string" &&
        context.profile.media_profiles?.some((profile) => profile.id === media)
    )
  );
}
export function documentationAssetRoles(
  context: ApiArtworkDocumentationContext
): readonly string[] {
  if (hasMuseumMedia(context)) return MUSEUM_DOCUMENTATION_ASSET_ROLES;
  return isPublicationOnly(context.profile)
    ? PUBLICATION_DOCUMENTATION_ASSET_ROLES
    : DOCUMENTATION_ASSET_ROLES;
}

const DOCUMENTATION_ASSET_ROLES = [
  "artwork_final",
  "preservation_master",
  "camera_original",
  "working_file",
  "process_evidence",
  "display_derivative",
  "consent_instrument",
  "rights_instrument",
  "interview_recording",
  "interview_transcript",
  "other_supporting",
] as const;

const PUBLICATION_DOCUMENTATION_ASSET_ROLES = [
  "artwork_final",
  "preservation_master",
  "process_evidence",
  "display_derivative",
  "interview_recording",
  "interview_transcript",
  "other_supporting",
] as const;
const INTERVIEW_PERMISSION_FIELDS: Readonly<Record<string, string>> = {
  interview_recording: "recording_permission",
  interview_transcript: "transcript_permission",
};

export function canPublishDocumentationAsset(
  context: ApiArtworkDocumentationContext,
  role: string
): boolean {
  if (!isPublicationOnly(context.profile)) return true;
  if (hasMuseumMedia(context))
    return MUSEUM_DOCUMENTATION_ASSET_ROLES.some((allowed) => allowed === role);
  if (!PUBLICATION_DOCUMENTATION_ASSET_ROLES.some((item) => item === role))
    return false;
  const permissionField = INTERVIEW_PERMISSION_FIELDS[role];
  if (!permissionField) return true;
  const answer = context.modules["interview"]?.answers[permissionField];
  return (
    answer?.status === ApiArtworkDocumentationAnswerStatusEnum.Provided &&
    answer.value === "intended_public_record"
  );
}
