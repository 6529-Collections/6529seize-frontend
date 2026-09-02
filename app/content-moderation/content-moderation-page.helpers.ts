import { resolveIpfsUrlSync } from "@/components/ipfs/IPFSContext";
import { formatDate } from "@/i18n/format";
import type { SupportedLocale } from "@/i18n/locales";
import { formatContentModerationEnum } from "@/services/content-moderation/content-moderation-formatters";

export const getSnapshotContent = (
  snapshot: Record<string, unknown>
): string => {
  const title = snapshot["title"];
  const parts = snapshot["parts"];
  const contentParts =
    typeof title === "string" && title.trim().length > 0 ? [title] : [];
  if (!Array.isArray(parts)) return contentParts.join("\n\n");
  return [
    ...contentParts,
    ...parts
      .map((part) => {
        if (part === null || typeof part !== "object") return "";
        const content = (part as Record<string, unknown>)["content"];
        return typeof content === "string" ? content : "";
      })
      .filter((content) => content.length > 0),
  ].join("\n\n");
};

export const getRecord = (value: unknown): Record<string, unknown> | null =>
  value !== null && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : null;

interface SnapshotAsset {
  readonly key: string;
  readonly label: string;
  readonly url: string | null;
}

export const getSnapshotAssets = (
  snapshot: Record<string, unknown>
): SnapshotAsset[] => {
  const parts = snapshot["parts"];
  if (!Array.isArray(parts)) return [];
  return parts.flatMap((part, partIndex) => {
    const partRecord = getRecord(part);
    if (!partRecord) return [];
    const media = Array.isArray(partRecord["media"]) ? partRecord["media"] : [];
    const attachments = Array.isArray(partRecord["attachments"])
      ? partRecord["attachments"]
      : [];
    return [
      ...media.flatMap((value, mediaIndex): SnapshotAsset[] => {
        const item = getRecord(value);
        if (
          !item ||
          typeof item["url"] !== "string" ||
          typeof item["mime_type"] !== "string"
        )
          return [];
        return [
          {
            key: `part-${partIndex}-media-${mediaIndex}`,
            label: item["mime_type"],
            url: item["url"],
          },
        ];
      }),
      ...attachments.flatMap((value, attachmentIndex): SnapshotAsset[] => {
        const item = getRecord(value);
        if (!item || typeof item["original_file_name"] !== "string") return [];
        const status =
          typeof item["status"] === "string"
            ? ` (${formatContentModerationEnum(item["status"])})`
            : "";
        return [
          {
            key: `part-${partIndex}-attachment-${attachmentIndex}`,
            label: `${item["original_file_name"]}${status}`,
            url: typeof item["ipfs_url"] === "string" ? item["ipfs_url"] : null,
          },
        ];
      }),
    ];
  });
};

export const getSafeAssetUrl = (value: string | null): string | null => {
  if (!value) return null;
  try {
    const resolved = resolveIpfsUrlSync(value);
    const url = new URL(resolved);
    return url.protocol === "http:" || url.protocol === "https:"
      ? resolved
      : null;
  } catch {
    return null;
  }
};

export const formatEvidence = (value: unknown): string => {
  if (typeof value === "string") return value;
  try {
    const serialized: unknown = JSON.stringify(value);
    return typeof serialized === "string" ? serialized : String(value);
  } catch {
    return String(value);
  }
};

export const formatTimestamp = (
  value: unknown,
  locale: SupportedLocale
): string | null => {
  let timestamp = Number.NaN;
  if (typeof value === "number") {
    timestamp = value;
  } else if (typeof value === "string") {
    timestamp = Number(value);
  }
  if (!Number.isFinite(timestamp)) return null;
  return formatDate(locale, timestamp, {
    dateStyle: "medium",
    timeStyle: "short",
  });
};
