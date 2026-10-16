import type { ApiDrop } from "@/generated/models/ApiDrop";

import { ApiDropType } from "@/generated/models/ApiDropType";

export function shouldLoadMemeCollaboration(
  drop: Pick<ApiDrop, "submission_artist" | "collaborators" | "moderation"> &
    Partial<Pick<ApiDrop, "metadata" | "drop_type">>
): boolean {
  // Managed drops always carry the original credit, including an empty string.
  // Accepted profiles also identify collaboration-aware copies of the drop.
  return (
    drop.moderation?.can_view !== false &&
    (drop.submission_artist !== undefined ||
      (drop.collaborators?.length ?? 0) > 0 ||
      (drop.drop_type === ApiDropType.Participatory &&
        !!drop.metadata?.some((item) => item.data_key === "memeName")))
  );
}
