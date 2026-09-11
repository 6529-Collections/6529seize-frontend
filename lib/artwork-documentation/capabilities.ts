import type { ApiArtworkDocumentationCapabilities } from "@/generated/models/ApiArtworkDocumentationCapabilities";

export function canWriteDocumentation(
  capabilities: ApiArtworkDocumentationCapabilities
): boolean {
  return (
    capabilities.confirm_as_artist ||
    capabilities.edit_modules.length > 0 ||
    capabilities.review_lanes.length > 0 ||
    capabilities.manage_context ||
    capabilities.manage_assignments
  );
}
