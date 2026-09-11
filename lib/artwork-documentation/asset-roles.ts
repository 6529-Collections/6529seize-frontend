import type { ApiArtworkDocumentationContext } from "@/generated/models/ApiArtworkDocumentationContext";
import { ApiArtworkDocumentationAnswerStatusEnum } from "@/generated/models/ApiArtworkDocumentationAnswer";
import { isPublicationOnly } from "./intake";

export const DOCUMENTATION_ASSET_ROLES = [
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

export const PUBLICATION_DOCUMENTATION_ASSET_ROLES = [
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
