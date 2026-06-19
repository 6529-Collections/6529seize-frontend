"use client";

import ContentDisplay from "@/components/waves/drops/ContentDisplay";
import {
  buildProcessedContent,
  type ProcessedContent,
} from "@/components/waves/drops/media-utils";
import { getRandomColorWithSeed, getTimeAgoShort } from "@/helpers/Helpers";
import { getScaledImageUri, ImageScale } from "@/helpers/image.helpers";
import { getWaveRoute } from "@/helpers/navigation.helpers";
import type { SidebarWave } from "@/types/waves.types";
import {
  getWaveTrustSummaryLabel,
  WaveTrustSignals,
} from "@/components/waves/WaveTrustSignals";
import { DEFAULT_LOCALE } from "@/i18n/locales";
import { t } from "@/i18n/messages";
import Image from "next/image";
import Link from "next/link";

interface ExploreWaveCardProps {
  readonly wave: SidebarWave;
}

const EXPLORE_WAVE_CARD_LOCALE = DEFAULT_LOCALE;

export function ExploreWaveCard({ wave }: ExploreWaveCardProps) {
  const waveHref = getWaveRoute({
    waveId: wave.id,
    isDirectMessage: wave.isDirectMessage,
    isApp: false,
  });

  const banner1 = getRandomColorWithSeed(wave.id);
  const banner2 = getRandomColorWithSeed(wave.name);
  const imageAreaStyle = !wave.picture
    ? {
        background: `linear-gradient(135deg, ${banner1} 0%, ${banner2} 100%)`,
      }
    : undefined;

  const lastMessageTime = wave.latestDropTimestamp;
  const hasDrops = lastMessageTime !== null;
  const descriptionPreview = getWavePreviewContent(wave);
  const scoreSummaryLabel = getWaveTrustSummaryLabel({
    waveRep: wave.waveRep,
    waveScore: wave.waveScore,
  });
  const cardAriaLabel =
    scoreSummaryLabel === null
      ? t(EXPLORE_WAVE_CARD_LOCALE, "waves.explore.card.viewAriaLabel", {
          waveName: wave.name,
        })
      : t(
          EXPLORE_WAVE_CARD_LOCALE,
          "waves.explore.card.viewWithScoreAriaLabel",
          {
            waveName: wave.name,
            scoreSummary: scoreSummaryLabel,
          }
        );

  return (
    <Link
      href={waveHref}
      prefetch={false}
      className="tw-group tw-relative tw-block tw-overflow-hidden tw-rounded-xl tw-bg-iron-950 tw-text-left tw-no-underline tw-transition-all tw-duration-300 tw-ease-out focus-visible:tw-outline-none focus-visible:tw-ring-2 focus-visible:tw-ring-iron-500/30"
      aria-label={cardAriaLabel}
    >
      <div className="tw-pointer-events-none tw-absolute tw-inset-0 tw-z-10 tw-rounded-xl tw-border tw-border-solid tw-border-white/10" />
      <div
        className="tw-relative tw-aspect-[20/9] tw-overflow-hidden"
        style={imageAreaStyle}
      >
        {wave.picture && (
          <Image
            src={getScaledImageUri(wave.picture, ImageScale.AUTOx450)}
            alt={t(EXPLORE_WAVE_CARD_LOCALE, "waves.explore.card.coverAlt", {
              waveName: wave.name,
            })}
            fill
            sizes="(max-width: 639px) 100vw, (max-width: 1023px) 50vw, 33vw"
            className="tw-object-cover tw-transition-transform tw-duration-700 tw-will-change-transform desktop-hover:group-hover:tw-scale-105"
          />
        )}
      </div>

      <div className="tw-px-4 tw-py-6 sm:tw-p-5">
        <span className="tw-m-0 tw-line-clamp-1 tw-break-words tw-text-sm tw-font-semibold tw-leading-tight tw-text-white tw-transition-colors group-hover:tw-text-white/80 sm:tw-text-base">
          {wave.name}
        </span>
        <WaveTrustSignals
          waveRep={wave.waveRep}
          waveScore={wave.waveScore}
          variant="header-inline"
          mode="summary"
          className="tw-mt-3"
        />

        {descriptionPreview && (
          <MessagePreviewContent previewContent={descriptionPreview} />
        )}

        {hasDrops && (
          <div className="tw-mt-6 tw-flex tw-flex-wrap tw-items-center tw-gap-x-1.5 tw-gap-y-1 tw-text-[11px] tw-text-iron-500 sm:tw-text-xs">
            <span className="tw-relative tw-flex tw-h-2 tw-w-2">
              <span className="tw-absolute tw-inline-flex tw-h-full tw-w-full tw-animate-ping tw-rounded-full tw-bg-success/60" />
              <span className="tw-relative tw-inline-flex tw-h-2 tw-w-2 tw-rounded-full tw-bg-success" />
            </span>
            <span className="tw-text-iron-300">
              {getTimeAgoShort(lastMessageTime)} ·{" "}
              {wave.totalDropsCount.toLocaleString()}
            </span>{" "}
            drops
          </div>
        )}

        {!hasDrops && (
          <div className="tw-mt-3 tw-text-[11px] tw-text-iron-500 sm:tw-text-xs">
            {t(EXPLORE_WAVE_CARD_LOCALE, "waves.explore.card.noDropsYet")}
          </div>
        )}
      </div>
    </Link>
  );
}

function MessagePreviewContent({
  previewContent,
}: {
  readonly previewContent: ProcessedContent | null;
}) {
  if (!previewContent) {
    return null;
  }

  return (
    <ContentDisplay
      content={previewContent}
      shouldClamp={false}
      className="tw-mt-2.5 tw-flex tw-min-w-0 tw-flex-1 tw-items-start tw-gap-1 tw-overflow-hidden tw-text-iron-500"
      textClassName="tw-line-clamp-2 tw-break-words tw-text-[10px] tw-font-normal tw-leading-tight sm:tw-text-xs"
      linkify={false}
    />
  );
}

function getWavePreviewContent(wave: SidebarWave): ProcessedContent | null {
  const combinedText = wave.descriptionDrop.contents?.trim() ?? "";
  const media = [...wave.descriptionDrop.media];

  if (!combinedText && media.length === 0) {
    return null;
  }

  return buildProcessedContent(combinedText || null, media);
}
