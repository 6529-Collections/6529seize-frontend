import type { ApiAttachment } from "@/generated/models/ApiAttachment";
import type { ApiDrop } from "@/generated/models/ApiDrop";
import { ApiAttachmentStatus } from "@/generated/models/ApiAttachmentStatus";

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

const FINALIZED_ATTACHMENT_STATUSES = new Set<ApiAttachmentStatus>([
  ApiAttachmentStatus.Ready,
  ApiAttachmentStatus.Bad,
]);

function isFinalizedAttachment(value: unknown): value is ApiAttachment {
  return (
    isRecord(value) &&
    typeof value["attachment_id"] === "string" &&
    FINALIZED_ATTACHMENT_STATUSES.has(value["status"] as ApiAttachmentStatus)
  );
}

export function reconcileAttachmentStatusUpdate(
  existingAttachment: ApiAttachment,
  incomingAttachment: ApiAttachment
): ApiAttachment {
  if (
    isFinalizedAttachment(existingAttachment) &&
    !isFinalizedAttachment(incomingAttachment)
  ) {
    return existingAttachment;
  }

  return incomingAttachment;
}

export function reconcileFinalizedDropAttachments(
  drop: ApiDrop,
  existingDrop: unknown
): ApiDrop {
  if (
    !Array.isArray(drop.parts) ||
    !isRecord(existingDrop) ||
    !Array.isArray(existingDrop["parts"])
  ) {
    return drop;
  }

  const existingParts = existingDrop["parts"] as unknown[];
  const existingUpdatedAt = existingDrop["updated_at"];
  // Intentional drop edits receive a newer numeric updated_at from the backend.
  // Equal or null incoming values can be attachment-lifecycle snapshots.
  if (
    typeof drop.updated_at === "number" &&
    (existingUpdatedAt === null ||
      (typeof existingUpdatedAt === "number" &&
        drop.updated_at > existingUpdatedAt))
  ) {
    return drop;
  }

  const existingPartsById = new Map(
    existingParts.flatMap((part) =>
      isRecord(part) && typeof part["part_id"] === "number"
        ? [[part["part_id"], part] as const]
        : []
    )
  );
  const parts = drop.parts.map((part) => {
    const existingPart = existingPartsById.get(part.part_id);
    if (
      !isRecord(existingPart) ||
      !Array.isArray(existingPart["attachments"])
    ) {
      return part;
    }

    const finalizedAttachments = existingPart["attachments"].filter(
      isFinalizedAttachment
    );
    if (finalizedAttachments.length === 0) {
      return part;
    }

    const finalizedById = new Map(
      finalizedAttachments.map((attachment) => [
        attachment.attachment_id,
        attachment,
      ])
    );
    const incomingIds = new Set(
      part.attachments.map((attachment) => attachment.attachment_id)
    );
    const attachments = part.attachments.map((attachment) => {
      const existingFinalized = finalizedById.get(attachment.attachment_id);
      // A terminal incoming record is authoritative (for example ready -> bad).
      if (!existingFinalized || isFinalizedAttachment(attachment)) {
        return attachment;
      }
      return existingFinalized;
    });

    for (const attachment of finalizedAttachments) {
      if (!incomingIds.has(attachment.attachment_id)) {
        attachments.push(attachment);
      }
    }

    return { ...part, attachments };
  });
  const changed = parts.some((part, index) => part !== drop.parts[index]);

  return changed ? { ...drop, parts } : drop;
}
