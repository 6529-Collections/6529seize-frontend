import type { ApiArtworkDocumentationProfile } from "@/generated/models/ApiArtworkDocumentationProfile";
import { ARTWORK_DOCUMENTATION_MESSAGES } from "@/i18n/messages/artwork-documentation";
export function confirmationCopyMatches(
  profile: ApiArtworkDocumentationProfile
): boolean {
  if (
    profile.confirmation_copy_version ===
    "artwork-documentation-confirmation-v2"
  )
    return (
      profile.confirmation_copy ===
      ARTWORK_DOCUMENTATION_MESSAGES[
        "artworkDocumentation.publication.confirmCopy"
      ]
    );
  return (
    profile.confirmation_copy_version ===
      "artwork-documentation-confirmation-v1" &&
    profile.confirmation_copy ===
      ARTWORK_DOCUMENTATION_MESSAGES["artworkDocumentation.confirmCopy"]
  );
}
