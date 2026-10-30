"use client";
import { isCompetitionSubmissionHistory } from "@/helpers/competition-lifecycle.helpers";
import { useBrowserLocale } from "@/hooks/useBrowserLocale";
import { t } from "@/i18n/messages";
import { ApiCompetitionLifecycle } from "@/generated/models/ApiCompetitionLifecycle";

import type { ApiCompetitionEntryContext } from "@/generated/models/ApiCompetitionEntryContext";
import type { ApiCompetitionLeaderboardEntry } from "@/generated/models/ApiCompetitionLeaderboardEntry";
import { ApiCompetitionType } from "@/generated/models/ApiCompetitionType";

import { useEffect, useMemo, useRef, useState, type RefObject } from "react";
import { isCompetitionAccessError } from "@/helpers/competition.helpers";
import { useCompetition } from "@/contexts/CompetitionContext";
import { useCompetitionResource } from "@/hooks/competitions/useCompetitionQueries";
import { useCompetitionEntryDrops } from "@/hooks/competitions/useCompetitionEntryDrops";
import { useCompetitionDropNavigation } from "@/hooks/competitions/useCompetitionDropNavigation";
import { competitionPresentationWave } from "@/helpers/competition-presentation.helpers";
import { WaveLeaderboardHeader } from "@/components/waves/leaderboard/header/WaveleaderboardHeader";
import { WaveLeaderboardTime } from "@/components/waves/leaderboard/WaveLeaderboardTime";
import { useWaveLeaderboardRendererSet } from "@/components/waves/leaderboard/leaderboardRendererRegistry";
import { WaveLeaderboardGalleryItem } from "@/components/waves/leaderboard/gallery/WaveLeaderboardGalleryItem";
import { ApiCompetitionCapability } from "@/generated/models/ApiCompetitionCapability";
import { WaveLeaderboardGridItem } from "@/components/waves/leaderboard/grid/WaveLeaderboardGridItem";
import WaveApprovalStatusBar from "@/components/waves/approval/WaveApprovalStatusBar";
import {
  isLeaderboardViewMode,
  type LeaderboardViewMode,
} from "@/components/waves/leaderboard/types";
import useLocalPreference from "@/hooks/useLocalPreference";
import { getWaveLeaderboardSortItems } from "@/components/waves/leaderboard/header/WaveleaderboardSort";
import { WaveDropsLeaderboardSort } from "@/hooks/useWaveDropsLeaderboard";
import { CompetitionState } from "./CompetitionState";
import { WaveLeaderboardVirtualizedRows } from "@/components/waves/leaderboard/WaveLeaderboardVirtualizedRows";
import { Time } from "@/helpers/time";
import CompetitionMySubmissions from "./CompetitionMySubmissions";
import WaveLeaderboardError from "@/components/waves/leaderboard/WaveLeaderboardError";

const sorts: Partial<Record<WaveDropsLeaderboardSort, string>> = {
  RANK: "rating",
  REALTIME_VOTE: "real_time_rating",
  RATING_PREDICTION: "real_time_rating",
  TREND: "trend",
  CREATED_AT: "submitted_at",
  PRICE: "price",
};

function CompetitionLeaderboardEntry({
  entry,
  viewMode,
  sort,
  isVotingClosed,
  contextCard,
  updatedAt,
}: {
  readonly entry: ApiCompetitionLeaderboardEntry;
  readonly contextCard: ApiCompetitionEntryContext | undefined;
  readonly updatedAt: number;
  readonly viewMode: LeaderboardViewMode;
  readonly sort: WaveDropsLeaderboardSort;
  readonly isVotingClosed: boolean;
}) {
  const { wave, competition } = useCompetition();
  const references = useMemo(
    () => [{ entryId: entry.entry_id, dropId: entry.drop_id }],
    [entry.entry_id, entry.drop_id]
  );
  const cards = useMemo(
    () => ({ contexts: contextCard ? [contextCard] : [], updatedAt }),
    [contextCard, updatedAt]
  );
  const [dropQuery] = useCompetitionEntryDrops(references, cards);
  const { LeaderboardDrop } = useWaveLeaderboardRendererSet(
    wave.id,
    competition.capabilities
  );
  const onDropClick = useCompetitionDropNavigation();
  const presentation = useMemo(
    () => competitionPresentationWave(wave, competition),
    [wave, competition]
  );
  if (!dropQuery || dropQuery.isPending)
    return (
      <div
        aria-busy="true"
        className={
          viewMode === "list" ? "tw-min-h-[560px]" : "tw-min-h-[520px]"
        }
      >
        <div
          aria-hidden="true"
          className="tw-h-[480px] tw-animate-pulse tw-rounded-xl tw-bg-iron-900 motion-reduce:tw-animate-none"
        />
      </div>
    );
  if (
    dropQuery.isError &&
    (!dropQuery.data || isCompetitionAccessError(dropQuery.error))
  )
    return <CompetitionState error retry={() => void dropQuery.refetch()} />;
  if (!dropQuery.data) return null;
  const props = {
    drop: dropQuery.data.drop,
    onDropClick,
    onDropContentClick: onDropClick,
    winningThreshold:
      competition.type === ApiCompetitionType.Approve
        ? competition.winners.winning_min_threshold
        : null,
    winningThresholdMinDurationMs:
      competition.winners.winning_threshold_min_duration_ms,
    isVotingClosed,
    isVotingControlsLocked: !competition.permissions.vote,
  };
  let card;
  if (viewMode === "list")
    card = <LeaderboardDrop {...props} wave={presentation} />;
  else if (
    competition.capabilities.includes(ApiCompetitionCapability.MainStage)
  )
    card = (
      <WaveLeaderboardGalleryItem
        {...props}
        artFocused={viewMode === "grid_content_only"}
        activeSort={sort}
      />
    );
  else
    card = (
      <WaveLeaderboardGridItem
        {...props}
        mode={viewMode === "grid" ? "compact" : "content_only"}
      />
    );
  return <div data-competition-entry={entry.entry_id}>{card}</div>;
}

export default function CompetitionLeaderboard({
  onCreateDrop,
  scrollContainerRef: providedScrollContainer,
}: {
  readonly onCreateDrop?: (() => void) | undefined;
  readonly scrollContainerRef?: RefObject<HTMLDivElement | null> | undefined;
}) {
  const { competition, wave } = useCompetition();
  const locale = useBrowserLocale();
  const localScrollContainer = useRef<HTMLDivElement>(null);
  const scrollContainerRef = providedScrollContainer ?? localScrollContainer;
  const identity = { waveId: wave.id, competitionId: competition.id };
  const [priceRange, setPriceRange] = useState<{
    minPrice: number | undefined;
    maxPrice: number | undefined;
  }>({ minPrice: undefined, maxPrice: undefined });
  const isCuration = competition.capabilities.includes(
    ApiCompetitionCapability.Curation
  );
  const isMainStage = competition.capabilities.includes(
    ApiCompetitionCapability.MainStage
  );
  const filterScope = `${wave.id}:${competition.id}`;
  const [additionalActionScope, setAdditionalActionScope] = useState<
    string | null
  >(null);
  const additionalActionOnly =
    isMainStage && additionalActionScope === filterScope;
  const [viewMode, setViewMode] = useLocalPreference<LeaderboardViewMode>(
    `competitionViewMode_${wave.id}_${competition.id}`,
    isMainStage ? "grid" : "list",
    isLeaderboardViewMode
  );
  const [sort, setSort] = useLocalPreference<WaveDropsLeaderboardSort>(
    `competitionSortMode_${wave.id}_${competition.id}`,
    WaveDropsLeaderboardSort.RANK,
    (value) =>
      getWaveLeaderboardSortItems({
        isApproveWave: competition.type === ApiCompetitionType.Approve,
        isCurationWave: isCuration,
        timeLockMs: competition.decisions.time_lock_ms,
      }).some((item) => item.value === value)
  );
  const query = useCompetitionResource(identity, "leaderboard", {
    include: "cards",
    ...(additionalActionOnly ? { is_additional_action_promised: "true" } : {}),
    sort: sorts[sort] ?? "rating",
    ...(sort === WaveDropsLeaderboardSort.PRICE ? { direction: "ASC" } : {}),
    ...(isCuration && priceRange.minPrice !== undefined
      ? { min_price: String(priceRange.minPrice) }
      : {}),
    ...(isCuration && priceRange.maxPrice !== undefined
      ? { max_price: String(priceRange.maxPrice) }
      : {}),
    ...(isCuration &&
    (sort === WaveDropsLeaderboardSort.PRICE ||
      priceRange.minPrice !== undefined ||
      priceRange.maxPrice !== undefined)
      ? { price_currency: "ETH" }
      : {}),
  });
  const entries = query.data?.pages.flatMap((page) => page.data) ?? [];
  const presentation = useMemo(
    () => competitionPresentationWave(wave, competition),
    [wave, competition]
  );
  const isApprove = competition.type === ApiCompetitionType.Approve;
  const winners = useCompetitionResource(
    identity,
    "winners",
    { limit: "100" },
    isApprove
  );
  const { hasNextPage, isFetchingNextPage, fetchNextPage, isError } = winners;
  useEffect(() => {
    if (isApprove && hasNextPage && !isFetchingNextPage && !isError)
      void fetchNextPage();
  }, [isApprove, hasNextPage, isFetchingNextPage, fetchNextPage, isError]);
  const approvedCount =
    winners.data?.pages.reduce((count, page) => count + page.data.length, 0) ??
    null;
  const end = competition.voting.ends_at;
  const maxReached =
    competition.winners.max_winners !== null &&
    approvedCount !== null &&
    approvedCount >= competition.winners.max_winners;
  const ended =
    (end !== null && end <= Time.currentMillis()) ||
    competition.lifecycle !== ApiCompetitionLifecycle.Published;
  let closeStatus: "max_reached" | "ended" | null = null;
  if (ended) closeStatus = "ended";
  if (maxReached) closeStatus = "max_reached";
  let layout: "list" | "gallery" | "grid" = "list";
  if (viewMode !== "list") layout = isMainStage ? "gallery" : "grid";
  let emptyState = <CompetitionState empty />;
  if (additionalActionOnly) {
    emptyState = (
      <output className="tw-block tw-p-6 tw-text-sm tw-font-light tw-text-iron-500">
        {t(locale, "memes.additionalAction.empty")}
      </output>
    );
  } else if (isCompetitionSubmissionHistory(competition)) {
    emptyState = (
      <output className="tw-block tw-p-6 tw-text-sm tw-font-light tw-text-iron-500">
        {t(locale, "competitions.noSubmissions")}
      </output>
    );
  }
  let content;
  if (query.isPending) content = <CompetitionState />;
  else if (query.isError && !entries.length) {
    content = (
      <WaveLeaderboardError
        onRetry={() => {
          void query.refetch();
        }}
      />
    );
  } else {
    content = (
      <>
        {query.isError && (
          <WaveLeaderboardError
            hasEntries
            retrying={query.isFetching}
            onRetry={() => {
              void query.refetch();
            }}
          />
        )}
        {!entries.length && emptyState}
        <WaveLeaderboardVirtualizedRows
          items={entries}
          getItemId={(entry) => entry.drop_id}
          leadingItemCount={0}
          windowKey={`${competition.id}:${sort}:${additionalActionOnly}:${JSON.stringify(priceRange)}`}
          layout={layout}
          scrollContainerRef={scrollContainerRef}
          fetchNextPage={query.fetchNextPage}
          fetchPreviousPage={() => Promise.resolve(undefined)}
          hasNextPage={query.hasNextPage}
          hasPreviousPage={false}
          isFetchingNextPage={query.isFetchingNextPage}
          isFetchingPreviousPage={false}
          isFetchNextPageError={query.isFetchNextPageError}
          isFetchPreviousPageError={false}
          autoLoadNext={viewMode === "list"}
          overscan={layout === "gallery" ? 1 : 2}
          retainAnchorOnContentResize
          measureLoadedRowsAtNaturalHeight
          renderItem={(entry) => (
            <CompetitionLeaderboardEntry
              entry={entry}
              contextCard={query.data?.pages
                .flatMap((page) => page.cards ?? [])
                .find((item) => item.entry.id === entry.entry_id)}
              updatedAt={query.dataUpdatedAt}
              viewMode={viewMode}
              sort={sort}
              isVotingClosed={ended || maxReached}
            />
          )}
        />
      </>
    );
  }
  return (
    <div
      className="tw-space-y-4"
      ref={providedScrollContainer ? undefined : localScrollContainer}
    >
      {isApprove ? (
        <WaveApprovalStatusBar
          wave={presentation}
          approvedCount={winners.hasNextPage ? null : approvedCount}
          closeStatus={closeStatus}
          isApprovalCountError={winners.isError}
          retryApprovalCount={() => void winners.refetch()}
        />
      ) : (
        <WaveLeaderboardTime wave={presentation} withTopMargin={!isMainStage} />
      )}
      <WaveLeaderboardHeader
        additionalActionOnly={additionalActionOnly}
        onAdditionalActionChange={
          isMainStage
            ? (checked) =>
                setAdditionalActionScope(checked ? filterScope : null)
            : undefined
        }
        wave={presentation}
        viewMode={viewMode}
        onViewModeChange={setViewMode}
        sort={sort}
        onSortChange={setSort}
        onCreateDrop={isMainStage ? undefined : onCreateDrop}
        additionalActions={<CompetitionMySubmissions />}
        minPrice={priceRange.minPrice}
        maxPrice={priceRange.maxPrice}
        onPriceRangeChange={isCuration ? setPriceRange : undefined}
      />
      {content}
    </div>
  );
}
