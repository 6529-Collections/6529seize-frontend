import type { ApiDrop } from "@/generated/models/ApiDrop";
import { markdownToPlainText } from "@/helpers/waves/waveDescriptionPreview";
import { formatInteger } from "@/i18n/format";
import { DEFAULT_LOCALE } from "@/i18n/locales";
import { t } from "@/i18n/messages";

const COMPACT_PREVIEW_MAX_LENGTH = 240;

type CompactPreviewDrop = Omit<ApiDrop, "parts"> & {
  readonly parts?: ApiDrop["parts"] | null;
};

const truncateCompactPreviewText = (value: string): string =>
  value.length > COMPACT_PREVIEW_MAX_LENGTH
    ? `${value.slice(0, COMPACT_PREVIEW_MAX_LENGTH).trimEnd()}...`
    : value;

export const getBoostedDropBoostLabel = (boosts: number): string =>
  t(
    DEFAULT_LOCALE,
    boosts === 1
      ? "home.boostedDrop.boostCount.one"
      : "home.boostedDrop.boostCount.many",
    { count: formatInteger(DEFAULT_LOCALE, boosts) }
  );

export const getBoostedDropAuthorLabel = (
  handle: string | null | undefined
): string => {
  const trimmedHandle = handle?.trim() ?? "";

  if (trimmedHandle.length > 0) {
    return trimmedHandle;
  }

  return t(DEFAULT_LOCALE, "home.boostedDrop.anonymousAuthor");
};

export const getBoostedDropOpenLabel = (
  authorHandle: string | null | undefined
): string =>
  t(DEFAULT_LOCALE, "home.boostedDrop.openDrop", {
    author: getBoostedDropAuthorLabel(authorHandle),
  });

export const getBoostedDropCompactAuthorLabel = (
  authorHandle: string | null | undefined
): string =>
  t(DEFAULT_LOCALE, "home.boostedDrop.compactAuthor", {
    author: getBoostedDropAuthorLabel(authorHandle),
  });

export const getBoostedDropCompactPreviewText = ({
  parts,
  title,
}: CompactPreviewDrop): string | null => {
  const trimmedTitle = title?.trim() ?? "";
  const content =
    (parts ?? [])
      .map((part) => markdownToPlainText(part.content ?? ""))
      .find((partText) => partText.length > 0) ?? "";

  let previewText = content;
  if (
    trimmedTitle.length > 0 &&
    content.length > 0 &&
    trimmedTitle !== content
  ) {
    previewText = `${trimmedTitle}: ${content}`;
  } else if (trimmedTitle.length > 0) {
    previewText = trimmedTitle;
  }

  return previewText.length > 0
    ? truncateCompactPreviewText(previewText)
    : null;
};
