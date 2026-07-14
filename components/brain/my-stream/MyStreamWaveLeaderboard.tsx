"use client";

import React, {
  useContext,
  useMemo,
  useState,
  useEffect,
  useRef,
  useCallback,
} from "react";
import type { ExtendedDrop } from "@/helpers/waves/drop.helpers";
import { AnimatePresence, motion } from "framer-motion";
import type { ApiWave } from "@/generated/models/ApiWave";
import { WaveLeaderboardTime } from "@/components/waves/leaderboard/WaveLeaderboardTime";
import WaveApprovalStatusBar from "@/components/waves/approval/WaveApprovalStatusBar";
import { WaveLeaderboardHeader } from "@/components/waves/leaderboard/header/WaveleaderboardHeader";
import { WaveDropCreate } from "@/components/waves/leaderboard/create/WaveDropCreate";
import { WaveLeaderboardCurationDropModal } from "@/components/waves/leaderboard/create/WaveLeaderboardCurationDropModal";
import { WaveLeaderboardDrops } from "@/components/waves/leaderboard/drops/WaveLeaderboardDrops";
import { WaveLeaderboardGallery } from "@/components/waves/leaderboard/gallery/WaveLeaderboardGallery";
import { WaveLeaderboardGrid } from "@/components/waves/leaderboard/grid/WaveLeaderboardGrid";
import {
  isLeaderboardViewMode,
  type LeaderboardViewMode,
} from "@/components/waves/leaderboard/types";
import { useWave } from "@/hooks/useWave";
import { AuthContext } from "@/components/auth/Auth";
import { useLayout } from "./layout/LayoutContext";
import { WaveDropsLeaderboardSort } from "@/hooks/useWaveDropsLeaderboard";
import useLocalPreference from "@/hooks/useLocalPreference";
import MemesArtSubmissionModal from "@/components/waves/memes/MemesArtSubmissionModal";
import { normalizeWaveLeaderboardSort } from "@/components/waves/leaderboard/header/WaveleaderboardSort";
import { getWaveDropEligibility } from "@/components/waves/leaderboard/dropEligibility";
import {
  resolveWaveSubmissionExperience,
  WaveSubmissionExperience,
} from "@/helpers/waves/wave-submission-experience.helpers";
import { useApprovalWaveStatus } from "@/hooks/waves/useApprovalWaveStatus";
import { getApprovedDropsCount } from "@/helpers/waves/approve-wave.helpers";
import {
  FULL_APPROVAL_WAVE_DECISIONS_PAGE_SIZE,
  useWaveDecisions,
} from "@/hooks/waves/useWaveDecisions";

interface MyStreamWaveLeaderboardProps {
  readonly wave: ApiWave;
  readonly onDropClick: (drop: ExtendedDrop) => void;
}

interface CreateDropUiState {
  readonly waveId: string;
  readonly submissionExperience: WaveSubmissionExperience | null;
  readonly isApprovalVotingControlsLocked: boolean;
}

interface LeaderboardContentProps {
  readonly wave: ApiWave;
  readonly viewMode: LeaderboardViewMode;
  readonly sort: WaveDropsLeaderboardSort;
  readonly isMemesWave: boolean;
  readonly isVotingClosed: boolean;
  readonly isVotingControlsLocked: boolean;
  readonly onDropClick: (drop: ExtendedDrop) => void;
  readonly minPrice: number | undefined;
  readonly maxPrice: number | undefined;
  readonly priceCurrency: string | undefined;
  readonly onCreateDrop: (() => void) | undefined;
  readonly scrollContainerRef: React.RefObject<HTMLDivElement | null>;
}

const isWaveLeaderboardSortPreference = (
  value: unknown,
  isApproveWave: boolean,
  isCurationWave: boolean
): value is WaveDropsLeaderboardSort =>
  value === WaveDropsLeaderboardSort.RANK ||
  (isApproveWave && value === WaveDropsLeaderboardSort.REALTIME_VOTE) ||
  value === WaveDropsLeaderboardSort.RATING_PREDICTION ||
  value === WaveDropsLeaderboardSort.TREND ||
  value === WaveDropsLeaderboardSort.MY_REALTIME_VOTE ||
  value === WaveDropsLeaderboardSort.CREATED_AT ||
  (isCurationWave && value === WaveDropsLeaderboardSort.PRICE);

const stickyLeaderboardControlsClassName =
  "tw-sticky tw-top-0 tw-z-30 tw-flex-none tw-bg-black tw-py-4";
const staticLeaderboardControlsClassName = "tw-flex-none tw-bg-black tw-py-4";

interface LeaderboardControlsFrameProps {
  readonly isSticky: boolean;
  readonly children: React.ReactNode;
}

const LeaderboardControlsFrame: React.FC<LeaderboardControlsFrameProps> = ({
  isSticky,
  children,
}) => (
  <div
    className={
      isSticky
        ? stickyLeaderboardControlsClassName
        : staticLeaderboardControlsClassName
    }
  >
    {children}
  </div>
);

interface ApproveListStickyLeaderboardControlsProps {
  readonly rootRef: React.RefObject<HTMLDivElement | null>;
  readonly children: React.ReactNode;
}

const ApproveListStickyLeaderboardControls: React.FC<
  ApproveListStickyLeaderboardControlsProps
> = ({ rootRef, children }) => {
  const [isSticky, setIsSticky] = useState(false);
  const sentinelRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const container = rootRef.current;
    const sentinel = sentinelRef.current;

    if (!container || !sentinel) {
      return;
    }

    if (typeof globalThis.IntersectionObserver === "undefined") {
      return;
    }

    const observer = new globalThis.IntersectionObserver(
      ([entry]) => {
        if (!entry) {
          return;
        }

        const rootTop =
          entry.rootBounds?.top ?? container.getBoundingClientRect().top;
        const hasScrolledPastSentinel =
          !entry.isIntersecting && entry.boundingClientRect.bottom <= rootTop;

        setIsSticky((current) =>
          current === hasScrolledPastSentinel
            ? current
            : hasScrolledPastSentinel
        );
      },
      { root: container, threshold: 0 }
    );

    observer.observe(sentinel);

    return () => observer.disconnect();
  }, [rootRef]);

  return (
    <>
      <div
        ref={sentinelRef}
        aria-hidden="true"
        data-testid="approval-controls-sticky-sentinel"
        className="tw-h-px tw-w-full tw-flex-none"
      />
      <LeaderboardControlsFrame isSticky={isSticky}>
        {children}
      </LeaderboardControlsFrame>
    </>
  );
};

const LeaderboardContent: React.FC<LeaderboardContentProps> = ({
  wave,
  viewMode,
  sort,
  isMemesWave,
  isVotingClosed,
  isVotingControlsLocked,
  onDropClick,
  minPrice,
  maxPrice,
  priceCurrency,
  onCreateDrop,
  scrollContainerRef,
}) => {
  if (viewMode === "list") {
    return (
      <WaveLeaderboardDrops
        wave={wave}
        sort={sort}
        isVotingClosed={isVotingClosed}
        isVotingControlsLocked={isVotingControlsLocked}
        onDropClick={onDropClick}
        minPrice={minPrice}
        maxPrice={maxPrice}
        priceCurrency={priceCurrency}
        onCreateDrop={onCreateDrop}
        scrollContainerRef={scrollContainerRef}
      />
    );
  }

  if (!isMemesWave) {
    return (
      <WaveLeaderboardGrid
        wave={wave}
        sort={sort}
        isVotingClosed={isVotingClosed}
        isVotingControlsLocked={isVotingControlsLocked}
        minPrice={minPrice}
        maxPrice={maxPrice}
        priceCurrency={priceCurrency}
        mode={viewMode === "grid" ? "compact" : "content_only"}
        onDropClick={onDropClick}
        scrollContainerRef={scrollContainerRef}
      />
    );
  }

  return (
    <WaveLeaderboardGallery
      wave={wave}
      sort={sort}
      isVotingClosed={isVotingClosed}
      isVotingControlsLocked={isVotingControlsLocked}
      minPrice={minPrice}
      maxPrice={maxPrice}
      priceCurrency={priceCurrency}
      onDropClick={onDropClick}
      scrollContainerRef={scrollContainerRef}
    />
  );
};

const MyStreamWaveLeaderboard: React.FC<MyStreamWaveLeaderboardProps> = ({
  wave,
  onDropClick,
}) => {
  const leaderboardContainerRef = useRef<HTMLDivElement | null>(null);
  const { connectedProfile, activeProfileProxy } = useContext(AuthContext);
  const {
    isApproveWave,
    isMemesWave,
    isCurationWave,
    isQuorumWave,
    participation,
  } = useWave(wave);
  const { leaderboardViewStyle } = useLayout(); // Get pre-calculated style from context
  const submissionExperience = resolveWaveSubmissionExperience({
    isMemesWave,
    isCurationWave,
    isQuorumWave,
    submissionStrategy: wave.participation.submission_strategy ?? null,
  });

  // Track mount status
  const mountedRef = useRef(true);
  useEffect(() => {
    return () => {
      mountedRef.current = false;
    };
  }, []);

  const containerClassName = useMemo(() => {
    return `tw-w-full tw-min-w-0 tw-flex tw-flex-col tw-rounded-t-xl tw-overflow-y-auto tw-scrollbar-thin tw-scrollbar-thumb-iron-500 tw-scrollbar-track-iron-800 desktop-hover:hover:tw-scrollbar-thumb-iron-300 tw-overflow-x-hidden tw-flex-grow tw-px-2 sm:tw-px-4`;
  }, []);

  const [minPrice, setMinPrice] = useState<number | undefined>(undefined);
  const [maxPrice, setMaxPrice] = useState<number | undefined>(undefined);

  const isLoggedIn = Boolean(connectedProfile?.handle);
  const { canCreateDrop } = useMemo(
    () =>
      getWaveDropEligibility({
        isLoggedIn,
        isProxy: Boolean(activeProfileProxy),
        isCurationWave,
        participation,
      }),
    [activeProfileProxy, isCurationWave, isLoggedIn, participation]
  );

  // Generate a unique preference key for this wave
  const viewPreferenceKey = `waveViewMode_${wave.id}`;

  // Determine the default view mode based on wave type
  const defaultViewMode: LeaderboardViewMode = isMemesWave ? "grid" : "list";

  // Use our custom hook to manage view mode preference
  const [viewMode, setViewMode] = useLocalPreference<LeaderboardViewMode>(
    viewPreferenceKey,
    defaultViewMode,
    isLeaderboardViewMode
  );

  // Use our custom hook for sort preference too
  const sortPreferenceKey = `waveSortMode_${wave.id}`;
  const [sort, setSort] = useLocalPreference<WaveDropsLeaderboardSort>(
    sortPreferenceKey,
    WaveDropsLeaderboardSort.RANK,
    (value): value is WaveDropsLeaderboardSort =>
      isWaveLeaderboardSortPreference(value, isApproveWave, isCurationWave)
  );
  const effectiveSort = useMemo(
    () =>
      normalizeWaveLeaderboardSort({
        isApproveWave,
        sort,
        timeLockMs: wave.wave.time_lock_ms,
      }),
    [isApproveWave, sort, wave.wave.time_lock_ms]
  );
  const handleSortChange = useCallback(
    (nextSort: WaveDropsLeaderboardSort) => {
      setSort(
        normalizeWaveLeaderboardSort({
          isApproveWave,
          sort: nextSort,
          timeLockMs: wave.wave.time_lock_ms,
        })
      );
    },
    [isApproveWave, setSort, wave.wave.time_lock_ms]
  );

  const cannotDeriveApprovedCount =
    isApproveWave && getApprovedDropsCount({ wave }) === null;
  const shouldLoadApprovalDecisionPoints = cannotDeriveApprovedCount;
  const {
    decisionPoints: approvalDecisionPoints,
    hasLoadedAllPages: hasLoadedApprovalDecisionPoints,
    isLoadingAllPagesError: isApprovalDecisionPointsLoadError,
    refetch: refetchApprovalDecisionPoints,
    fetchNextPage: fetchNextApprovalDecisionPointsPage,
    hasNextPage: hasNextApprovalDecisionPointsPage,
  } = useWaveDecisions({
    waveId: wave.id,
    enabled: shouldLoadApprovalDecisionPoints,
    loadAllPages: true,
    pageSize: FULL_APPROVAL_WAVE_DECISIONS_PAGE_SIZE,
  });
  const retryApprovalDecisionPointsLoad = useCallback(() => {
    if (hasNextApprovalDecisionPointsPage) {
      void fetchNextApprovalDecisionPointsPage();
      return;
    }

    void refetchApprovalDecisionPoints();
  }, [
    fetchNextApprovalDecisionPointsPage,
    hasNextApprovalDecisionPointsPage,
    refetchApprovalDecisionPoints,
  ]);
  const {
    approvedCount,
    closeStatus: approvalCloseStatus,
    isApprovalStatusError,
    isVotingClosed: isApprovalVotingClosed,
    isVotingControlsLocked: isApprovalVotingControlsLocked,
    retryApprovalStatus,
  } = useApprovalWaveStatus({
    wave,
    ...(shouldLoadApprovalDecisionPoints
      ? {
          decisionPoints: approvalDecisionPoints,
          areDecisionPointsComplete: hasLoadedApprovalDecisionPoints,
          isDecisionPointsLoadError: isApprovalDecisionPointsLoadError,
          onRetryDecisionPointsLoad: retryApprovalDecisionPointsLoad,
        }
      : {}),
  });
  const isApprovalCountError = Boolean(
    shouldLoadApprovalDecisionPoints &&
    isApprovalDecisionPointsLoadError &&
    approvedCount === null &&
    !isApprovalStatusError
  );
  const retryApprovalCount = isApprovalCountError
    ? retryApprovalDecisionPointsLoad
    : null;
  const canOpenCreateDrop = canCreateDrop && !isApprovalVotingControlsLocked;
  const [createDropUiState, setCreateDropUiState] = useState<CreateDropUiState>(
    () => ({
      waveId: wave.id,
      submissionExperience: null,
      isApprovalVotingControlsLocked,
    })
  );
  const activeCreateDropExperience =
    canOpenCreateDrop &&
    createDropUiState.waveId === wave.id &&
    createDropUiState.submissionExperience === submissionExperience &&
    createDropUiState.isApprovalVotingControlsLocked ===
      isApprovalVotingControlsLocked
      ? createDropUiState.submissionExperience
      : null;
  const showToggleableDropInput =
    activeCreateDropExperience !== null &&
    activeCreateDropExperience !== WaveSubmissionExperience.MEMES_LEGACY &&
    activeCreateDropExperience !== WaveSubmissionExperience.CURATION_LEGACY &&
    activeCreateDropExperience !== WaveSubmissionExperience.QUORUM_PROPOSAL;

  const closeCreateDrop = useCallback(() => {
    if (!mountedRef.current) {
      return;
    }

    setCreateDropUiState((current) => {
      if (current.submissionExperience === null) {
        return current;
      }

      return {
        ...current,
        submissionExperience: null,
      };
    });
  }, []);

  const onCreateDrop = useCallback(() => {
    if (!mountedRef.current) {
      return;
    }

    if (!canOpenCreateDrop) {
      return;
    }

    setCreateDropUiState({
      waveId: wave.id,
      submissionExperience,
      isApprovalVotingControlsLocked,
    });
  }, [
    canOpenCreateDrop,
    isApprovalVotingControlsLocked,
    submissionExperience,
    wave.id,
  ]);

  const priceCurrency = useMemo(() => {
    const hasPriceFilter =
      typeof minPrice === "number" || typeof maxPrice === "number";
    if (
      isCurationWave &&
      (hasPriceFilter || effectiveSort === WaveDropsLeaderboardSort.PRICE)
    ) {
      return "ETH";
    }
    return undefined;
  }, [effectiveSort, isCurationWave, maxPrice, minPrice]);

  const updatePriceRange = useCallback(
    ({
      minPrice: nextMinPrice,
      maxPrice: nextMaxPrice,
    }: {
      readonly minPrice: number | undefined;
      readonly maxPrice: number | undefined;
    }) => {
      setMinPrice(nextMinPrice);
      setMaxPrice(nextMaxPrice);
    },
    []
  );

  const effectiveViewMode = useMemo<LeaderboardViewMode>(() => {
    if (!isMemesWave) {
      return viewMode;
    }
    // Preserve existing meme wave behavior (list/grid only).
    if (viewMode === "grid_content_only") {
      return "grid";
    }
    return viewMode;
  }, [isMemesWave, viewMode]);
  const createDropAction = canOpenCreateDrop ? onCreateDrop : undefined;
  const shouldDelayApprovalControlsSticky =
    isApproveWave && effectiveViewMode === "list";
  const leaderboardControls = (
    <WaveLeaderboardHeader
      wave={wave}
      viewMode={effectiveViewMode}
      sort={effectiveSort}
      onViewModeChange={(mode) => setViewMode(mode)}
      onCreateDrop={createDropAction}
      onSortChange={handleSortChange}
      minPrice={minPrice}
      maxPrice={maxPrice}
      onPriceRangeChange={isCurationWave ? updatePriceRange : undefined}
    />
  );

  return (
    <div
      ref={leaderboardContainerRef}
      tabIndex={-1}
      className={containerClassName}
      style={leaderboardViewStyle}
    >
      {isApproveWave ? (
        <WaveApprovalStatusBar
          approvedCount={approvedCount}
          closeStatus={approvalCloseStatus}
          isApprovalCountError={isApprovalCountError}
          isApprovalStatusError={isApprovalStatusError}
          retryApprovalCount={retryApprovalCount}
          retryApprovalStatus={retryApprovalStatus}
          wave={wave}
        />
      ) : (
        <WaveLeaderboardTime wave={wave} />
      )}

      {/* Sticky tabs/filters section */}
      {shouldDelayApprovalControlsSticky ? (
        <ApproveListStickyLeaderboardControls
          key={`${wave.id}:list`}
          rootRef={leaderboardContainerRef}
        >
          {leaderboardControls}
        </ApproveListStickyLeaderboardControls>
      ) : (
        <LeaderboardControlsFrame isSticky>
          {leaderboardControls}
        </LeaderboardControlsFrame>
      )}

      {/* Content section */}
      <div className="tw-min-w-0 tw-pb-[calc(env(safe-area-inset-bottom,0px)+1.5rem)]">
        <AnimatePresence>
          {showToggleableDropInput && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.2, ease: "easeInOut" }}
            >
              <WaveDropCreate
                wave={wave}
                onCancel={closeCreateDrop}
                onSuccess={closeCreateDrop}
              />
            </motion.div>
          )}
        </AnimatePresence>

        {activeCreateDropExperience ===
          WaveSubmissionExperience.MEMES_LEGACY && (
          <MemesArtSubmissionModal
            isOpen
            wave={wave}
            onClose={closeCreateDrop}
          />
        )}
        {activeCreateDropExperience ===
          WaveSubmissionExperience.CURATION_LEGACY && (
          <WaveLeaderboardCurationDropModal
            isOpen
            wave={wave}
            onClose={closeCreateDrop}
          />
        )}
        {activeCreateDropExperience ===
          WaveSubmissionExperience.QUORUM_PROPOSAL && (
          <WaveDropCreate
            wave={wave}
            onCancel={closeCreateDrop}
            onSuccess={closeCreateDrop}
          />
        )}

        <LeaderboardContent
          wave={wave}
          viewMode={effectiveViewMode}
          sort={effectiveSort}
          isMemesWave={isMemesWave}
          isVotingClosed={isApprovalVotingClosed}
          isVotingControlsLocked={isApprovalVotingControlsLocked}
          onDropClick={onDropClick}
          minPrice={minPrice}
          maxPrice={maxPrice}
          priceCurrency={priceCurrency}
          onCreateDrop={createDropAction}
          scrollContainerRef={leaderboardContainerRef}
        />
      </div>
    </div>
  );
};

export default MyStreamWaveLeaderboard;
