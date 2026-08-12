import type { ApiDrop } from "@/generated/models/ApiDrop";
import { ApiDropMediaStatus } from "@/generated/models/ApiDropMediaStatus";
import { ApiNftLinkMediaPreviewStatusEnum } from "@/generated/models/ApiNftLinkMediaPreview";
import type { WaveProposalCardRecipe } from "@/types/waves.types";
import { markdownToPlainText } from "./waveDescriptionPreview";

const PROPOSAL_CARD_TITLE_MAX_LENGTH = 180;
export const PROPOSAL_CARD_EXCERPT_MIN_LENGTH = 120;
export const PROPOSAL_CARD_EXCERPT_MAX_LENGTH = 1000;
const PROPOSAL_CARD_EXCERPT_DEFAULT_LENGTH = 360;

export const isValidProposalCardExcerptMaxCharacters = (
  value: number
): boolean =>
  Number.isInteger(value) &&
  value >= PROPOSAL_CARD_EXCERPT_MIN_LENGTH &&
  value <= PROPOSAL_CARD_EXCERPT_MAX_LENGTH;

export const DEFAULT_PROPOSAL_CARD_RECIPE: WaveProposalCardRecipe = {
  version: 1,
  layout: "summary",
  excerptMaxCharacters: PROPOSAL_CARD_EXCERPT_DEFAULT_LENGTH,
  showMediaThumbnail: true,
};

export const normalizeProposalCardExcerptMaxCharacters = (
  value: number | null | undefined
): number => {
  if (typeof value !== "number" || !Number.isFinite(value)) {
    return PROPOSAL_CARD_EXCERPT_DEFAULT_LENGTH;
  }

  return Math.min(
    PROPOSAL_CARD_EXCERPT_MAX_LENGTH,
    Math.max(PROPOSAL_CARD_EXCERPT_MIN_LENGTH, Math.round(value))
  );
};

interface ProposalCardPreviewImage {
  readonly url: string;
}

interface ProposalCardViewModel {
  readonly title: string | null;
  readonly excerpt: string | null;
  readonly previewImage: ProposalCardPreviewImage | null;
  readonly partCount: number;
  readonly mediaCount: number;
  readonly attachmentCount: number;
}

type ProposalCardDrop = Pick<
  ApiDrop,
  "title" | "parts" | "parts_count" | "nft_links"
>;

const replaceHtmlTagsWithSpaces = (value: string): string => {
  let result = "";
  let cursor = 0;

  while (cursor < value.length) {
    const tagStart = value.indexOf("<", cursor);
    if (tagStart === -1) {
      return result + value.slice(cursor);
    }

    const tagEnd = value.indexOf(">", tagStart + 1);
    if (tagEnd === -1) {
      return result + value.slice(cursor);
    }

    result += `${value.slice(cursor, tagStart)} `;
    cursor = tagEnd + 1;
  }

  return result;
};

const normalizePlainText = (value: string): string =>
  replaceHtmlTagsWithSpaces(markdownToPlainText(value))
    .replaceAll(/\s+/g, " ")
    .trim();

const normalizeComparableText = (value: string): string =>
  normalizePlainText(value).toLowerCase();

const truncateAtWord = (value: string, maxLength: number): string => {
  if (value.length <= maxLength) {
    return value;
  }

  const candidate = value.slice(0, maxLength + 1);
  const wordBoundary = candidate.lastIndexOf(" ");
  const cutAt =
    wordBoundary >= Math.floor(maxLength * 0.6) ? wordBoundary : maxLength;

  return `${candidate.slice(0, cutAt).trimEnd()}…`;
};

const getAuthoredText = (drop: ProposalCardDrop): string =>
  drop.parts
    .map((part) => part.content?.trim() ?? "")
    .filter(Boolean)
    .join("\n\n");

const getFirstMeaningfulLine = (
  lines: readonly string[]
): { readonly index: number; readonly text: string } | null => {
  for (let index = 0; index < lines.length; index += 1) {
    const line = lines[index];
    if (line === undefined) {
      continue;
    }

    const text = normalizePlainText(line);
    if (text) {
      return { index, text };
    }
  }

  return null;
};

const isStaticImage = (mimeType: string, url: string): boolean => {
  const normalizedMimeType = mimeType.toLowerCase();
  const normalizedUrl = url.toLowerCase().split("?")[0] ?? "";

  return (
    normalizedMimeType.startsWith("image/") &&
    normalizedMimeType !== "image/gif" &&
    !normalizedUrl.endsWith(".gif")
  );
};

const getProposalCardPreviewImage = (
  drop: ProposalCardDrop
): ProposalCardPreviewImage | null => {
  for (const part of drop.parts) {
    const media = part.media.find(
      (item) =>
        (item.media_status === undefined ||
          item.media_status === ApiDropMediaStatus.Ready) &&
        isStaticImage(item.mime_type, item.url)
    );
    if (media) {
      return { url: media.url };
    }
  }

  for (const nftLink of drop.nft_links ?? []) {
    const preview = nftLink.data?.media_preview;
    if (preview?.status !== ApiNftLinkMediaPreviewStatusEnum.Ready) {
      continue;
    }

    const previewMimeType = preview.mime_type?.trim() ?? "";
    const mimeType =
      previewMimeType.length > 0 ? previewMimeType : "image/jpeg";
    const url = [preview.small_url, preview.thumb_url, preview.card_url]
      .map((candidate) => candidate?.trim() ?? "")
      .find(
        (candidate) =>
          candidate.length > 0 && isStaticImage(mimeType, candidate)
      );

    if (url) {
      return { url };
    }
  }

  return null;
};

export const getProposalCardViewModel = (
  drop: ProposalCardDrop,
  recipe: WaveProposalCardRecipe = DEFAULT_PROPOSAL_CARD_RECIPE
): ProposalCardViewModel => {
  const authoredText = getAuthoredText(drop);
  const lines = authoredText.split(/\r?\n/);
  const firstMeaningfulLine = getFirstMeaningfulLine(lines);
  const nativeTitle = drop.title?.trim() ?? "";
  let titleSource = nativeTitle;
  if (!titleSource) {
    titleSource = firstMeaningfulLine?.text ?? "";
  }
  const title = titleSource
    ? truncateAtWord(
        normalizePlainText(titleSource),
        PROPOSAL_CARD_TITLE_MAX_LENGTH
      )
    : null;

  let excerptSource = authoredText;
  if (
    firstMeaningfulLine &&
    titleSource &&
    normalizeComparableText(firstMeaningfulLine.text) ===
      normalizeComparableText(titleSource)
  ) {
    excerptSource = lines
      .filter((_, index) => index !== firstMeaningfulLine.index)
      .join("\n");
  }

  const plainExcerpt = normalizePlainText(excerptSource);
  const excerpt = plainExcerpt
    ? truncateAtWord(
        plainExcerpt,
        normalizeProposalCardExcerptMaxCharacters(recipe.excerptMaxCharacters)
      )
    : null;
  const mediaCount = drop.parts.reduce(
    (count, part) => count + part.media.length,
    0
  );
  const attachmentCount = drop.parts.reduce(
    (count, part) => count + part.attachments.length,
    0
  );

  return {
    title,
    excerpt,
    previewImage: recipe.showMediaThumbnail
      ? getProposalCardPreviewImage(drop)
      : null,
    partCount: Math.max(drop.parts_count, drop.parts.length),
    mediaCount,
    attachmentCount,
  };
};
