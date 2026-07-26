import type { PublicReviewSectionDefinition } from "@/lib/public-review/publicReviewTypes";

const LEVEL_TWO_HEADING = /^##\s+(.+?)\s*$/gm;

export function getPublicReviewHeadingId(title: string): string {
  return title
    .normalize("NFKD")
    .toLowerCase()
    .replace(/[`*_~]/g, "")
    .replace(/^\d+\.\s*/, "")
    .replace(/[^\p{Letter}\p{Number}]+/gu, "-")
    .replace(/^-+|-+$/g, "");
}

export function extractPublicReviewSections(
  markdown: string
): PublicReviewSectionDefinition[] {
  return Array.from(markdown.matchAll(LEVEL_TWO_HEADING), (match) => {
    const title = match[1]?.trim() ?? "";
    return {
      id: getPublicReviewHeadingId(title),
      title,
    };
  }).filter((section) => section.id.length > 0);
}
