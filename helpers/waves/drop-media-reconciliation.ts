import type { ApiDrop } from "@/generated/models/ApiDrop";
import type { ApiDropMedia } from "@/generated/models/ApiDropMedia";
import { ApiDropMediaStatus } from "@/generated/models/ApiDropMediaStatus";

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function isSameMedia(
  incoming: ApiDropMedia,
  existing: unknown
): existing is ApiDropMedia {
  if (!isRecord(existing)) return false;
  return (
    incoming.url === existing["url"] &&
    incoming.mime_type === existing["mime_type"] &&
    (!incoming.media_upload_id ||
      typeof existing["media_upload_id"] !== "string" ||
      existing["media_upload_id"] === "" ||
      incoming.media_upload_id === existing["media_upload_id"])
  );
}

function isTerminal(status: ApiDropMediaStatus | undefined): boolean {
  return (
    status === ApiDropMediaStatus.Ready || status === ApiDropMediaStatus.Failed
  );
}

function reconcileMedia(
  incoming: ApiDropMedia,
  existing: ApiDropMedia
): ApiDropMedia {
  // Terminal incoming states remain authoritative, including ready -> failed.
  const retainStatus =
    incoming.media_status === undefined ||
    (!isTerminal(incoming.media_status) &&
      (isTerminal(existing.media_status) ||
        existing.media_status === ApiDropMediaStatus.Processing));
  const result = { ...incoming };
  const status = retainStatus ? existing.media_status : incoming.media_status;
  const error = retainStatus ? existing.media_error : incoming.media_error;
  if (status !== undefined) result.media_status = status;
  if (error !== undefined) result.media_error = error;
  const uploadId = incoming.media_upload_id ?? existing.media_upload_id;
  if (uploadId !== undefined) result.media_upload_id = uploadId;
  for (const key of ["width", "height", "thumbhash"] as const) {
    // Explicit null clears a hint; only omitted fields need backfilling.
    if (result[key] === undefined && existing[key] !== undefined) {
      Object.assign(result, { [key]: existing[key] });
    }
  }
  return result;
}

/** Late lifecycle snapshots cannot undo progress for an unchanged image. */
export function reconcileDropMedia<T extends ApiDrop>(
  incoming: T,
  existing: unknown
): T {
  if (
    !Array.isArray(incoming.parts) ||
    !isRecord(existing) ||
    incoming.id !== existing["id"] ||
    (incoming.updated_at ?? null) !== (existing["updated_at"] ?? null) ||
    !Array.isArray(existing["parts"])
  ) {
    return incoming;
  }

  const existingParts = existing["parts"] as unknown[];
  const parts = incoming.parts.map((part) => {
    const previous = existingParts.find(
      (value) => isRecord(value) && value["part_id"] === part.part_id
    );
    if (
      !Array.isArray(part.media) ||
      !isRecord(previous) ||
      !Array.isArray(previous["media"])
    )
      return part;
    const previousMedia = previous["media"] as unknown[];
    const media = part.media.map((item) => {
      const match = previousMedia.find((value) => isSameMedia(item, value));
      return isSameMedia(item, match) ? reconcileMedia(item, match) : item;
    });
    return { ...part, media };
  });
  // Only incoming parts/media are considered: edits and moderation can remove them.
  return { ...incoming, parts };
}
