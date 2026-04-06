"use client";

import React, {
  useContext,
  useMemo,
  useState,
  useEffect,
  useRef,
  useCallback,
  useImperativeHandle,
} from "react";
import type { ExtendedDrop } from "@/helpers/waves/drop.helpers";
import { AnimatePresence, motion } from "framer-motion";
import type { ApiWave } from "@/generated/models/ApiWave";
import { ApiWaveType } from "@/generated/models/ApiWaveType";
import { WaveLeaderboardTime } from "@/components/waves/leaderboard/WaveLeaderboardTime";
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
import { useWaveCurationGroups } from "@/hooks/waves/useWaveCurationGroups";
import { getWaveDropEligibility } from "@/components/waves/leaderboard/dropEligibility";
import {
  resolveWaveSubmissionExperience,
  WaveSubmissionExperience,
} from "@/helpers/waves/wave-submission-experience.helpers";
import { useWaveViewerMode } from "@/components/waves/public/WaveViewerModeContext";

interface MyStreamWaveLeaderboardProps {
  readonly wave: ApiWave;
  readonly onDropClick: (drop: ExtendedDrop) => void;
}

type CreateSurfaceState = "closed" | "drop" | "memes" | "curation";

interface WaveCreateControllerProps {
  readonly wave: ApiWave;
  readonly canCreateDrop: boolean;
  readonly isPublicReadOnly: boolean;
  readonly submissionExperience: WaveSubmissionExperience;
}

interface WaveCreateControllerHandle {
  open: () => void;
}

const WaveCreateController = React.forwardRef<
  WaveCreateControllerHandle,
  WaveCreateControllerProps
>(({ wave, canCreateDrop, isPublicReadOnly, submissionExperience }, ref) => {
  const mountedRef = useRef(true);
  const [activeCreateSurface, setActiveCreateSurface] =
    useState<CreateSurfaceState>("closed");

  useEffect(() => {
    return () => {
      mountedRef.current = false;
    };
  }, []);

  const closeSurface = useCallback(() => {
    if (mountedRef.current) {
      setActiveCreateSurface("closed");
    }
  }, []);

  const openSurface = useCallback(() => {
    if (!mountedRef.current || isPublicReadOnly) {
      return;
    }

    if (submissionExperience === WaveSubmissionExperience.MEMES_LEGACY) {
      setActiveCreateSurface("memes");
      return;
    }

    if (submissionExperience === WaveSubmissionExperience.CURATION_LEGACY) {
      if (!canCreateDrop) {
        return;
      }
      setActiveCreateSurface("curation");
      return;
    }

    setActiveCreateSurface("drop");
  }, [canCreateDrop, isPublicReadOnly, submissionExperience]);

  useImperativeHandle(
    ref,
    () => ({
      open: openSurface,
    }),
    [openSurface]
  );

  const showToggleableDropInput =
    !isPublicReadOnly &&
    submissionExperience !== WaveSubmissionExperience.MEMES_LEGACY &&
    submissionExperience !== WaveSubmissionExperience.CURATION_LEGACY &&
    activeCreateSurface === "drop";

  return (
    <>
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
              onCancel={closeSurface}
              onSuccess={closeSurface}
            />
          </motion.div>
        )}
      </AnimatePresence>

      {!isPublicReadOnly &&
        submissionExperience === WaveSubmissionExperience.MEMES_LEGACY &&
        activeCreateSurface === "memes" && (
          <MemesArtSubmissionModal isOpen wave={wave} onClose={closeSurface} />
        )}
      {!isPublicReadOnly &&
        submissionExperience === WaveSubmissionExperience.CURATION_LEGACY &&
        activeCreateSurface === "curation" && (
          <WaveLeaderboardCurationDropModal
            isOpen
            wave={wave}
            onClose={closeSurface}
          />
        )}
    </>
  );
});

WaveCreateController.displayName = "WaveCreateController";

const MyStreamWaveLeaderboard: React.FC<MyStreamWaveLeaderboardProps> = ({
  wave,
  onDropClick,
}) => {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { connectedProfile, activeProfileProxy } = useContext(AuthContext);
  const { isPublicReadOnly } = useWaveViewerMode();
  const { isMemesWave, isCurationWave, participation } = useWave(wave);
  const { leaderboardViewStyle } = useLayout(); // Get pre-calculated style from context
  const submissionExperience = resolveWaveSubmissionExperience({
    isMemesWave,
    isCurationWave,
    submissionStrategy: wave.participation.submission_strategy ?? null,
  });
  const createControllerRef = useRef<WaveCreateControllerHandle | null>(null);

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
  const onCreateDrop = useCallback(() => {
    createControllerRef.current?.open();
  }, []);

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
        curatedByGroupId={curatedByGroupId}
        minPrice={minPrice}
        maxPrice={maxPrice}
        priceCurrency={priceCurrency}
        onCreateDrop={isPublicReadOnly ? undefined : onCreateDrop}
      />
    );
  } else if (!isMemesWave) {
    leaderboardContent = (
      <WaveLeaderboardGrid
        wave={wave}
        sort={sort}
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
      <WaveLeaderboardTime wave={wave} />

      {/* Sticky tabs/filters section */}
      <div className="tw-sticky tw-top-0 tw-z-30 tw-bg-black tw-py-4">
        <WaveLeaderboardHeader
          wave={wave}
          viewMode={effectiveViewMode}
          sort={sort}
          onViewModeChange={(mode) => setViewMode(mode)}
          onCreateDrop={isPublicReadOnly ? undefined : onCreateDrop}
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
      <div className="tw-min-w-0">
        <WaveCreateController
          key={isPublicReadOnly ? "readonly" : "interactive"}
          ref={createControllerRef}
          wave={wave}
          canCreateDrop={canCreateDrop}
          isPublicReadOnly={isPublicReadOnly}
          submissionExperience={submissionExperience}
        />

        {leaderboardContent}
      </div>
    </div>
  );
};

export default MyStreamWaveLeaderboard;
