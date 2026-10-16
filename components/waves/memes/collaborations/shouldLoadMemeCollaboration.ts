import type { ApiDrop } from "@/generated/models/ApiDrop";

import { ApiDropType } from "@/generated/models/ApiDropType";

export function shouldLoadMemeCollaboration(
  drop: Pick<ApiDrop, "submission_artist" | "collaborators" | "moderation"> &
    Partial<Pick<ApiDrop, "metadata" | "drop_type">>
): boolean {
  // Managed drops always carry the original credit, including an empty string.
  // Lightweight submission copies may omit metadata and the managed marker.
  // Ask the server for viewer eligibility rather than hiding pending invitations.
  return (
    drop.moderation?.can_view !== false &&
    (drop.submission_artist !== undefined ||
      (drop.collaborators?.length ?? 0) > 0 ||
      drop.drop_type === ApiDropType.Participatory)
  );
}
