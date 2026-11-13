"use client";

import { type ReactNode, useCallback, useState } from "react";
import clsx from "clsx";

import { useMyStreamOptional } from "@/contexts/wave/MyStreamContext";
import { useContentTab } from "@/components/brain/ContentTabContext";
import { useHasHydrated } from "@/hooks/useHasHydrated";
import { MyStreamWaveTab } from "@/types/waves.types";
import { PublicWaveFeedReadyContext } from "./PublicWaveFeedReady";
import WaveChatLoading from "./WaveChatLoading";
import styles from "./PublicWaveFeedGate.module.css";

export default function PublicWaveFeedGate({
  children,
  fallback,
  waveId,
  waveName,
}: {
  readonly children: ReactNode;
  readonly fallback: ReactNode;
  readonly waveId: string;
  readonly waveName?: string | undefined;
}) {
  const myStream = useMyStreamOptional();
  const { activeContentTab } = useContentTab();
  const hydrated = useHasHydrated();
  const [readiness, setReadiness] = useState<{
    waveId: string;
    token: symbol;
  } | null>(null);
  const activeWaveId = myStream?.activeWave.id ?? null;
  const markReady = useCallback(() => {
    if (activeWaveId !== waveId) return;
    const token = Symbol();
    setReadiness({ waveId, token });
    return () =>
      setReadiness((current) => (current?.token === token ? null : current));
  }, [activeWaveId, waveId]);
  const hasMismatchedActiveWave =
    hydrated && activeWaveId !== null && activeWaveId !== waveId;
  const showFallback =
    !hasMismatchedActiveWave &&
    readiness?.waveId !== waveId &&
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
          <div
            className={clsx(
              "tw-absolute tw-inset-0 tw-z-10 tw-overflow-y-auto tw-bg-iron-950",
              hydrated && styles["enhanced"]
            )}
          >
            <div className={styles["loading"]}>
              <WaveChatLoading waveName={waveName} />
            </div>
            <div className={styles["publicFeed"]}>{fallback}</div>
          </div>
        ) : null}
      </div>
    </PublicWaveFeedReadyContext>
  );
}
