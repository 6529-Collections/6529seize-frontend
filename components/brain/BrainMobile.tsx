"use client";

import React, { ReactNode, useCallback, useEffect, useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import BrainMobileTabs from "./mobile/BrainMobileTabs";
import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { commonApiFetch } from "@/services/api/common-api";
import BrainDesktopDrop from "./BrainDesktopDrop";
import BrainMobileAbout from "./mobile/BrainMobileAbout";
import { DropSize, ExtendedDrop } from "@/helpers/waves/drop.helpers";
import { useWaveData } from "@/hooks/useWaveData";
import MyStreamWaveLeaderboard from "./my-stream/MyStreamWaveLeaderboard";
import MyStreamWaveOutcome from "./my-stream/MyStreamWaveOutcome";
import { WaveWinners } from "../waves/winners/WaveWinners";
import { useWaveTimers } from "@/hooks/useWaveTimers";
import { QueryKey } from "../react-query-wrapper/ReactQueryWrapper";
import MyStreamWaveMyVotes from "./my-stream/votes/MyStreamWaveMyVotes";
import MyStreamWaveFAQ from "./my-stream/MyStreamWaveFAQ";
import { useWave } from "@/hooks/useWave";
import { ApiDrop } from "@/generated/models/ApiDrop";
import { ApiWaveType } from "@/generated/models/ApiWaveType";
import BrainMobileWaves from "./mobile/BrainMobileWaves";
import BrainMobileMessages from "./mobile/BrainMobileMessages";
import useDeviceInfo from "@/hooks/useDeviceInfo";
import BrainNotifications from "./notifications/NotificationsContainer";
import { getHomeFeedRoute } from "@/helpers/navigation.helpers";
import CreateWaveModal from "@/components/waves/create-wave/CreateWaveModal";
import CreateDirectMessageModal from "@/components/waves/create-dm/CreateDirectMessageModal";
import { useAuth } from "@/components/auth/Auth";
import { useMyStreamOptional } from "@/contexts/wave/MyStreamContext";

export enum BrainView {
  DEFAULT = "DEFAULT",
  ABOUT = "ABOUT",
  LEADERBOARD = "LEADERBOARD",
  WINNERS = "WINNERS",
  OUTCOME = "OUTCOME",
  MY_VOTES = "MY_VOTES",
  FAQ = "FAQ",
  WAVES = "WAVES",
  MESSAGES = "MESSAGES",
  NOTIFICATIONS = "NOTIFICATIONS",
}

interface Props {
  readonly children: ReactNode;
}

const BrainMobile: React.FC<Props> = ({ children }) => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const { isApp } = useDeviceInfo();
  const { connectedProfile } = useAuth();
  const [hydrated, setHydrated] = useState(false);
  const myStream = useMyStreamOptional();

  useEffect(() => {
    setHydrated(true);
  }, []);

  const [activeView, setActiveView] = useState<BrainView>(BrainView.DEFAULT);
  const dropId = searchParams?.get('drop') ?? undefined;
  const { data: drop } = useQuery<ApiDrop>({
    queryKey: [QueryKey.DROP, { drop_id: dropId }],
    queryFn: async () =>
      await commonApiFetch<ApiDrop>({
        endpoint: `drops/${dropId}`,
      }),
    placeholderData: keepPreviousData,
    enabled: !!dropId,
  });

  // Use MyStreamContext for waveId to support client-side navigation via pushState
  const waveId = myStream?.activeWave.id ?? searchParams?.get('wave') ?? null;
  const { data: wave } = useWaveData({
    waveId: waveId,
    onWaveNotFound: () => {
      const params = new URLSearchParams(searchParams?.toString() || '');
      params.delete('wave');
      const newUrl = params.toString()
        ? `${pathname}?${params.toString()}`
        : pathname || getHomeFeedRoute();
      router.push(newUrl, { scroll: false });
    },
  });

  const { isMemesWave } = useWave(wave);

  const {
    voting: { isCompleted },
    decisions: { firstDecisionDone },
  } = useWaveTimers(wave);

  const onDropClick = (drop: ExtendedDrop) => {
    const params = new URLSearchParams(searchParams?.toString() || '');
    params.set('drop', drop.id);
    router.push(`${pathname}?${params.toString()}`, { scroll: false });
  };

  const onDropClose = () => {
    const params = new URLSearchParams(searchParams?.toString() || '');
    params.delete('drop');
    const newUrl = params.toString()
      ? `${pathname}?${params.toString()}`
      : pathname || getHomeFeedRoute();
    router.push(newUrl, { scroll: false });
  };

  const isDropOpen =
    drop &&
    drop?.id?.toLowerCase() === dropId?.toLowerCase();

  const isRankWave = wave?.wave.type === ApiWaveType.Rank;

  const hasWave = Boolean(waveId);

  useEffect(() => {
    const tabParam = searchParams?.get("tab");
    const viewParam = searchParams?.get("view");
    const createParam = searchParams?.get("create");

    if (createParam && isApp) {
      setActiveView(BrainView.DEFAULT);
      return;
    }

    if (
      (!waveId && pathname === "/notifications") ||
      (!waveId && viewParam === "notifications")
    ) {
      setActiveView(BrainView.NOTIFICATIONS);
      return;
    }

    if (
      (!waveId && pathname === "/messages") ||
      (!waveId && viewParam === "messages")
    ) {
      setActiveView(BrainView.MESSAGES);
      return;
    }

    if (
      (!waveId && pathname === "/waves") ||
      (!waveId && viewParam === "waves")
    ) {
      setActiveView(BrainView.WAVES);
      return;
    }

    if (
      pathname === "/" &&
      (!tabParam || tabParam === "feed") &&
      !waveId &&
      !viewParam
    ) {
      setActiveView(BrainView.DEFAULT);
    }
  }, [pathname, searchParams, waveId, isApp]);

  // Handle tab visibility and reset on wave changes
  useEffect(() => {
    const globalViews = new Set([
      BrainView.DEFAULT,
      BrainView.WAVES,
      BrainView.MESSAGES,
      BrainView.NOTIFICATIONS,
    ]);

    const routeToView: Record<string, BrainView> = {
      "/waves": BrainView.WAVES,
      "/messages": BrainView.MESSAGES,
      "/notifications": BrainView.NOTIFICATIONS,
    };

    if (!hasWave) {
      const isWaveSpecificView = !globalViews.has(activeView);
      if (isWaveSpecificView) {
        setActiveView(routeToView[pathname ?? ""] ?? BrainView.DEFAULT);
      }
      return;
    }

    if (!wave) return;

    const shouldResetToDefault =
      (activeView === BrainView.LEADERBOARD && isCompleted) ||
      (activeView === BrainView.WINNERS && !firstDecisionDone) ||
      (activeView === BrainView.MY_VOTES && !isMemesWave) ||
      (activeView === BrainView.FAQ && !isMemesWave);

    if (shouldResetToDefault) {
      setActiveView(BrainView.DEFAULT);
      return;
    }

    const nonWaveViews = new Set([
      BrainView.NOTIFICATIONS,
      BrainView.MESSAGES,
      BrainView.WAVES,
    ]);

    if (waveId && nonWaveViews.has(activeView)) {
      setActiveView(BrainView.DEFAULT);
    }
  }, [hasWave, wave, isCompleted, firstDecisionDone, activeView, isMemesWave, waveId, pathname]);

  const closeCreateOverlay = useCallback(() => {
    const params = new URLSearchParams(searchParams?.toString() || "");
    params.delete("create");
    const base = pathname ?? "/";
    const next = params.toString() ? `${base}?${params.toString()}` : base;
    router.replace(next, { scroll: false });
  }, [router, pathname, searchParams]);

  const createOverlay = useMemo(() => {
    if (!isApp) return null;
    const createParam = searchParams?.get("create");
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

  const viewComponents: Record<BrainView, ReactNode> = {
    [BrainView.ABOUT]: (
      <BrainMobileAbout activeWaveId={waveId} />
    ),
    [BrainView.DEFAULT]: children,
    [BrainView.LEADERBOARD]:
      isRankWave && !!wave ? (
        <MyStreamWaveLeaderboard wave={wave} onDropClick={onDropClick} />
      ) : null,
    [BrainView.WINNERS]:
      isRankWave && !!wave ? (
        <div className="tw-px-2 sm:tw-px-4">
          <WaveWinners wave={wave} onDropClick={onDropClick} />
        </div>
      ) : null,
    [BrainView.OUTCOME]:
      isRankWave && !!wave ? <MyStreamWaveOutcome wave={wave} /> : null,
    [BrainView.MY_VOTES]:
      isRankWave && !!wave ? (
        <MyStreamWaveMyVotes wave={wave} onDropClick={onDropClick} />
      ) : null,
    [BrainView.FAQ]:
      isRankWave && isMemesWave && !!wave ? (
        <MyStreamWaveFAQ wave={wave} />
      ) : null,
    [BrainView.WAVES]: <BrainMobileWaves />,
    [BrainView.MESSAGES]: <BrainMobileMessages />,
    [BrainView.NOTIFICATIONS]: <BrainNotifications />,
  };

  const dropOverlayClass = isApp
    ? "tw-fixed tw-inset-0 tw-z-50 tw-bg-black tailwind-scope"
    : "tw-absolute tw-inset-0 tw-z-50";

  return (
    <div className="tw-relative tw-flex tw-flex-col tw-h-full">
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
          onViewChange={setActiveView}
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
          className="tw-flex-1">
          {viewComponents[activeView]}
        </motion.div>
      </AnimatePresence>
    </div>
  );
};

export default BrainMobile;
