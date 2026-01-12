"use client";

import Image from "next/image";
import Link from "next/link";
import { ChatBubbleLeftIcon } from "@heroicons/react/24/solid";
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
      className="tw-group tw-block tw-overflow-hidden tw-rounded-xl tw-bg-iron-950 tw-no-underline tw-ring-1 tw-ring-inset tw-ring-white/10 tw-transition-all tw-duration-300 tw-ease-out focus-visible:tw-outline-none focus-visible:tw-ring-2 focus-visible:tw-ring-primary-500 desktop-hover:hover:tw-translate-y-[-2px] desktop-hover:hover:tw-ring-white/20"
      aria-label={`View wave ${wave.name}`}
    >
      {/* Image Area */}
      <div className="tw-relative tw-aspect-[16/10] tw-overflow-hidden">
        <div
          className="tw-absolute tw-inset-0"
          style={{
            background: `linear-gradient(45deg, ${banner1} 0%, ${banner2} 100%)`,
            opacity: wave.picture ? 0.35 : 1,
          }}
        />
        {wave.picture && (
          <Image
            src={getScaledImageUri(wave.picture, ImageScale.AUTOx450)}
            alt={`${wave.name} cover`}
            fill
            sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 33vw"
            className="tw-object-cover tw-transition-transform tw-duration-500 tw-will-change-transform desktop-hover:group-hover:tw-scale-[1.02]"
          />
        )}
      </div>

      {/* Content Area */}
      <div className="tw-p-4">
        {/* Wave Name */}
        <h3 className="tw-m-0 tw-line-clamp-1 tw-text-lg tw-font-bold tw-text-white">
          {wave.name}
        </h3>

        {/* Metadata */}
        {hasDrops && (
          <p className="tw-m-0 tw-mt-1 tw-text-sm tw-text-iron-400">
            Last message {getTimeAgoShort(lastMessageTime)}
          </p>
        )}

        {/* Message Preview */}
        {hasDrops && (
          <div className="tw-mt-3 tw-flex tw-items-start tw-gap-2">
            <ChatBubbleLeftIcon
              aria-hidden="true"
              className="tw-mt-0.5 tw-size-4 tw-flex-shrink-0 tw-text-iron-500"
            />
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
      <div className="tw-h-4 tw-flex-1 tw-animate-pulse tw-rounded tw-bg-iron-800/60" />
    );
  }

  if (!preview) {
    return null;
  }

  return (
    <p className="tw-m-0 tw-line-clamp-1 tw-text-sm tw-text-iron-300">
      {preview}
    </p>
  );
}
