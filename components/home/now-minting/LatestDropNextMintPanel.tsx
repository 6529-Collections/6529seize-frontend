"use client";

import MediaTypeBadge from "@/components/drops/media/MediaTypeBadge";
import DropListItemContentMedia from "@/components/drops/view/item/content/media/DropListItemContentMedia";
import {
  isValidMemeCardId,
  MainStageMemeCardPill,
} from "@/components/memes/drops/MainStageMemeCardLink";
import {
  formatFullDateTime,
  getCanonicalNextMintNumber,
  getMintTimelineDetails,
} from "@/components/meme-calendar/meme-calendar.helpers";
import type { ApiDropV2View } from "@/services/api/drop-v2-view.types";
import { getScaledImageUri, ImageScale } from "@/helpers/image.helpers";
import { getDropPreviewImageUrl } from "@/helpers/waves/drop.helpers";
import useDeviceInfo from "@/hooks/useDeviceInfo";
import { useBrowserLocale } from "@/hooks/useBrowserLocale";
import { formatDate, formatInteger, formatTime } from "@/i18n/format";
import type { SupportedLocale } from "@/i18n/locales";
import { t } from "@/i18n/messages";
import Image from "next/image";
import Link from "next/link";
import { useSyncExternalStore } from "react";
import ArtistPill from "./ArtistPill";
import LatestDropNextMintSubscribe from "./LatestDropNextMintSubscribe";
import NowMintingStatsItem from "./NowMintingStatsItem";

interface LatestDropNextMintPanelProps {
  readonly drop: ApiDropV2View;
  readonly linkMemeCard?: boolean;
  readonly locale?: SupportedLocale;
}

const formatDropTimestamp = (
  timestamp: number,
  locale: SupportedLocale
): string | null => {
  const date = new Date(timestamp);
  if (Number.isNaN(date.getTime())) {
    return null;
  }

  const dateLabel = formatDate(locale, date, {
    month: "short",
    day: "numeric",
  });
  const timeLabel = formatTime(locale, date, {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });

  return `${dateLabel} · ${timeLabel}`;
};

const getMinuteClockSnapshot = () => Math.floor(Date.now() / 60_000);
const getServerMinuteClockSnapshot = () => null;
const subscribeToMinuteClock = (onStoreChange: () => void) => {
  const intervalId = globalThis.setInterval(onStoreChange, 60_000);
  return () => globalThis.clearInterval(intervalId);
};

export function LatestDropNextMintPanelSkeleton() {
  return (
    <div className="tw-relative tw-overflow-hidden tw-rounded-2xl tw-border tw-border-solid tw-border-white/5 tw-bg-iron-950">
      <div className="tw-grid tw-grid-cols-1 tw-gap-y-6 lg:tw-grid-cols-12 xl:tw-grid-cols-9">
        <div className="tw-p-0 lg:tw-col-span-6 xl:tw-col-span-5">
          <div className="tw-relative tw-h-[clamp(360px,65vw,640px)] tw-w-full tw-animate-pulse tw-bg-iron-800/50" />
        </div>
        <div className="tw-p-5 md:tw-p-6 lg:tw-col-span-6 xl:tw-col-span-4">
          <div className="tw-flex tw-flex-col tw-gap-5">
            <div className="tw-space-y-2">
              <div className="tw-h-4 tw-w-24 tw-animate-pulse tw-rounded tw-bg-iron-800/50" />
              <div className="tw-h-7 tw-w-3/4 tw-animate-pulse tw-rounded tw-bg-iron-800/50" />
              <div className="tw-h-4 tw-w-32 tw-animate-pulse tw-rounded tw-bg-iron-800/50" />
            </div>
            <div className="tw-h-32 tw-w-full tw-animate-pulse tw-rounded-lg tw-bg-iron-800/50" />
            <div className="tw-grid tw-grid-cols-2 tw-gap-3">
              {["wave", "mint-date", "submitted", "rating"].map((stat) => (
                <div key={stat} className="tw-space-y-2">
                  <div className="tw-h-4 tw-w-16 tw-animate-pulse tw-rounded tw-bg-iron-800/50" />
                  <div className="tw-h-6 tw-w-24 tw-animate-pulse tw-rounded tw-bg-iron-800/50" />
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function LatestDropNextMintPanel({
  drop,
  linkMemeCard = true,
  locale: requestedLocale,
}: LatestDropNextMintPanelProps) {
  const { hasTouchScreen } = useDeviceInfo();
  const browserLocale = useBrowserLocale();
  const locale = requestedLocale ?? browserLocale;
  const media = drop.parts[0]?.media[0];
  const isHtml = media?.mime_type === "text/html";
  const htmlPreviewImageUrl =
    hasTouchScreen && isHtml
      ? (getDropPreviewImageUrl(drop.metadata) ?? undefined)
      : undefined;
  const title =
    drop.title ??
    drop.metadata.find((metadata) => metadata.data_key === "title")
      ?.data_value ??
    t(locale, "home.nextMint.untitled");
  const author = drop.author;
  const authorHandle = author.handle ?? author.primary_address;
  const authorName = author.handle ?? t(locale, "home.nextMint.anonymous");
  const submittedAt = formatDropTimestamp(drop.created_at, locale);
  const description =
    drop.metadata.find((metadata) => metadata.data_key === "description")
      ?.data_value ?? null;
  const mappedMemeCardId = drop.submission_context?.meme_card_id;
  const hasMappedMemeCard = isValidMemeCardId(mappedMemeCardId);
  const minuteClock = useSyncExternalStore(
    subscribeToMinuteClock,
    getMinuteClockSnapshot,
    getServerMinuteClockSnapshot
  );
  const fallbackNow =
    minuteClock === null ? null : new Date(minuteClock * 60_000);
  const subscriptionTokenId = hasMappedMemeCard
    ? mappedMemeCardId
    : fallbackNow
      ? getCanonicalNextMintNumber(fallbackNow)
      : null;
  const nextMintStart = subscriptionTokenId
    ? getMintTimelineDetails(subscriptionTokenId).instantUtc
    : null;
  const nextMintDateTime = nextMintStart
    ? formatFullDateTime(nextMintStart, "local", locale)
    : "—";
  const nextMintLabel = hasMappedMemeCard
    ? nextMintDateTime
    : subscriptionTokenId
      ? t(locale, "home.nextMint.cardSchedule", {
          number: formatInteger(locale, subscriptionTokenId),
          date: nextMintDateTime,
        })
      : "—";

  return (
    <div className="tw-relative tw-overflow-hidden tw-rounded-2xl tw-border tw-border-solid tw-border-white/[0.03] tw-bg-iron-950">
      <div className="tw-grid tw-grid-cols-1 tw-items-center tw-gap-x-6 tw-gap-y-6 lg:tw-grid-cols-12 xl:tw-grid-cols-9">
        <div className="tw-p-0 lg:tw-col-span-6 xl:tw-col-span-5">
          <div className="tw-relative tw-flex tw-h-[clamp(360px,65vw,640px)] tw-w-full tw-items-center tw-justify-center tw-overflow-hidden tw-bg-black/50">
            <div className="tw-[&>div]:tw-mx-0 tw-flex tw-h-full tw-w-full tw-items-center tw-justify-center">
              {media ? (
                <DropListItemContentMedia
                  media_mime_type={media.mime_type}
                  media_url={media.url}
                  imageObjectPosition="center"
                  imageScale={ImageScale.AUTOx600}
                  disableAutoPlay={hasTouchScreen}
                  disableModal={hasTouchScreen}
                  htmlIframeContainerClassName="tw-w-full"
                  htmlPreviewImageUrl={htmlPreviewImageUrl}
                />
              ) : (
                <div className="tw-flex tw-size-full tw-items-center tw-justify-center tw-bg-black/40">
                  <span className="tw-text-sm tw-text-white/40">
                    {t(locale, "home.nextMint.noImage")}
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="tw-p-5 md:tw-p-6 lg:tw-col-span-6 xl:tw-col-span-4">
          <div className="tw-flex tw-flex-col tw-gap-5">
            <div className="tw-flex tw-flex-col">
              <div className="tw-flex tw-flex-wrap tw-items-center tw-gap-2">
                <div className="tw-flex tw-items-center tw-gap-2">
                  <span className="tw-size-1.5 tw-rounded-full tw-bg-emerald-500" />
                  <span className="tw-text-[11px] tw-font-semibold tw-uppercase tw-leading-5 tw-tracking-wide tw-text-emerald-400">
                    {t(locale, "home.nextMint.status")}
                  </span>
                </div>
                <MainStageMemeCardPill
                  memeCardId={mappedMemeCardId}
                  href={
                    linkMemeCard && hasMappedMemeCard
                      ? `/the-memes/${mappedMemeCardId}`
                      : undefined
                  }
                />
              </div>
              <span className="tw-mt-1 tw-font-mono tw-text-xs tw-text-white/50">
                {nextMintLabel}
              </span>

              <Link
                href={`/waves?wave=${drop.wave.id}&drop=${drop.id}`}
                className="tw-mt-3 tw-text-xl tw-font-semibold tw-leading-tight tw-text-iron-50 tw-no-underline tw-transition-colors tw-duration-300 desktop-hover:hover:tw-text-iron-200 sm:tw-text-2xl md:tw-text-3xl"
              >
                {title}
              </Link>

              {description && (
                <p className="tw-mt-3 tw-line-clamp-2 tw-text-sm tw-leading-relaxed tw-text-iron-300">
                  {description}
                </p>
              )}

              <div className="tw-mt-3 tw-flex tw-flex-wrap tw-items-center tw-gap-2">
                {media?.mime_type && (
                  <MediaTypeBadge
                    mimeType={media.mime_type}
                    dropId={drop.id}
                    size="sm"
                    iconClassName="tw-size-[26px]"
                  />
                )}
                <ArtistPill
                  pfp={author.pfp}
                  label={authorName}
                  href={authorHandle ? `/${authorHandle}` : undefined}
                  profileHandle={author.handle ?? undefined}
                />
              </div>

              {subscriptionTokenId && (
                <div className="tw-mt-4">
                  <LatestDropNextMintSubscribe tokenId={subscriptionTokenId} />
                </div>
              )}
            </div>

            <div className="tw-grid tw-grid-cols-2 tw-gap-x-6 tw-gap-y-4">
              <div className="tw-col-span-2">
                <NowMintingStatsItem
                  label={t(locale, "home.nextMint.stats.wave")}
                  allowWrap
                  value={
                    <Link
                      href={`/waves/${drop.wave.id}`}
                      className="tw-inline-flex tw-items-center tw-gap-2 tw-text-iron-100 tw-no-underline desktop-hover:hover:tw-text-iron-200"
                    >
                      {drop.wave.picture && (
                        <Image
                          src={getScaledImageUri(
                            drop.wave.picture,
                            ImageScale.W_AUTO_H_50
                          )}
                          alt={drop.wave.name}
                          width={20}
                          height={20}
                          className="tw-size-5 tw-shrink-0 tw-rounded-full tw-object-cover tw-ring-1 tw-ring-white/10"
                        />
                      )}
                      <span className="tw-min-w-0 tw-break-words">
                        {drop.wave.name}
                      </span>
                    </Link>
                  }
                />
              </div>
              <div className="tw-col-span-2">
                <NowMintingStatsItem
                  label={t(locale, "theMemes.detail.live.artwork.mintDate")}
                  value={nextMintDateTime}
                  allowWrap
                />
              </div>
              <NowMintingStatsItem
                label={t(locale, "home.nextMint.stats.submitted")}
                value={submittedAt ?? "—"}
              />
              <NowMintingStatsItem
                label={t(locale, "home.nextMint.stats.rating")}
                value={`${formatInteger(locale, drop.rating)} TDH`}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
