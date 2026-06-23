"use client";

import type { QueryStatus } from "@tanstack/react-query";
import type React from "react";
import { useCallback } from "react";
import CircleLoader, {
  CircleLoaderSize,
} from "@/components/distribution-plan-tool/common/CircleLoader";
import CommonIntersectionElement from "@/components/utils/CommonIntersectionElement";
import type { ApiWave } from "@/generated/models/ApiWave";
import { useWaves } from "@/hooks/useWaves";
import { WaveCreatorPreviewItem } from "./WaveCreatorPreviewItem";

const WAVE_CREATOR_PREVIEW_PAGE_SIZE = 20;

interface UseWaveCreatorPreviewWavesParams {
  readonly identity: string;
  readonly enabled: boolean;
}

interface WaveCreatorPreviewWavesState {
  readonly waves: ApiWave[];
  readonly isFetching: boolean;
  readonly isFetchingNextPage: boolean;
  readonly status: QueryStatus;
  readonly error: unknown;
  readonly isInitialLoading: boolean;
  readonly showEmptyState: boolean;
  readonly waveCountLabel: string;
  readonly onBottomIntersection: (state: boolean) => void;
}

interface WaveCreatorPreviewListProps {
  readonly state: WaveCreatorPreviewWavesState;
  readonly onWaveSelect?:
    | ((wave: ApiWave, href: string, event: React.MouseEvent) => void)
    | undefined;
  readonly variant?: "modal" | "compact" | undefined;
}

export function useWaveCreatorPreviewWaves({
  identity,
  enabled,
}: UseWaveCreatorPreviewWavesParams): WaveCreatorPreviewWavesState {
  const {
    waves,
    isFetching,
    isFetchingNextPage,
    hasNextPage,
    lastPageSize,
    fetchNextPage,
    status,
    error,
  } = useWaves({
    identity,
    waveName: null,
    limit: WAVE_CREATOR_PREVIEW_PAGE_SIZE,
    enabled,
    directMessage: false,
  });

  const onBottomIntersection = useCallback(
    (state: boolean) => {
      if (
        !state ||
        status === "pending" ||
        isFetching ||
        isFetchingNextPage ||
        !hasNextPage ||
        lastPageSize < WAVE_CREATOR_PREVIEW_PAGE_SIZE
      ) {
        return;
      }

      fetchNextPage().catch(() => {
        // React Query surfaces pagination errors through hook state.
      });
    },
    [
      fetchNextPage,
      hasNextPage,
      isFetching,
      isFetchingNextPage,
      lastPageSize,
      status,
    ]
  );

  const isInitialLoading = status === "pending" && waves.length === 0;
  const showEmptyState =
    !isInitialLoading && !isFetching && waves.length === 0 && !error;
  const wavePlural = waves.length === 1 ? "" : "s";
  const waveCountLabel = isInitialLoading
    ? "Loading waves..."
    : `Showing ${waves.length} wave${wavePlural}`;

  return {
    waves,
    isFetching,
    isFetchingNextPage,
    status,
    error,
    isInitialLoading,
    showEmptyState,
    waveCountLabel,
    onBottomIntersection,
  };
}

export const WaveCreatorPreviewList: React.FC<WaveCreatorPreviewListProps> = ({
  state,
  onWaveSelect,
  variant = "modal",
}) => {
  const isCompact = variant === "compact";
  const hasError = state.error !== null && state.error !== undefined;
  const showPaginationLoader =
    !isCompact &&
    (state.isFetchingNextPage || (state.isFetching && state.waves.length > 0));

  if (state.isInitialLoading) {
    return (
      <div
        className={`tw-flex ${
          isCompact ? "tw-h-14" : "tw-h-64"
        } tw-items-center tw-justify-center`}
      >
        <div
          className={`tw-flex tw-items-center ${
            isCompact ? "tw-gap-2" : "tw-flex-col tw-gap-3"
          }`}
        >
          <CircleLoader
            size={isCompact ? CircleLoaderSize.SMALL : CircleLoaderSize.LARGE}
          />
          <span
            className={
              isCompact
                ? "tw-text-xs tw-text-iron-400"
                : "tw-text-sm tw-text-iron-400"
            }
          >
            Loading waves...
          </span>
        </div>
      </div>
    );
  }

  return (
    <>
      {hasError && (
        <div
          className={`tw-rounded-lg tw-border tw-border-rose-500/30 tw-bg-rose-500/10 tw-text-rose-300 ${
            isCompact
              ? "tw-px-3 tw-py-2 tw-text-xs"
              : "tw-px-4 tw-py-3 tw-text-sm"
          }`}
        >
          Unable to load waves right now. Please try again.
        </div>
      )}
      {state.showEmptyState && (
        <div
          className={`tw-rounded-lg tw-border tw-border-iron-800/60 tw-bg-iron-900/40 tw-text-iron-400 ${
            isCompact
              ? "tw-px-3 tw-py-2 tw-text-xs"
              : "tw-px-4 tw-py-3 tw-text-sm"
          }`}
        >
          No waves created yet.
        </div>
      )}
      {state.waves.length > 0 && (
        <div
          className={`tw-flex tw-flex-col ${isCompact ? "tw-gap-2" : "tw-gap-3"}`}
        >
          {state.waves.map((wave) => (
            <WaveCreatorPreviewItem
              key={wave.id}
              wave={wave}
              onSelect={onWaveSelect}
            />
          ))}
        </div>
      )}
      {showPaginationLoader && (
        <div className="tw-mt-4 tw-flex tw-justify-center">
          <CircleLoader size={CircleLoaderSize.MEDIUM} />
        </div>
      )}
      <CommonIntersectionElement onIntersection={state.onBottomIntersection} />
    </>
  );
};
