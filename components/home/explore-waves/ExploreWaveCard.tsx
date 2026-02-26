"use client";

import { ChatBubbleBottomCenterIcon } from "@heroicons/react/24/outline";
import Image from "next/image";
import Link from "next/link";

import ContentDisplay from "@/components/waves/drops/ContentDisplay";
import type { ProcessedContent } from "@/components/waves/drops/media-utils";
import type { ApiWave } from "@/generated/models/ApiWave";
import { getRandomColorWithSeed, getTimeAgoShort } from "@/helpers/Helpers";
import { getScaledImageUri, ImageScale } from "@/helpers/image.helpers";
import { getWaveRoute } from "@/helpers/navigation.helpers";


import { extractDropPreview, useWaveLatestDrop } from "./useWaveLatestDrop";

interface ExploreWaveCardProps {
  readonly wave: ApiWave;
}

export function ExploreWaveCard({ wave }: ExploreWaveCardProps) {
  const waveHref = getWaveRoute({
    waveId: wave.id,
    isDirectMessage: wave.chat.scope.group?.is_direct_message ?? false,
    isApp: false,
  });

  const author = wave.author;
  const banner1 =
    author.banner1_color ?? getRandomColorWithSeed(author.handle ?? "");
  const banner2 =
    author.banner2_color ?? getRandomColorWithSeed(author.handle ?? "");
  const imageAreaStyle = !wave.picture
    ? {
        background: `linear-gradient(135deg, ${banner1} 0%, ${banner2} 100%)`,
      }
    : undefined;

  const lastMessageTime = wave.metrics.latest_drop_timestamp;
  const hasDrops = wave.metrics.drops_count > 0;

  // Fetch latest drop for message preview
  const { data: latestDrop, isLoading: isLoadingDrop } = useWaveLatestDrop(
    wave.id,
    hasDrops
  );
  const latestMessagePreview = extractDropPreview(latestDrop ?? null);

  return (
    <Link
      href={waveHref}
      prefetch={false}
      className="tw-group tw-relative tw-block tw-overflow-hidden tw-rounded-xl tw-bg-iron-950 tw-text-left tw-no-underline tw-transition-all tw-duration-300 tw-ease-out focus-visible:tw-outline-none focus-visible:tw-ring-2 focus-visible:tw-ring-iron-500/30"
      aria-label={`View wave ${wave.name}`}
    >
      <div className="tw-pointer-events-none tw-absolute tw-inset-0 tw-z-10 tw-rounded-xl tw-border tw-border-solid tw-border-white/10" />
      <div
        className="tw-relative tw-aspect-[2/1] tw-overflow-hidden"
        style={imageAreaStyle}
      >
        {wave.picture && (
          <Image
            src={getScaledImageUri(wave.picture, ImageScale.AUTOx450)}
            alt={`${wave.name} cover`}
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

        {hasDrops && (
          <div className="tw-mb-3 tw-mt-2 tw-flex tw-flex-wrap tw-items-center tw-gap-x-1.5 tw-gap-y-1 tw-text-[11px] tw-text-iron-500 sm:tw-text-xs">
            <span className="tw-size-1.5 tw-rounded-full tw-bg-emerald-500" />
            <span className="tw-text-iron-300">
              {getTimeAgoShort(lastMessageTime)} ·{" "}
              {wave.metrics.drops_count.toLocaleString()}
            </span>{" "}
            drops
          </div>
        )}

        {!hasDrops && (
          <div className="tw-mb-3 tw-text-[11px] tw-text-iron-500 sm:tw-text-xs">
            No drops yet
          </div>
        )}

        {hasDrops && (
          <div className="tw-flex tw-items-center tw-gap-1.5 tw-rounded-lg tw-bg-iron-800/60 tw-p-1 tw-shadow-inner sm:tw-gap-3 sm:tw-p-2">
            <div className="tw-flex tw-h-5 tw-w-5 tw-shrink-0 tw-items-center tw-justify-center tw-rounded-full tw-bg-iron-700/40 sm:tw-h-7 sm:tw-w-7">
              <ChatBubbleBottomCenterIcon
                className="tw-size-3 tw-shrink-0 tw-text-iron-400 sm:tw-size-3.5"
                aria-hidden="true"
              />
            </div>
            <MessagePreviewContent
              isLoading={isLoadingDrop}
              previewContent={latestMessagePreview}
            />
          </div>
        )}
      </div>
    </Link>
  );
}

function MessagePreviewContent({
  isLoading,
  previewContent,
}: {
  readonly isLoading: boolean;
  readonly previewContent: ProcessedContent | null;
}) {
  if (isLoading) {
    return (
      <div className="tw-h-6 tw-min-w-0 tw-flex-1 tw-animate-pulse tw-rounded tw-bg-iron-800/60" />
    );
  }

  if (!previewContent) {
    return null;
  }

  return (
    <ContentDisplay
      content={previewContent}
      shouldClamp={false}
      className="tw-flex tw-min-w-0 tw-flex-1 tw-items-center tw-gap-1 tw-overflow-hidden tw-text-iron-400"
      textClassName="tw-line-clamp-1 tw-break-words tw-text-[10px] tw-font-medium tw-leading-tight sm:tw-text-xs"
      linkify={false}
    />
  );
}
