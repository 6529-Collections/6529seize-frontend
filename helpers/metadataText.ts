import { sanitizeHtmlToText } from "@/lib/text/html";
import { markdownToPlainText } from "./waves/waveDescriptionPreview";

export function toMetadataExcerpt(
  value: string | null | undefined,
  maxLength = 160
): string | null {
  if (!value || maxLength < 2) return null;

  const plainText = markdownToPlainText(
    sanitizeHtmlToText(value, { preserveTagSpacing: true }),
    { includeImageUrls: false, includeLinkDestinations: false }
  )
    .replaceAll(/\s+/g, " ")
    .trim();

  if (!plainText) return null;
  if (plainText.length <= maxLength) return plainText;

  const rawCandidate = plainText.slice(0, maxLength - 1);
  const candidate = rawCandidate.trimEnd();
  if (candidate.length < rawCandidate.length) {
    return `${candidate}…`;
  }

  const lastSpace = candidate.lastIndexOf(" ");
  const boundary =
    lastSpace >= Math.floor(maxLength * 0.6) ? lastSpace : candidate.length;
  return `${candidate.slice(0, boundary).trimEnd()}…`;
}
