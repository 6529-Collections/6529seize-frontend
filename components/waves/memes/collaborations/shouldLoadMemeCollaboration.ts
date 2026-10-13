import type { ApiDrop } from "@/generated/models/ApiDrop";

export function shouldLoadMemeCollaboration(
  drop: Pick<ApiDrop, "submission_artist" | "collaborators" | "moderation">
): boolean {
  // Managed drops always carry the original credit, including an empty string.
  // Accepted profiles also identify collaboration-aware copies of the drop.
  return (
    drop.moderation?.can_view !== false &&
    (drop.submission_artist !== undefined ||
      (drop.collaborators?.length ?? 0) > 0)
  );
}
