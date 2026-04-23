"use client";

import { COMMUNITY_CURATIONS_LIMIT } from "@/components/community-curations/communityCurations.constants";
import CommunityCurationsMasonry from "@/components/community-curations/CommunityCurationsMasonry";
import { useLayout } from "@/components/brain/my-stream/layout/LayoutContext";
import type { CommonSelectItem } from "@/components/utils/select/CommonSelect";
import CommonTabs from "@/components/utils/select/tabs/CommonTabs";
import {
  useCommunityCurationsDrops,
  type CommunityCurationsMediaFilter,
} from "@/hooks/useCommunityCurationsDrops";
import { useCallback, useState } from "react";

const MEDIA_FILTER_OPTIONS: CommonSelectItem<CommunityCurationsMediaFilter>[] =
  [
    { key: "all", label: "All", value: "all" },
    { key: "image", label: "Images", value: "image" },
    { key: "video", label: "Video", value: "video" },
    { key: "audio", label: "Audio", value: "audio" },
  ];

function CommunityCurationsSkeletonCard() {
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

function CommunityCurationsEmptyState({
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

export default function CommunityCurations() {
  const { waveViewStyle } = useLayout();
  const [scrollContainer, setScrollContainer] = useState<HTMLElement | null>(
    null
  );
  const [mediaFilter, setMediaFilter] =
    useState<CommunityCurationsMediaFilter>("all");
  const {
    allDrops,
    drops,
    fetchNextPage,
    hasNextPage,
    isError,
    isFetchingNextPage,
    isLoading,
  } = useCommunityCurationsDrops({
    mediaFilter,
    limit: COMMUNITY_CURATIONS_LIMIT,
  });

  const isInitialLoading = isLoading && allDrops.length === 0;
  const handleFetchNextPage = useCallback(async () => {
    await fetchNextPage();
  }, [fetchNextPage]);

  return (
    <section
      ref={setScrollContainer}
      className="tw-flex tw-min-h-0 tw-w-full tw-flex-grow tw-flex-col tw-overflow-y-auto tw-overflow-x-hidden tw-overscroll-contain tw-px-4 tw-py-8 tw-scrollbar-thin tw-scrollbar-track-iron-900 tw-scrollbar-thumb-iron-600 desktop-hover:hover:tw-scrollbar-thumb-iron-500 sm:tw-px-6 lg:tw-px-8"
      style={waveViewStyle}
    >
      <div className="tw-mx-auto tw-w-full tw-max-w-6xl">
        <div className="tw-flex tw-flex-col tw-gap-4 md:tw-flex-row md:tw-items-end md:tw-justify-between">
          <div className="tw-max-w-2xl">
            <h1 className="tw-mb-0 tw-text-2xl tw-font-bold tw-text-white">
              Community Curations
            </h1>
            <p className="tw-mb-0 tw-mt-1 tw-text-sm tw-text-iron-400">
              Community-curated drops from across 6529 Waves.
            </p>
          </div>

          <div className="tw-flex tw-flex-wrap tw-items-center tw-gap-2">
            <div className="tw-flex-shrink-0">
              <CommonTabs
                items={MEDIA_FILTER_OPTIONS}
                activeItem={mediaFilter}
                filterLabel="Community curation media filter"
                setSelected={setMediaFilter}
                size="sm"
                fill={false}
              />
            </div>
          </div>
        </div>

        <div className="tw-mt-6">
          {isInitialLoading && (
            <div className="tw-flex tw-flex-col tw-gap-4">
              {Array.from({ length: 4 }).map((_, index) => (
                <CommunityCurationsSkeletonCard
                  key={`community-curations-skeleton-${index}`}
                />
              ))}
            </div>
          )}

          {!isInitialLoading && isError && (
            <CommunityCurationsEmptyState
              title="Could not load curations"
              description="Try refreshing this view in a moment."
            />
          )}

          {!isInitialLoading && !isError && drops.length === 0 && (
            <CommunityCurationsEmptyState
              title="No curated drops yet"
              description="Community-curated drops will appear here when visible curations have activity."
            />
          )}

          {!isInitialLoading && !isError && drops.length > 0 && (
            <CommunityCurationsMasonry
              drops={drops}
              fetchNextPage={handleFetchNextPage}
              hasNextPage={hasNextPage}
              isFetchingNextPage={isFetchingNextPage}
              scrollContainer={scrollContainer}
            />
          )}
        </div>
      </div>
    </section>
  );
}
