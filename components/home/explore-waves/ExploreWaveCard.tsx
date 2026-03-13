"use client";

import type { ApiWave } from "@/generated/models/ApiWave";
import { getRandomColorWithSeed, getTimeAgoShort } from "@/helpers/Helpers";
import ContentDisplay from "@/components/waves/drops/ContentDisplay";
import {
  buildProcessedContent,
  type ProcessedContent,
} from "@/components/waves/drops/media-utils";
import { getScaledImageUri, ImageScale } from "@/helpers/image.helpers";
import { getWaveRoute } from "@/helpers/navigation.helpers";
import Image from "next/image";
import Link from "next/link";

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

  const lastMessageTime = wave.last_drop_time;
  const hasDrops = wave.metrics.drops_count > 0;
  const descriptionPreview = getWavePreviewContent(wave);

  return (
    <Link
      href={waveHref}
      prefetch={false}
      className="tw-group tw-relative tw-block tw-overflow-hidden tw-rounded-xl tw-bg-iron-950 tw-text-left tw-no-underline tw-transition-all tw-duration-300 tw-ease-out focus-visible:tw-outline-none focus-visible:tw-ring-2 focus-visible:tw-ring-iron-500/30"
      aria-label={`View wave ${wave.name}`}
    >
      <div className="tw-pointer-events-none tw-absolute tw-inset-0 tw-z-10 tw-rounded-xl tw-border tw-border-solid tw-border-white/10" />
      <div
        className="tw-relative tw-aspect-[20/9] tw-overflow-hidden"
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
              {wave.metrics.drops_count.toLocaleString()}
            </span>{" "}
            drops
          </div>
        )}

        {!hasDrops && (
          <div className="tw-mt-3 tw-text-[11px] tw-text-iron-500 sm:tw-text-xs">
            No drops yet
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
      className="tw-mt-1 tw-flex tw-min-w-0 tw-flex-1 tw-items-start tw-gap-1 tw-overflow-hidden tw-text-iron-500"
      textClassName="tw-line-clamp-2 tw-break-words tw-text-[10px] tw-font-normal tw-leading-tight sm:tw-text-xs"
      linkify={false}
    />
  );
}

function getWavePreviewContent(wave: ApiWave): ProcessedContent | null {
  const descriptionParts = wave.description_drop.parts;
  const combinedText = descriptionParts
    .map((part) => part.content?.trim())
    .filter((content): content is string => Boolean(content))
    .join("\n\n");
  const media = descriptionParts.flatMap((part) => part.media);

  if (!combinedText && media.length === 0) {
    return null;
  }

  return buildProcessedContent(combinedText || null, media);
}
