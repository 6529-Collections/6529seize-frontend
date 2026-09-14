import { getStructuredApiErrorCode } from "@/services/api/common-api";

export function documentationCreationErrorMessage(error: unknown): string {
  switch (getStructuredApiErrorCode(error) ?? "") {
    case "SELF_SERVICE_DISABLED":
      return "entry.creationDisabled";
    case "PROGRAM_INVITATION_REQUIRED":
      return "entry.programInvitation";
    case "DIRECT_ARTIST_REQUIRED":
      return "entry.directArtist";
    default:
      return "entry.createError";
  }
}
