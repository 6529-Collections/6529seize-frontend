"use client";

import type { ReactNode } from "react";
import React, {
  Suspense,
  useCallback,
  useMemo,
  useState,
  useSyncExternalStore,
} from "react";
import { AnimatePresence, LazyMotion, domAnimation, m } from "framer-motion";
import BrainMobileTabs from "./mobile/BrainMobileTabs";
import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { keepPreviousData, useQuery } from "@tanstack/react-query";
import BrainDesktopDrop from "./BrainDesktopDrop";
import type { ExtendedDrop } from "@/helpers/waves/drop.helpers";
import { DropSize } from "@/helpers/waves/drop.helpers";
import { useWaveData } from "@/hooks/useWaveData";
import { useWaveTimers } from "@/hooks/useWaveTimers";
import { useWave } from "@/hooks/useWave";
import { useWavePollSummary } from "@/hooks/useWaveHasPolls";
import {
  useWaveMetadata,
  useWaveOutcomeVisibility,
} from "@/hooks/waves/useWaveMetadata";
import type { ApiDrop } from "@/generated/models/ApiDrop";
import useDeviceInfo from "@/hooks/useDeviceInfo";
import {
  LazyMemesQuickVoteRuntime,
  useMemesQuickVoteRuntimeLauncher,
} from "./left-sidebar/waves/memes-quick-vote/MemesQuickVoteRuntimeLoader";
import {
  getActiveWaveIdFromUrl,
  getHomeRoute,
  getWaveHomeRoute,
} from "@/helpers/navigation.helpers";
import { markDropCloseNavigation } from "@/helpers/drop-close-navigation.helpers";
import CreateWaveModal from "@/components/waves/create-wave/CreateWaveModal";
import CreateDirectMessageModal from "@/components/waves/create-dm/CreateDirectMessageModal";
import { useExitActiveWave } from "@/components/navigation/useExitActiveWave";
import { useAuth } from "@/components/auth/Auth";
import { useMyStreamOptional } from "@/contexts/wave/MyStreamContext";
import { useClosingDropId } from "@/hooks/useClosingDropId";
import MobileWaveSubwavesBar from "./mobile/MobileWaveSubwavesBar";
import BrainMobileViewContent from "./mobile/BrainMobileViewContent";
import { BrainView } from "./mobile/brainMobileViews";
import { useBrainMobileActiveView } from "./mobile/useBrainMobileActiveView";
import {
  DROP_DETAIL_STALE_TIME_MS,
  fetchDropByIdBatched,
  getDropQueryKey,
} from "@/services/api/drop-api";
import { useWaveListSwipeBack } from "./mobile/useWaveListSwipeBack";
import { SidebarTab } from "./right-sidebar/BrainRightSidebarTypes";
import { WaveContentTabs } from "./right-sidebar/WaveContent";
import { waveRightPanelText } from "@/helpers/waves/wave-right-panel.helpers";

interface Props {
  readonly children: ReactNode;
}

interface MobileAboutTabState {
  readonly waveId: string | null;
  readonly activeTab: SidebarTab;
}

const BrainMobileContent: React.FC<Props> = ({ children }) => {
  const router = useRouter();
  // react-doctor-disable-next-line react-doctor/nextjs-no-use-search-params-without-suspense covered by BrainMobile Suspense wrapper
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const { isApp } = useDeviceInfo();
  const { connectedProfile, fetchingProfile } = useAuth();
  const hasAuthenticatedProfile = Boolean(connectedProfile?.handle);
  const quickVote = useMemesQuickVoteRuntimeLauncher();
  const hydrated = useSyncExternalStore(
    () => () => {},
    () => true,
    () => false
  );
  const myStream = useMyStreamOptional();
  const requestMainWavesList = myStream?.requestMainWavesList;
  const exitActiveWave = useExitActiveWave();

  const dropId = searchParams.get("drop") ?? undefined;
  const { effectiveDropId, beginClosingDrop } = useClosingDropId(dropId);
  const { data: drop } = useQuery<ApiDrop>({
    queryKey: getDropQueryKey(effectiveDropId),
    queryFn: () => {
      if (!effectiveDropId) {
        throw new Error("Cannot fetch drop without a drop id");
      }

      return fetchDropByIdBatched(effectiveDropId);
    },
    placeholderData: keepPreviousData,
    enabled: !!effectiveDropId,
    staleTime: DROP_DETAIL_STALE_TIME_MS,
  });

  // Use MyStreamContext for waveId to support client-side navigation via pushState
  const waveId =
    myStream?.activeWave.id ??
    getActiveWaveIdFromUrl({ pathname, searchParams }) ??
    null;
  const { data: wave } = useWaveData({
    waveId: waveId,
    onWaveNotFound: () => {
      const params = new URLSearchParams(searchParams.toString() || "");
      params.delete("wave");
      const basePath = getWaveHomeRoute({
        isDirectMessage: pathname.startsWith("/messages"),
        isApp,
      });
      const newUrl = params.toString()
        ? `${basePath}?${params.toString()}`
        : basePath || getHomeRoute();
      router.push(newUrl, { scroll: false });
    },
  });

  const { isMemesWave, isCurationWave, isRankWave, isApproveWave } =
    useWave(wave);
  const isCompetitionWave = isRankWave || isApproveWave;
  const { isPending: isWaveMetadataPending } = useWaveMetadata(wave?.id, {
    enabled: isCompetitionWave,
  });
  const outcomesVisible = useWaveOutcomeVisibility(wave);

  const {
    voting: { isCompleted },
    decisions: { firstDecisionDone },
  } = useWaveTimers(wave);
  const { hasPolls, isPending: isWavePollsPending } = useWavePollSummary({
    waveId,
    enabled: Boolean(wave),
  });
  const waveNavigationReady =
    !waveId ||
    Boolean(
      wave &&
        !fetchingProfile &&
        !(isCompetitionWave && isWaveMetadataPending) &&
        !isWavePollsPending
    );
  const { activeView, onViewChange } = useBrainMobileActiveView({
    firstDecisionDone,
    isApp,
    isCompleted,
    hasAuthenticatedProfile,
    isCurationWave,
    isMemesWave,
    isRankWave,
    isApproveWave,
    showOutcomeView: outcomesVisible,
    hasPolls,
    pathname,
    searchParams,
    wave,
    waveId,
  });
  const [aboutTabState, setAboutTabState] = useState<MobileAboutTabState>({
    waveId: null,
    activeTab: SidebarTab.ABOUT,
  });
  const activeAboutTab =
    aboutTabState.waveId === wave?.id
      ? aboutTabState.activeTab
      : SidebarTab.ABOUT;
  const currentWaveId = wave?.id ?? null;
  const onAboutTabChange = useCallback(
    (tab: SidebarTab) => {
      if (!currentWaveId) {
        return;
      }

      setAboutTabState({ waveId: currentWaveId, activeTab: tab });
    },
    [currentWaveId]
  );

  const onDropClick = (selectedDrop: ExtendedDrop) => {
    const params = new URLSearchParams(searchParams.toString() || "");
    params.set("drop", selectedDrop.id);
    router.push(`${pathname}?${params.toString()}`, { scroll: false });
  };

  const onDropClose = () => {
    if (dropId) {
      beginClosingDrop(dropId);
    }
    markDropCloseNavigation();
    const params = new URLSearchParams(searchParams.toString() || "");
    params.delete("drop");
    const newUrl = params.toString()
      ? `${pathname}?${params.toString()}`
      : pathname || getHomeRoute();
    router.replace(newUrl, { scroll: false });
  };

  const isDropOpen =
    !!effectiveDropId &&
    !!drop &&
    drop.id.toLowerCase() === effectiveDropId.toLowerCase();

  const hasWave = Boolean(waveId);
  const canSwipeBackToWaves =
    isApp &&
    hasWave &&
    pathname.startsWith("/waves/") &&
    dropId === undefined &&
    searchParams.get("create") === null;
  const handleSwipeBackIntent = useCallback(() => {
    requestMainWavesList?.();
  }, [requestMainWavesList]);
  const handleSwipeBackToWaves = useCallback(() => {
    exitActiveWave(false);
  }, [exitActiveWave]);
  const swipeBackHandlers = useWaveListSwipeBack({
    enabled: canSwipeBackToWaves,
    onIntentStart: handleSwipeBackIntent,
    onSwipeBack: handleSwipeBackToWaves,
  });

  const closeCreateOverlay = useCallback(() => {
    const params = new URLSearchParams(searchParams.toString() || "");
    params.delete("create");
    const base = pathname || getHomeRoute();
    const next = params.toString() ? `${base}?${params.toString()}` : base;
    globalThis.window.history.replaceState(null, "", next);
  }, [pathname, searchParams]);

  const createOverlay = useMemo(() => {
    if (!isApp) return null;
    const createParam = searchParams.get("create");
    if (!createParam) return null;
    if (!connectedProfile) return null;

    if (createParam === "dm") {
      return (
        <CreateDirectMessageModal
          isOpen={true}
          onClose={closeCreateOverlay}
          profile={connectedProfile}
        />
      );
    }

    if (createParam === "wave") {
      return (
        <CreateWaveModal
          isOpen={true}
          onClose={closeCreateOverlay}
          profile={connectedProfile}
        />
      );
    }

    return null;
  }, [isApp, searchParams, connectedProfile, closeCreateOverlay]);

  const dropOverlayClass = isApp
    ? "tw-fixed tw-inset-0 tw-z-[1010] tw-bg-black tailwind-scope"
    : "tw-absolute tw-inset-0 tw-z-[1010]";
  const quickVoteRuntimeIntent =
    activeView === BrainView.WAVES && quickVote.shouldMountRuntime
      ? quickVote.runtimeIntent
      : null;

  return (
    <div className="tw-relative tw-flex tw-h-full tw-flex-col">
      {createOverlay}
      {isDropOpen && (
        <div className={dropOverlayClass}>
          <BrainDesktopDrop
            drop={{
              type: DropSize.FULL,
              ...drop,
              stableKey: drop.id,
              stableHash: drop.id,
            }}
            onClose={onDropClose}
          />
        </div>
      )}
      {(hasWave || !isApp) && (
        <BrainMobileTabs
          activeView={activeView}
          onViewChange={onViewChange}
          wave={wave}
          waveActive={hasWave}
          hasPolls={hasPolls}
          outcomesVisible={outcomesVisible}
          waveNavigationReady={waveNavigationReady}
          showWavesTab={hydrated}
          showStreamBack={hydrated}
          isApp={isApp}
        />
      )}
      {isApp &&
        wave &&
        (activeView === BrainView.ABOUT ? (
          <WaveContentTabs
            wave={wave}
            activeTab={activeAboutTab}
            setActiveTab={onAboutTabChange}
            maxVisibleTabs={3}
            variant="compactPills"
            aboutTabLabel={waveRightPanelText(
              "waves.sidebar.rightPanel.tabs.overview"
            )}
          />
        ) : (
          <MobileWaveSubwavesBar wave={wave} />
        ))}
      <LazyMotion features={domAnimation}>
        <AnimatePresence mode="wait">
          <m.div
            key={activeView}
            {...swipeBackHandlers}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.2, ease: "easeInOut" }}
            className="tw-relative tw-min-w-0 tw-flex-1"
          >
            <BrainMobileViewContent
              activeView={activeView}
              activeWaveId={waveId}
              activeAboutTab={activeAboutTab}
              onAboutTabChange={onAboutTabChange}
              isCurationWave={isCurationWave}
              isMemesWave={isMemesWave}
              isRankWave={isRankWave}
              isApproveWave={isApproveWave}
              outcomesVisible={outcomesVisible}
              hasPolls={hasPolls}
              onDropClick={onDropClick}
              onOpenQuickVote={quickVote.openQuickVote}
              onPrefetchQuickVote={quickVote.prefetchQuickVote}
              wave={wave}
            >
              {children}
            </BrainMobileViewContent>
          </m.div>
        </AnimatePresence>
      </LazyMotion>
      {quickVoteRuntimeIntent === null ? null : (
        <LazyMemesQuickVoteRuntime
          intent={quickVoteRuntimeIntent}
          onIdle={quickVote.resetQuickVoteRuntime}
        />
      )}
    </div>
  );
};

const BrainMobile: React.FC<Props> = (props) => (
  <Suspense fallback={null}>
    <BrainMobileContent {...props} />
  </Suspense>
);

export default BrainMobile;
