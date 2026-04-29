"use client";

import { COMMUNITY_CURATIONS_LIMIT } from "@/components/community-curations/communityCurations.constants";
import CommunityCurationsMasonry from "@/components/community-curations/CommunityCurationsMasonry";
import { useLayout } from "@/components/brain/my-stream/layout/LayoutContext";
import { useCommunityCurationsDrops } from "@/hooks/useCommunityCurationsDrops";
import { useCallback, useState } from "react";

const COMMUNITY_CURATIONS_SKELETON_CARDS = [
  { id: "compact", mediaHeight: 210, lines: 2 },
  { id: "tall", mediaHeight: 320, lines: 4 },
  { id: "mid", mediaHeight: 250, lines: 3 },
  { id: "feature", mediaHeight: 390, lines: 2 },
  { id: "balanced", mediaHeight: 280, lines: 4 },
  { id: "short", mediaHeight: 220, lines: 3 },
  { id: "portrait", mediaHeight: 350, lines: 3 },
  { id: "wide", mediaHeight: 260, lines: 2 },
] as const;

const COMMUNITY_CURATIONS_SKELETON_LINE_IDS = [
  "headline",
  "summary",
  "detail",
  "caption",
] as const;

function CommunityCurationsSkeletonCard({
  lines,
  mediaHeight,
}: {
  readonly lines: number;
  readonly mediaHeight: number;
}) {
  return (
    <div className="tw-mb-4 tw-break-inside-avoid tw-overflow-hidden tw-rounded-lg tw-border tw-border-solid tw-border-white/10 tw-bg-iron-950/75">
      <div
        className="tw-animate-pulse tw-bg-iron-900"
        style={{ height: mediaHeight }}
      />
      <div className="tw-p-4">
        <div className="tw-flex tw-items-center tw-gap-3">
          <div className="tw-size-8 tw-animate-pulse tw-rounded-full tw-bg-iron-800" />
          <div className="tw-flex-1 tw-space-y-2">
            <div className="tw-h-3 tw-w-28 tw-animate-pulse tw-rounded tw-bg-iron-800" />
            <div className="tw-h-3 tw-w-40 tw-animate-pulse tw-rounded tw-bg-iron-900" />
          </div>
        </div>
        <div className="tw-mt-5 tw-h-5 tw-w-3/4 tw-animate-pulse tw-rounded tw-bg-iron-800" />
        <div className="tw-mt-3 tw-space-y-2">
          {COMMUNITY_CURATIONS_SKELETON_LINE_IDS.slice(0, lines).map(
            (lineId, index) => (
              <div
                key={`community-curations-skeleton-line-${lineId}`}
                className={`tw-h-3 tw-animate-pulse tw-rounded tw-bg-iron-900 ${
                  index === lines - 1 ? "tw-w-2/3" : "tw-w-full"
                }`}
              />
            )
          )}
        </div>
      </div>
    </div>
  );
}

function CommunityCurationsSkeletonGrid() {
  return (
    <div className="tw-[column-gap:1rem] tw-[column-width:300px]">
      {COMMUNITY_CURATIONS_SKELETON_CARDS.map((card) => (
        <CommunityCurationsSkeletonCard
          key={`community-curations-skeleton-${card.id}`}
          lines={card.lines}
          mediaHeight={card.mediaHeight}
        />
      ))}
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
  const {
    allDrops,
    drops,
    fetchNextPage,
    hasNextPage,
    isError,
    isFetchingNextPage,
    isLoading,
  } = useCommunityCurationsDrops({
    limit: COMMUNITY_CURATIONS_LIMIT,
  });

  const isInitialLoading = isLoading && allDrops.length === 0;
  const hasMorePages = Boolean(hasNextPage) || isFetchingNextPage;
  const shouldShowEmptyState =
    !isInitialLoading && !isError && drops.length === 0 && !hasMorePages;
  const shouldShowMasonry =
    !isInitialLoading && !isError && (drops.length > 0 || hasMorePages);
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
        <div className="tw-flex tw-flex-col tw-gap-4">
          <div className="tw-max-w-2xl">
            <h1 className="tw-mb-0 tw-text-2xl tw-font-bold tw-text-white">
              Community Curations
            </h1>
            <p className="tw-mb-0 tw-mt-1 tw-text-sm tw-text-iron-400">
              Community-curated drops from across 6529 Waves.
            </p>
          </div>
        </div>

        <div className="tw-mt-6">
          {isInitialLoading && <CommunityCurationsSkeletonGrid />}

          {!isInitialLoading && isError && (
            <CommunityCurationsEmptyState
              title="Could not load curations"
              description="Try refreshing this view in a moment."
            />
          )}

          {shouldShowEmptyState && (
            <CommunityCurationsEmptyState
              title="No curated drops yet"
              description="Community-curated drops will appear here when visible curations have activity."
            />
          )}

          {shouldShowMasonry && (
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
