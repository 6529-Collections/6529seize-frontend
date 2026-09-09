"use client";

import MediaDisplay from "@/components/drops/view/item/content/media/MediaDisplay";
import VotingModalButton from "@/components/voting/VotingModalButton";
import WaveDropActionsOpen from "@/components/waves/drops/WaveDropActionsOpen";
import { ImageScale } from "@/helpers/image.helpers";
import type { ExtendedDrop } from "@/helpers/waves/drop.helpers";
import { getDropPreviewImageUrl } from "@/helpers/waves/drop.helpers";
import { markdownToPlainText } from "@/helpers/waves/waveDescriptionPreview";
import { useBrowserLocale } from "@/hooks/useBrowserLocale";
import { t } from "@/i18n/messages";
import { ChevronRightIcon } from "@heroicons/react/20/solid";
import React, { useCallback, useMemo } from "react";

interface WaveLeaderboardGridItemViewportProps {
  readonly drop: ExtendedDrop;
  readonly titleId: string;
  readonly isCompactMode: boolean;
  readonly isContentOnlyMode: boolean;
  readonly showDesktopContentOnlyActions: boolean;
  readonly canOpenDrop: boolean;
  readonly canShowVotingAction: boolean;
  readonly onOpenDrop: () => void;
  readonly onVoteButtonClick: () => void;
}

interface GridItemSummary {
  readonly title: string | null;
  readonly description: string | null;
}

const GRID_TITLE_MAX_LENGTH = 160;
const GRID_DESCRIPTION_MAX_LENGTH = 260;
const GRID_SUMMARY_MARKDOWN_OPTIONS = {
  includeImageUrls: false,
  includeLinkDestinations: false,
} as const;

const getGridMediaWrapperClassName = (isCompactMode: boolean): string =>
  `tw-relative tw-flex tw-aspect-square tw-min-h-[14rem] tw-items-center tw-justify-center tw-overflow-hidden md:tw-min-h-[15rem] ${
    isCompactMode ? "tw-rounded-lg tw-bg-iron-900" : "tw-bg-iron-950"
  }`;

const truncateAtWord = (content: string, maxLength: number): string => {
  const characters = Array.from(content);
  if (characters.length <= maxLength) {
    return content;
  }

  const candidate = characters.slice(0, maxLength + 1);
  const lastWordBoundary = candidate.lastIndexOf(" ");
  const endIndex =
    lastWordBoundary > maxLength / 2 ? lastWordBoundary : maxLength;
  return `${candidate.slice(0, endIndex).join("").trimEnd()}…`;
};

const removeLeadingTitle = (content: string, title: string): string => {
  const normalizedContent = content.normalize("NFC");
  const normalizedTitle = title.normalize("NFC");
  const contentPrefix = normalizedContent.slice(0, normalizedTitle.length);
  const isSameTitle =
    normalizedTitle.length > 0 &&
    contentPrefix.localeCompare(normalizedTitle, "en-US", {
      sensitivity: "base",
    }) === 0;

  if (!isSameTitle) {
    return content;
  }

  return normalizedContent
    .slice(contentPrefix.length)
    .replace(/^\s*(?:-|:|–|—)\s*/, "")
    .trimStart();
};

const getWaveLeaderboardGridItemSummary = ({
  content,
  title,
}: {
  readonly content: string;
  readonly title: string | null | undefined;
}): GridItemSummary => {
  const contentBlocks = content
    .split(/\n\s*\n/)
    .map((block) => markdownToPlainText(block, GRID_SUMMARY_MARKDOWN_OPTIONS))
    .filter((block) => block.length > 0);
  const plainContent = markdownToPlainText(
    content,
    GRID_SUMMARY_MARKDOWN_OPTIONS
  );
  const explicitTitle = markdownToPlainText(
    title?.trim() ?? "",
    GRID_SUMMARY_MARKDOWN_OPTIONS
  );
  const firstBlock = contentBlocks[0] ?? "";
  const derivedTitle =
    explicitTitle ||
    (Array.from(firstBlock).length <= GRID_TITLE_MAX_LENGTH ? firstBlock : "");
  let descriptionSource = plainContent;
  if (explicitTitle) {
    descriptionSource = removeLeadingTitle(plainContent, explicitTitle);
  } else if (derivedTitle) {
    descriptionSource = contentBlocks.slice(1).join(" ");
  }

  return {
    title: derivedTitle
      ? truncateAtWord(derivedTitle, GRID_TITLE_MAX_LENGTH)
      : null,
    description: descriptionSource
      ? truncateAtWord(descriptionSource, GRID_DESCRIPTION_MAX_LENGTH)
      : null,
  };
};

export const WaveLeaderboardGridItemViewport: React.FC<
  WaveLeaderboardGridItemViewportProps
> = ({
  drop,
  titleId,
  isCompactMode,
  isContentOnlyMode,
  showDesktopContentOnlyActions,
  canOpenDrop,
  canShowVotingAction,
  onOpenDrop,
  onVoteButtonClick,
}) => {
  const locale = useBrowserLocale();
  const activePart = drop.parts[0];
  const primaryMedia = activePart?.media[0];
  const mediaUrl = primaryMedia?.url.trim() ?? "";
  const hasMedia = mediaUrl.length > 0;
  const hasTextContent = (activePart?.content ?? "").trim().length > 0;
  const summary = useMemo(
    () =>
      getWaveLeaderboardGridItemSummary({
        content: activePart?.content ?? "",
        title: drop.title,
      }),
    [activePart?.content, drop.title]
  );
  const displayTitle =
    summary.title ?? t(locale, "waves.leaderboard.grid.untitled");
  const previewImageUrl = useMemo(
    () => getDropPreviewImageUrl(drop.metadata),
    [drop.metadata]
  );
  const mediaMimeType = primaryMedia?.mime_type ?? "image/jpeg";
  const mediaPreviewImageUrl = mediaMimeType.includes("image")
    ? null
    : previewImageUrl;
  const showSummary = !isContentOnlyMode || !hasMedia;
  const openActionLabel = hasTextContent
    ? t(locale, "waves.leaderboard.grid.readFull")
    : t(locale, "waves.leaderboard.grid.open");
  const onOpenButtonClick = useCallback<
    React.MouseEventHandler<HTMLButtonElement>
  >(
    (event) => {
      event.stopPropagation();
      onOpenDrop();
    },
    [onOpenDrop]
  );

  return (
    <div className="tw-relative tw-bg-iron-950">
      {hasMedia && (
        <div className={getGridMediaWrapperClassName(isCompactMode)}>
          <MediaDisplay
            media_mime_type={mediaMimeType}
            media_url={mediaUrl}
            disableMediaInteraction={true}
            fillVideoContainer={true}
            imageScale={ImageScale.AUTOx450}
            previewImageUrl={mediaPreviewImageUrl}
          />
        </div>
      )}

      {showSummary ? (
        <div className={`tw-px-3 tw-pb-2 ${hasMedia ? "tw-pt-3" : "tw-pt-4"}`}>
          <h3
            id={titleId}
            className="tw-mb-0 tw-line-clamp-3 tw-break-words tw-text-sm tw-font-semibold tw-leading-5 tw-text-iron-100"
          >
            {displayTitle}
          </h3>
          {summary.description && (
            <p
              className={`tw-mb-0 tw-mt-2 tw-break-words tw-text-xs tw-font-normal tw-leading-5 tw-text-iron-400 ${
                hasMedia ? "tw-line-clamp-3" : "tw-line-clamp-6"
              }`}
            >
              {summary.description}
            </p>
          )}
          {canOpenDrop && !isContentOnlyMode && (
            <button
              type="button"
              onClick={onOpenButtonClick}
              aria-label={t(locale, "waves.leaderboard.grid.openNamed", {
                title: displayTitle,
              })}
              className="tw-mt-1 tw-inline-flex tw-min-h-11 tw-items-center tw-gap-0.5 tw-border-0 tw-bg-transparent tw-p-0 tw-text-xs tw-font-semibold tw-text-primary-400 tw-underline-offset-2 tw-transition-colors focus-visible:tw-outline focus-visible:tw-outline-2 focus-visible:tw-outline-offset-2 focus-visible:tw-outline-primary-400 desktop-hover:hover:tw-text-primary-300 desktop-hover:hover:tw-underline"
            >
              {openActionLabel}
              <ChevronRightIcon aria-hidden="true" className="tw-size-3.5" />
            </button>
          )}
        </div>
      ) : (
        <h3 id={titleId} className="tw-sr-only">
          {displayTitle}
        </h3>
      )}

      {showDesktopContentOnlyActions && (
        <div
          data-testid={`wave-leaderboard-grid-item-content-only-actions-${drop.id}`}
          className="tw-pointer-events-none tw-absolute tw-inset-x-0 tw-bottom-0 tw-z-10 tw-bg-gradient-to-t tw-from-black/90 tw-via-black/65 tw-to-transparent tw-p-2 tw-opacity-0 tw-transition-opacity tw-duration-200 group-focus-within:tw-opacity-100 desktop-hover:group-hover:tw-opacity-100 touch-only:tw-opacity-100"
        >
          <div className="tw-pointer-events-auto tw-flex tw-flex-wrap tw-items-center tw-justify-end tw-gap-2 [&_button]:tw-min-w-11">
            {canOpenDrop && <WaveDropActionsOpen drop={drop} />}
            {canShowVotingAction && (
              <VotingModalButton drop={drop} onClick={onVoteButtonClick} />
            )}
          </div>
        </div>
      )}
    </div>
  );
};
