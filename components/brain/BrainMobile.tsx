"use client";

import type { ReactNode } from "react";
import React, { useCallback, useEffect, useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import BrainMobileTabs from "./mobile/BrainMobileTabs";
import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { commonApiFetch } from "@/services/api/common-api";
import BrainDesktopDrop from "./BrainDesktopDrop";
import type { ExtendedDrop } from "@/helpers/waves/drop.helpers";
import { DropSize } from "@/helpers/waves/drop.helpers";
import { useWaveData } from "@/hooks/useWaveData";
import { useWaveTimers } from "@/hooks/useWaveTimers";
import { QueryKey } from "../react-query-wrapper/ReactQueryWrapper";
import { useWave } from "@/hooks/useWave";
import type { ApiDrop } from "@/generated/models/ApiDrop";
import useDeviceInfo from "@/hooks/useDeviceInfo";
import MemesQuickVoteDialog from "./left-sidebar/waves/memes-quick-vote/MemesQuickVoteDialog";
import {
  getActiveWaveIdFromUrl,
  getHomeRoute,
  getWaveHomeRoute,
} from "@/helpers/navigation.helpers";
import { markDropCloseNavigation } from "@/helpers/drop-close-navigation.helpers";
import CreateWaveModal from "@/components/waves/create-wave/CreateWaveModal";
import CreateDirectMessageModal from "@/components/waves/create-dm/CreateDirectMessageModal";
import { useAuth } from "@/components/auth/Auth";
import { useMyStreamOptional } from "@/contexts/wave/MyStreamContext";
import { useClosingDropId } from "@/hooks/useClosingDropId";
import { useMemesQuickVoteDialogController } from "@/hooks/useMemesQuickVoteDialogController";
import BrainMobileViewContent from "./mobile/BrainMobileViewContent";
import FloatingMemesQuickVoteTrigger from "./mobile/FloatingMemesQuickVoteTrigger";
import { BrainView } from "./mobile/brainMobileViews";
import { useBrainMobileActiveView } from "./mobile/useBrainMobileActiveView";

interface Props {
  readonly children: ReactNode;
}

const BrainMobile: React.FC<Props> = ({ children }) => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const { isApp } = useDeviceInfo();
  const { connectedProfile } = useAuth();
  const {
    closeQuickVote,
    isQuickVoteOpen,
    openQuickVote,
    prefetchQuickVote,
    quickVoteSessionId,
  } = useMemesQuickVoteDialogController();
  const [hydrated, setHydrated] = useState(false);
  const myStream = useMyStreamOptional();

  useEffect(() => {
    setHydrated(true);
  }, []);

  const dropId = searchParams.get("drop") ?? undefined;
  const { effectiveDropId, beginClosingDrop } = useClosingDropId(dropId);
  const { data: drop } = useQuery<ApiDrop>({
    queryKey: [QueryKey.DROP, { drop_id: effectiveDropId }],
    queryFn: async () => {
      if (!effectiveDropId) {
        throw new Error("Cannot fetch drop without a drop id");
      }

      return await commonApiFetch<ApiDrop>({
        endpoint: `drops/${effectiveDropId}`,
      });
    },
    placeholderData: keepPreviousData,
    enabled: !!effectiveDropId,
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

  const { isMemesWave, isCurationWave, isRankWave, isDm } = useWave(wave);

  const {
    voting: { isCompleted },
    decisions: { firstDecisionDone },
  } = useWaveTimers(wave);
  const { activeView, onViewChange } = useBrainMobileActiveView({
    firstDecisionDone,
    isApp,
    isCompleted,
    isCurationWave,
    isMemesWave,
    isRankWave,
    pathname,
    searchParams,
    wave,
    waveId,
  });

  const onDropClick = (drop: ExtendedDrop) => {
    const params = new URLSearchParams(searchParams.toString() || "");
    params.set("drop", drop.id);
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

  const closeCreateOverlay = useCallback(() => {
    const params = new URLSearchParams(searchParams.toString() || "");
    params.delete("create");
    const base = pathname ?? "/";
    const next = params.toString() ? `${base}?${params.toString()}` : base;
    router.replace(next, { scroll: false });
  }, [router, pathname, searchParams]);

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

  const shouldMountFloatingQuickVoteEntry =
    isApp &&
    hasWave &&
    !!wave &&
    activeView === BrainView.DEFAULT &&
    !isDropOpen &&
    !isDm;
  const shouldMountQuickVoteDialog =
    isQuickVoteOpen ||
    shouldMountFloatingQuickVoteEntry ||
    activeView === BrainView.WAVES;

  const dropOverlayClass = isApp
    ? "tw-fixed tw-inset-0 tw-z-[1010] tw-bg-black tailwind-scope"
    : "tw-absolute tw-inset-0 tw-z-[1010]";

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
          showWavesTab={hydrated}
          showStreamBack={hydrated}
          isApp={isApp}
        />
      )}
      <AnimatePresence mode="wait">
        <motion.div
          key={activeView}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -20 }}
          transition={{ duration: 0.2, ease: "easeInOut" }}
          className="tw-relative tw-min-w-0 tw-flex-1"
        >
          {shouldMountFloatingQuickVoteEntry && (
            <FloatingMemesQuickVoteTrigger
              onOpenQuickVote={openQuickVote}
              onPrefetchQuickVote={prefetchQuickVote}
            />
          )}
          <BrainMobileViewContent
            activeView={activeView}
            activeWaveId={waveId}
            isCurationWave={isCurationWave}
            isMemesWave={isMemesWave}
            isRankWave={isRankWave}
            onDropClick={onDropClick}
            onOpenQuickVote={openQuickVote}
            onPrefetchQuickVote={prefetchQuickVote}
            wave={wave}
          >
            {children}
          </BrainMobileViewContent>
        </motion.div>
      </AnimatePresence>
      {shouldMountQuickVoteDialog && (
        <MemesQuickVoteDialog
          isOpen={isQuickVoteOpen}
          sessionId={quickVoteSessionId}
          onClose={closeQuickVote}
        />
      )}
    </div>
  );
};

export default BrainMobile;
