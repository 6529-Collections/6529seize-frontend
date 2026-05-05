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
import { ApiWaveType } from "@/generated/models/ApiWaveType";
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
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useWaveCurations } from "@/hooks/waves/useWaveCurations";
import { getWaveDropEligibility } from "@/components/waves/leaderboard/dropEligibility";
import {
  resolveWaveSubmissionExperience,
  WaveSubmissionExperience,
} from "@/helpers/waves/wave-submission-experience.helpers";
import { useApprovalWaveStatus } from "@/hooks/waves/useApprovalWaveStatus";

interface MyStreamWaveLeaderboardProps {
  readonly wave: ApiWave;
  readonly onDropClick: (drop: ExtendedDrop) => void;
}

interface CreateDropUiState {
  readonly waveId: string;
  readonly submissionExperience: WaveSubmissionExperience | null;
  readonly isApprovalVotingControlsLocked: boolean;
}

const MyStreamWaveLeaderboard: React.FC<MyStreamWaveLeaderboardProps> = ({
  wave,
  onDropClick,
}) => {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
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
      value === WaveDropsLeaderboardSort.RANK ||
      value === WaveDropsLeaderboardSort.RATING_PREDICTION ||
      value === WaveDropsLeaderboardSort.TREND ||
      value === WaveDropsLeaderboardSort.MY_REALTIME_VOTE ||
      value === WaveDropsLeaderboardSort.CREATED_AT ||
      (isCurationWave && value === WaveDropsLeaderboardSort.PRICE)
  );

  const {
    data: curationGroups = [],
    isLoading: isLoadingCurationGroups,
    isError: isCurationGroupsError,
  } = useWaveCurations({
    waveId: wave.id,
    enabled: wave.wave.type !== ApiWaveType.Chat,
  });
  const {
    approvedCount,
    closeStatus: approvalCloseStatus,
    isApprovalStatusError,
    isVotingClosed: isApprovalVotingClosed,
    isVotingControlsLocked: isApprovalVotingControlsLocked,
    retryApprovalStatus,
  } = useApprovalWaveStatus({
    wave,
  });
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

  const rawCuratedByGroupId = searchParams.get("curation_id");

  const curationGroupIdSet = useMemo(
    () => new Set(curationGroups.map((group) => group.id)),
    [curationGroups]
  );

  const curatedByGroupId = useMemo(() => {
    if (!rawCuratedByGroupId) {
      return undefined;
    }

    if (isCurationGroupsError) {
      return undefined;
    }

    if (isLoadingCurationGroups) {
      return rawCuratedByGroupId;
    }

    return curationGroupIdSet.has(rawCuratedByGroupId)
      ? rawCuratedByGroupId
      : undefined;
  }, [
    rawCuratedByGroupId,
    isCurationGroupsError,
    isLoadingCurationGroups,
    curationGroupIdSet,
  ]);
  const priceCurrency = useMemo(() => {
    const hasPriceFilter =
      typeof minPrice === "number" || typeof maxPrice === "number";
    if (
      isCurationWave &&
      (hasPriceFilter || sort === WaveDropsLeaderboardSort.PRICE)
    ) {
      return "ETH";
    }
    return undefined;
  }, [isCurationWave, maxPrice, minPrice, sort]);

  const updateCurationGroupInUrl = useCallback(
    (groupId: string | null) => {
      const nextParams = new URLSearchParams(searchParams.toString());

      if (groupId) {
        nextParams.set("curation_id", groupId);
      } else {
        nextParams.delete("curation_id");
      }

      const nextQuery = nextParams.toString();
      const nextUrl = nextQuery ? `${pathname}?${nextQuery}` : pathname;
      router.replace(nextUrl, { scroll: false });
    },
    [pathname, router, searchParams]
  );

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

  let leaderboardContent: React.ReactNode;
  if (effectiveViewMode === "list") {
    leaderboardContent = (
      <WaveLeaderboardDrops
        wave={wave}
        sort={sort}
        isVotingClosed={isApprovalVotingClosed}
        isVotingControlsLocked={isApprovalVotingControlsLocked}
        curatedByGroupId={curatedByGroupId}
        onDropClick={onDropClick}
        minPrice={minPrice}
        maxPrice={maxPrice}
        priceCurrency={priceCurrency}
        onCreateDrop={canOpenCreateDrop ? onCreateDrop : undefined}
      />
    );
  } else if (!isMemesWave) {
    leaderboardContent = (
      <WaveLeaderboardGrid
        wave={wave}
        sort={sort}
        isVotingClosed={isApprovalVotingClosed}
        isVotingControlsLocked={isApprovalVotingControlsLocked}
        curatedByGroupId={curatedByGroupId}
        minPrice={minPrice}
        maxPrice={maxPrice}
        priceCurrency={priceCurrency}
        mode={effectiveViewMode === "grid" ? "compact" : "content_only"}
        onDropClick={onDropClick}
      />
    );
  } else {
    leaderboardContent = (
      <WaveLeaderboardGallery
        wave={wave}
        sort={sort}
        isVotingClosed={isApprovalVotingClosed}
        isVotingControlsLocked={isApprovalVotingControlsLocked}
        curatedByGroupId={curatedByGroupId}
        minPrice={minPrice}
        maxPrice={maxPrice}
        priceCurrency={priceCurrency}
        onDropClick={onDropClick}
      />
    );
  }

  return (
    <div className={containerClassName} style={leaderboardViewStyle}>
      {isApproveWave ? (
        <WaveApprovalStatusBar
          approvedCount={approvedCount}
          closeStatus={approvalCloseStatus}
          isApprovalStatusError={isApprovalStatusError}
          retryApprovalStatus={retryApprovalStatus}
          wave={wave}
        />
      ) : (
        <WaveLeaderboardTime wave={wave} />
      )}

      {/* Sticky tabs/filters section */}
      <div className="tw-sticky tw-top-0 tw-z-30 tw-bg-black tw-py-4">
        <WaveLeaderboardHeader
          wave={wave}
          viewMode={effectiveViewMode}
          sort={sort}
          onViewModeChange={(mode) => setViewMode(mode)}
          onCreateDrop={canOpenCreateDrop ? onCreateDrop : undefined}
          onSortChange={(s) => setSort(s)}
          curationGroups={curationGroups}
          curatedByGroupId={curatedByGroupId ?? null}
          onCurationGroupChange={
            curationGroups.length > 0 ? updateCurationGroupInUrl : undefined
          }
          minPrice={minPrice}
          maxPrice={maxPrice}
          onPriceRangeChange={isCurationWave ? updatePriceRange : undefined}
        />
      </div>

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

        {leaderboardContent}
      </div>
    </div>
  );
};

export default MyStreamWaveLeaderboard;
