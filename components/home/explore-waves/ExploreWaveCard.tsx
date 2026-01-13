"use client";

import Image from "next/image";
import Link from "next/link";
import type { ApiWave } from "@/generated/models/ApiWave";
import { getScaledImageUri, ImageScale } from "@/helpers/image.helpers";
import { getTimeAgoShort, getRandomColorWithSeed } from "@/helpers/Helpers";
import { getWaveRoute } from "@/helpers/navigation.helpers";
import { useWaveLatestDrop, extractDropPreview } from "./useWaveLatestDrop";

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
      className="tw-group tw-block tw-overflow-hidden tw-rounded-xl tw-border tw-border-solid tw-border-iron-800 tw-bg-iron-950 tw-text-left tw-no-underline tw-transition-all tw-duration-300 tw-ease-out focus-visible:tw-outline-none focus-visible:tw-ring-2 focus-visible:tw-ring-iron-500/30 desktop-hover:hover:tw-border-iron-700"
      aria-label={`View wave ${wave.name}`}
    >
      {/* Image Area */}
      <div
        className="tw-relative tw-aspect-[3/2] tw-overflow-hidden"
        style={imageAreaStyle}
      >
        {wave.picture && (
          <Image
            src={getScaledImageUri(wave.picture, ImageScale.AUTOx450)}
            alt={`${wave.name} cover`}
            fill
            sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 33vw"
            className="tw-object-cover tw-transition-transform tw-duration-700 tw-will-change-transform desktop-hover:group-hover:tw-scale-105"
          />
        )}
      </div>

      {/* Content Area */}
      <div className="tw-p-5">
        <h3 className="tw-m-0 tw-mb-3 tw-line-clamp-1 tw-text-lg tw-font-bold tw-leading-tight tw-text-iron-50">
          {wave.name}
        </h3>

        {/* Metadata */}
        {hasDrops && (
          <div className="tw-mb-3 tw-text-[11px] tw-text-iron-400">
            Last drop {getTimeAgoShort(lastMessageTime)} ·{" "}
            {wave.metrics.drops_count.toLocaleString()} drops
          </div>
        )}

        {!hasDrops && (
          <div className="tw-mb-3 tw-text-[11px] tw-text-iron-500">
            No drops yet
          </div>
        )}

        {/* Message Preview */}
        {hasDrops && (
          <div className="tw-flex tw-items-center tw-gap-2">
            <span className="tw-text-sm tw-text-white/30 tw-shrink-0" aria-hidden="true">
              💬
            </span>
            <MessagePreviewContent
              isLoading={isLoadingDrop}
              preview={latestMessagePreview}
            />
          </div>
        )}
      </div>
    </Link>
  );
}

function MessagePreviewContent({
  isLoading,
  preview,
}: {
  readonly isLoading: boolean;
  readonly preview: string | null;
}) {
  if (isLoading) {
    return (
      <div className="tw-h-8 tw-flex-1 tw-animate-pulse tw-rounded tw-bg-iron-800/60" />
    );
  }

  if (!preview) {
    return null;
  }

  return (
    <p className="tw-m-0 tw-line-clamp-1 tw-text-xs tw-leading-relaxed tw-text-iron-300">
      {preview}
    </p>
  );
}
