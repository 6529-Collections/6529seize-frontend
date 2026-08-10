"use client";

import MediaDisplay from "@/components/drops/view/item/content/media/MediaDisplay";
import { ImageScale } from "@/helpers/image.helpers";
import type { ExtendedDrop } from "@/helpers/waves/drop.helpers";
import { getDropPreviewImageUrl } from "@/helpers/waves/drop.helpers";
import { markdownToPlainText } from "@/helpers/waves/waveDescriptionPreview";
import { useBrowserLocale } from "@/hooks/useBrowserLocale";
import { t } from "@/i18n/messages";
import { useMemo } from "react";

interface WaveLeaderboardGridItemViewportProps {
  readonly drop: ExtendedDrop;
  readonly isCompactMode: boolean;
}

const GRID_PREVIEW_MAX_LENGTH = 320;

const getGridPreviewClassName = (isCompactMode: boolean): string =>
  `tw-relative tw-flex tw-aspect-square tw-min-h-[14rem] tw-w-full tw-items-center tw-justify-center tw-overflow-hidden md:tw-min-h-[15rem] ${
    isCompactMode ? "tw-rounded-lg tw-bg-iron-900" : "tw-bg-iron-950"
  }`;

const removeLeadingTitle = (content: string, title: string): string => {
  if (!title || !content.startsWith(title)) {
    return content;
  }

  return content
    .slice(title.length)
    .replace(/^\s*(?:-|:|–|—)\s*/, "")
    .trimStart();
};

const truncatePreview = (content: string): string => {
  if (content.length <= GRID_PREVIEW_MAX_LENGTH) {
    return content;
  }

  const candidate = content.slice(0, GRID_PREVIEW_MAX_LENGTH + 1);
  const lastWordBoundary = candidate.lastIndexOf(" ");
  const endIndex =
    lastWordBoundary > GRID_PREVIEW_MAX_LENGTH / 2
      ? lastWordBoundary
      : GRID_PREVIEW_MAX_LENGTH;
  return `${candidate.slice(0, endIndex).trimEnd()}…`;
};

const getWaveLeaderboardGridPreviewText = ({
  content,
  title,
}: {
  readonly content: string;
  readonly title: string | null | undefined;
}): string | null => {
  const contentWithoutLinkDestinations = content.replace(
    /(?<!!)\[([^\]]+)]\((?:\\.|[^)])*\)/g,
    "$1"
  );
  const plainContent = markdownToPlainText(contentWithoutLinkDestinations);
  const plainTitle = markdownToPlainText(title?.trim() ?? "");
  const preview = removeLeadingTitle(plainContent, plainTitle).trim();

  return preview ? truncatePreview(preview) : null;
};

export function WaveLeaderboardGridItemViewport({
  drop,
  isCompactMode,
}: WaveLeaderboardGridItemViewportProps) {
  const locale = useBrowserLocale();
  const activePart = drop.parts[0];
  const primaryMedia = activePart?.media[0];
  const mediaUrl = primaryMedia?.url.trim() ?? "";
  const hasMedia = mediaUrl.length > 0;
  const previewText = useMemo(
    () =>
      getWaveLeaderboardGridPreviewText({
        content: activePart?.content ?? "",
        title: drop.title,
      }),
    [activePart?.content, drop.title]
  );
  const previewImageUrl = useMemo(
    () => getDropPreviewImageUrl(drop.metadata),
    [drop.metadata]
  );
  const mediaMimeType = primaryMedia?.mime_type ?? "image/jpeg";
  const mediaPreviewImageUrl = mediaMimeType.includes("image")
    ? null
    : previewImageUrl;
  const previewClassName = getGridPreviewClassName(isCompactMode);
  const previewContent = hasMedia ? (
    <MediaDisplay
      media_mime_type={mediaMimeType}
      media_url={mediaUrl}
      disableMediaInteraction={true}
      fillVideoContainer={true}
      imageScale={ImageScale.AUTOx450}
      previewImageUrl={mediaPreviewImageUrl}
    />
  ) : (
    <div className="tw-flex tw-h-full tw-w-full tw-flex-col tw-items-start tw-p-4 tw-text-left sm:tw-p-5">
      <span className="tw-text-[11px] tw-font-semibold tw-uppercase tw-tracking-[0.16em] tw-text-iron-500">
        {t(locale, "waves.leaderboard.grid.preview")}
      </span>
      <p className="tw-line-clamp-8 tw-mb-0 tw-mt-3 tw-whitespace-normal tw-break-words tw-text-sm tw-leading-6 tw-text-iron-200">
        {previewText ?? t(locale, "waves.leaderboard.grid.previewUnavailable")}
      </p>
    </div>
  );

  return (
    <div className="tw-relative tw-flex-shrink-0 tw-overflow-hidden tw-bg-iron-950">
      <div className={previewClassName}>{previewContent}</div>
    </div>
  );
}
