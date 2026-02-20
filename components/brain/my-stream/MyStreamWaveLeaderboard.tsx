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
import { WaveLeaderboardHeader } from "@/components/waves/leaderboard/header/WaveleaderboardHeader";
import { WaveDropCreate } from "@/components/waves/leaderboard/create/WaveDropCreate";
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
import { useWaveCurationGroups } from "@/hooks/waves/useWaveCurationGroups";
import { getWaveDropEligibility } from "@/components/waves/leaderboard/dropEligibility";

interface MyStreamWaveLeaderboardProps {
  readonly wave: ApiWave;
  readonly onDropClick: (drop: ExtendedDrop) => void;
}

const MyStreamWaveLeaderboard: React.FC<MyStreamWaveLeaderboardProps> = ({
  wave,
  onDropClick,
}) => {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { connectedProfile, activeProfileProxy } = useContext(AuthContext);
  const { isMemesWave, isCurationWave, participation } = useWave(wave);
  const { leaderboardViewStyle } = useLayout(); // Get pre-calculated style from context

  // Track mount status
  const mountedRef = useRef(true);
  useEffect(() => {
    return () => {
      mountedRef.current = false;
    };
  }, []);

  const containerClassName = useMemo(() => {
    return `tw-w-full tw-flex tw-flex-col tw-rounded-t-xl tw-overflow-y-auto tw-scrollbar-thin tw-scrollbar-thumb-iron-500 tw-scrollbar-track-iron-800 desktop-hover:hover:tw-scrollbar-thumb-iron-300 tw-overflow-x-hidden tw-flex-grow tw-px-2 sm:tw-px-4`;
  }, []);

  const [isCreateDropOpen, setIsCreateDropOpen] = useState(false);
  const [isMemesCreateOpen, setIsMemesCreateOpen] = useState(false);

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
  const showPersistentDropInput =
    !isMemesWave && isCurationWave && canCreateDrop;
  const showToggleableDropInput =
    !isMemesWave && !isCurationWave && isCreateDropOpen;

  const onCreateDrop = useCallback(() => {
    if (!mountedRef.current) {
      return;
    }

    if (isMemesWave) {
      setIsMemesCreateOpen(true);
      return;
    }

    if (!isCurationWave) {
      setIsCreateDropOpen(true);
    }
  }, [isCurationWave, isMemesWave]);

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
      value === WaveDropsLeaderboardSort.CREATED_AT
  );

  const {
    data: curationGroups = [],
    isLoading: isLoadingCurationGroups,
    isError: isCurationGroupsError,
  } = useWaveCurationGroups({
    waveId: wave.id,
    enabled: wave.wave.type !== ApiWaveType.Chat,
  });

  const rawCuratedByGroupId = searchParams.get("curated_by_group");

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

  const updateCurationGroupInUrl = useCallback(
    (groupId: string | null) => {
      const nextParams = new URLSearchParams(searchParams.toString());

      if (groupId) {
        nextParams.set("curated_by_group", groupId);
      } else {
        nextParams.delete("curated_by_group");
      }

      const nextQuery = nextParams.toString();
      const nextUrl = nextQuery ? `${pathname}?${nextQuery}` : pathname;
      router.replace(nextUrl, { scroll: false });
    },
    [pathname, router, searchParams]
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
        curatedByGroupId={curatedByGroupId}
        onCreateDrop={isMemesWave || !isCurationWave ? onCreateDrop : undefined}
      />
    );
  } else if (!isMemesWave) {
    leaderboardContent = (
      <WaveLeaderboardGrid
        wave={wave}
        sort={sort}
        curatedByGroupId={curatedByGroupId}
        mode={effectiveViewMode === "grid" ? "compact" : "content_only"}
        onDropClick={onDropClick}
      />
    );
  } else {
    leaderboardContent = (
      <WaveLeaderboardGallery
        wave={wave}
        sort={sort}
        curatedByGroupId={curatedByGroupId}
        onDropClick={onDropClick}
      />
    );
  }

  return (
    <div className={containerClassName} style={leaderboardViewStyle}>
      <WaveLeaderboardTime wave={wave} />

      {/* Sticky tabs/filters section */}
      <div className="tw-sticky tw-top-0 tw-z-30 tw-bg-black tw-py-4">
        <WaveLeaderboardHeader
          wave={wave}
          viewMode={effectiveViewMode}
          sort={sort}
          onViewModeChange={(mode) => setViewMode(mode)}
          onCreateDrop={
            isMemesWave || !isCurationWave ? onCreateDrop : undefined
          }
          onSortChange={(s) => setSort(s)}
          curationGroups={curationGroups}
          curatedByGroupId={curatedByGroupId ?? null}
          onCurationGroupChange={
            curationGroups.length > 0 ? updateCurationGroupInUrl : undefined
          }
        />
      </div>

      {/* Content section */}
      <div>
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
                onCancel={() => {
                  if (mountedRef.current) {
                    setIsCreateDropOpen(false);
                  }
                }}
                onSuccess={() => {
                  if (mountedRef.current) {
                    setIsCreateDropOpen(false);
                  }
                }}
              />
            </motion.div>
          )}
        </AnimatePresence>

        {showPersistentDropInput && (
          <div className="tw-mt-2">
            <WaveDropCreate
              wave={wave}
              onSuccess={() => {}}
              isCurationLeaderboard
            />
          </div>
        )}

        {isMemesWave && isMemesCreateOpen && (
          <MemesArtSubmissionModal
            isOpen={isMemesCreateOpen}
            wave={wave}
            onClose={() => setIsMemesCreateOpen(false)}
          />
        )}

        {leaderboardContent}
      </div>
    </div>
  );
};

export default MyStreamWaveLeaderboard;
