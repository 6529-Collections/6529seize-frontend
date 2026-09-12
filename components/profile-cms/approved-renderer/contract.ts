import { z } from "zod";

import type { CmsBlockV1 } from "@/lib/profile-cms/protocol/v1";
import { CMS_APPROVED_VARIANTS } from "@/lib/profile-cms/studio/presentation";

const itemSchema = z.object({
  asset_id: z.string(),
  title: z.string().optional(),
  subtitle: z.string().optional(),
  page_id: z.string().optional(),
  category: z.string().optional(),
});
const rowSchema = z.object({
  label: z.string(),
  value: z.string(),
  page_id: z.string().optional(),
});

export type ApprovedGalleryItem = z.infer<typeof itemSchema>;
export type ApprovedRow = z.infer<typeof rowSchema>;

function getApprovedGalleryItems(block: CmsBlockV1): ApprovedGalleryItem[] {
  const value = record(block)["items"];
  if (!Array.isArray(value)) return [];
  return value.flatMap((entry: unknown) => {
    const parsed = itemSchema.safeParse(entry);
    return parsed.success ? [parsed.data] : [];
  });
}

/** Canonical artwork order wins; annotations are consumed once per occurrence. */
export function getApprovedGalleryEntries(
  block: CmsBlockV1
): ApprovedGalleryItem[] {
  const supplied = getApprovedGalleryItems(block);
  const raw = record(block)["asset_ids"];
  const ids = Array.isArray(raw)
    ? raw.filter((id): id is string => typeof id === "string")
    : [];
  if (!ids.length) return supplied;
  const remaining = [...supplied];
  return ids.map((asset_id) => {
    const index = remaining.findIndex((item) => item.asset_id === asset_id);
    return index < 0 ? { asset_id } : remaining.splice(index, 1)[0]!;
  });
}

export function getApprovedRows(block: CmsBlockV1): ApprovedRow[] {
  const value = record(block)["rows"];
  if (!Array.isArray(value)) return [];
  return value.flatMap((entry: unknown) => {
    const parsed = rowSchema.safeParse(entry);
    return parsed.success ? [parsed.data] : [];
  });
}

export function getApprovedSection(block: CmsBlockV1) {
  const value = record(block)["presentation"];
  const presentation = isRecord(value) ? value : {};
  const variant = CMS_APPROVED_VARIANTS.find(
    (entry) => entry === presentation["variant"]
  );
  return {
    variant,
    group:
      typeof presentation["group"] === "string"
        ? presentation["group"]
        : undefined,
  };
}

export function getApprovedGroups(blocks: readonly CmsBlockV1[]) {
  const groups: { key: string; blocks: CmsBlockV1[]; grouped: boolean }[] = [];
  for (const block of blocks) {
    const group = getApprovedSection(block).group;
    const last = groups.at(-1);
    if (group && last?.grouped && last.key === group) last.blocks.push(block);
    else
      groups.push({
        key: group ?? block.id,
        blocks: [block],
        grouped: !!group,
      });
  }
  return groups;
}

export function record(block: CmsBlockV1): Readonly<Record<string, unknown>> {
  return block;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}
/** Choose readable foreground text for the editable six-digit accent color. */
export function getApprovedAccentInk(accent: string): "#000000" | "#ffffff" {
  const channels = [1, 3, 5].map((offset) => {
    const value = Number.parseInt(accent.slice(offset, offset + 2), 16) / 255;
    return value <= 0.04045 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4;
  });
  const luminance =
    0.2126 * (channels[0] ?? 0) +
    0.7152 * (channels[1] ?? 0) +
    0.0722 * (channels[2] ?? 0);
  return luminance > 0.179 ? "#000000" : "#ffffff";
}
