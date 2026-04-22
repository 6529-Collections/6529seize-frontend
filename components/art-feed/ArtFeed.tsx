"use client";

import { ART_FEED_LIMIT } from "@/components/art-feed/artFeed.constants";
import UserPageProfileWaveMasonry, {
  useProfileMasonryContainerWidth,
} from "@/components/user/waves/UserPageProfileWaveMasonry";
import {
  useArtFeedDrops,
  type ArtFeedAudience,
  type ArtFeedMediaFilter,
} from "@/hooks/useArtFeedDrops";
import { useCallback, useState } from "react";

const MEDIA_FILTER_OPTIONS: Array<{
  key: ArtFeedMediaFilter;
  label: string;
}> = [
  { key: "all", label: "All" },
  { key: "image", label: "Images" },
  { key: "video", label: "Video" },
  { key: "audio", label: "Audio" },
];

const AUDIENCE_OPTIONS: Array<{ key: ArtFeedAudience; label: string }> = [
  { key: "following", label: "Following" },
  { key: "everyone", label: "Everyone" },
];

const getTabButtonClassName = (isActive: boolean): string =>
  `tw-rounded-md tw-border-0 tw-px-3 tw-py-2 tw-text-sm tw-font-semibold tw-transition-colors ${
    isActive
      ? "tw-bg-iron-800 tw-text-white"
      : "tw-bg-transparent tw-text-iron-400 desktop-hover:hover:tw-text-iron-100"
  }`;

function ArtFeedSkeletonCard() {
  return (
    <div className="tw-grid tw-overflow-hidden tw-rounded-lg tw-border tw-border-solid tw-border-white/10 tw-bg-iron-950/75 md:tw-grid-cols-[minmax(0,0.92fr)_minmax(0,1fr)]">
      <div className="tw-aspect-[16/11] tw-animate-pulse tw-bg-iron-900 md:tw-aspect-auto" />
      <div className="tw-p-5">
        <div className="tw-flex tw-items-center tw-gap-3">
          <div className="tw-size-8 tw-animate-pulse tw-rounded-full tw-bg-iron-800" />
          <div className="tw-flex-1 tw-space-y-2">
            <div className="tw-h-3 tw-w-28 tw-animate-pulse tw-rounded tw-bg-iron-800" />
            <div className="tw-h-3 tw-w-40 tw-animate-pulse tw-rounded tw-bg-iron-900" />
          </div>
        </div>
        <div className="tw-mt-5 tw-h-5 tw-w-3/4 tw-animate-pulse tw-rounded tw-bg-iron-800" />
        <div className="tw-mt-3 tw-space-y-2">
          <div className="tw-h-3 tw-animate-pulse tw-rounded tw-bg-iron-900" />
          <div className="tw-h-3 tw-w-5/6 tw-animate-pulse tw-rounded tw-bg-iron-900" />
        </div>
      </div>
    </div>
  );
}

function ArtFeedEmptyState({
  title,
  description,
}: {
  readonly title: string;
  readonly description: string;
}) {
  return (
    <div className="tw-rounded-lg tw-border tw-border-dashed tw-border-iron-700 tw-bg-iron-950/70 tw-px-6 tw-py-10 tw-text-center">
      <p className="tw-mb-2 tw-text-base tw-font-semibold tw-text-iron-100">
        {title}
      </p>
      <p className="tw-mb-0 tw-text-sm tw-text-iron-400">{description}</p>
    </div>
  );
}

export default function ArtFeed() {
  const { containerRef, containerWidth } = useProfileMasonryContainerWidth();
  const [mediaFilter, setMediaFilter] = useState<ArtFeedMediaFilter>("all");
  const [audience, setAudience] = useState<ArtFeedAudience>("everyone");
  const {
    allDrops,
    drops,
    fetchNextPage,
    hasNextPage,
    isError,
    isFetchingNextPage,
    isLoading,
  } = useArtFeedDrops({
    audience,
    mediaFilter,
    limit: ART_FEED_LIMIT,
  });

  const isInitialLoading = isLoading && allDrops.length === 0;
  const emptyTitle =
    audience === "following" ? "No followed ART yet" : "No ART drops yet";
  const emptyDescription =
    audience === "following"
      ? "Follow curators to build a more personal ART view."
      : "User-curated ART drops will appear here when visible curations have activity.";
  const handleFetchNextPage = useCallback(async () => {
    await fetchNextPage();
  }, [fetchNextPage]);

  return (
    <section className="tw-px-4 tw-py-8 md:tw-px-6 md:tw-py-12 lg:tw-px-8">
      <div className="tw-mx-auto tw-max-w-5xl">
        <div className="tw-flex tw-flex-col tw-gap-5 md:tw-flex-row md:tw-items-end md:tw-justify-between">
          <div className="tw-max-w-2xl">
            <p className="tw-mb-2 tw-text-xs tw-font-semibold tw-uppercase tw-tracking-widest tw-text-primary-300">
              ART
            </p>
            <h1 className="tw-mb-3 tw-text-3xl tw-font-semibold tw-tracking-tight tw-text-white md:tw-text-5xl">
              ART Feed
            </h1>
            <p className="tw-mb-0 tw-text-base tw-leading-7 tw-text-iron-400">
              User-curated ART drops from across 6529 Waves.
            </p>
          </div>

          <div className="tw-flex tw-flex-wrap tw-items-center tw-gap-3">
            <div
              className="tw-flex tw-flex-wrap tw-rounded-lg tw-border tw-border-solid tw-border-iron-800 tw-bg-iron-950 tw-p-1"
              aria-label="ART media filter"
            >
              {MEDIA_FILTER_OPTIONS.map((option) => (
                <button
                  key={option.key}
                  type="button"
                  onClick={() => setMediaFilter(option.key)}
                  className={getTabButtonClassName(mediaFilter === option.key)}
                >
                  {option.label}
                </button>
              ))}
            </div>
            <div
              className="tw-flex tw-rounded-lg tw-border tw-border-solid tw-border-iron-800 tw-bg-iron-950 tw-p-1"
              aria-label="ART feed audience"
            >
              {AUDIENCE_OPTIONS.map((option) => (
                <button
                  key={option.key}
                  type="button"
                  onClick={() => setAudience(option.key)}
                  className={getTabButtonClassName(audience === option.key)}
                >
                  {option.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div ref={containerRef} className="tw-mt-8 md:tw-mt-10">
          {isInitialLoading && (
            <div className="tw-flex tw-flex-col tw-gap-4">
              {Array.from({ length: 4 }).map((_, index) => (
                <ArtFeedSkeletonCard key={`art-feed-skeleton-${index}`} />
              ))}
            </div>
          )}

          {!isInitialLoading && isError && (
            <ArtFeedEmptyState
              title="Could not load ART"
              description="Try refreshing this view in a moment."
            />
          )}

          {!isInitialLoading && !isError && drops.length === 0 && (
            <ArtFeedEmptyState
              title={emptyTitle}
              description={emptyDescription}
            />
          )}

          {!isInitialLoading && !isError && drops.length > 0 && (
            <div className="tw-overflow-hidden tw-rounded-2xl">
              <UserPageProfileWaveMasonry
                curationId="art-feed"
                curationName="ART"
                containerWidth={containerWidth}
                drops={drops}
                fetchNextPage={handleFetchNextPage}
                hasNextPage={hasNextPage}
                isFetchingNextPage={isFetchingNextPage}
                showIdentity={true}
              />
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
