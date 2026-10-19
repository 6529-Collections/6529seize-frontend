"use client";

import { type ReactNode, useCallback, useState } from "react";

import { useMyStreamOptional } from "@/contexts/wave/MyStreamContext";
import { useContentTab } from "@/components/brain/ContentTabContext";
import { useHasHydrated } from "@/hooks/useHasHydrated";
import { MyStreamWaveTab } from "@/types/waves.types";
import { PublicWaveFeedReadyContext } from "./PublicWaveFeedReady";

export default function PublicWaveFeedGate({
  children,
  fallback,
  waveId,
}: {
  readonly children: ReactNode;
  readonly fallback: ReactNode;
  readonly waveId: string;
}) {
  const myStream = useMyStreamOptional();
  const { activeContentTab } = useContentTab();
  const hydrated = useHasHydrated();
  const [readyWaveId, setReadyWaveId] = useState<string | null>(null);
  const activeWaveId = myStream?.activeWave.id ?? null;
  const markReady = useCallback(() => {
    if (activeWaveId === waveId) setReadyWaveId(waveId);
  }, [activeWaveId, waveId]);
  const hasMismatchedActiveWave =
    hydrated && activeWaveId !== null && activeWaveId !== waveId;
  const showFallback =
    !hasMismatchedActiveWave &&
    readyWaveId !== waveId &&
    (!hydrated || activeContentTab === MyStreamWaveTab.CHAT);

  return (
    <PublicWaveFeedReadyContext value={markReady}>
      <div className="tailwind-scope tw-relative tw-flex tw-min-h-0 tw-flex-1 tw-flex-col">
        <div
          aria-hidden={showFallback}
          className="tw-flex tw-min-h-0 tw-flex-1 tw-flex-col"
          inert={showFallback ? true : undefined}
        >
          {children}
        </div>
        {showFallback ? (
          <div className="tw-absolute tw-inset-0 tw-z-10 tw-overflow-y-auto tw-bg-iron-950">
            {fallback}
          </div>
        ) : null}
      </div>
    </PublicWaveFeedReadyContext>
  );
}
