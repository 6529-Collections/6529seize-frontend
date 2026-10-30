"use client";

import type { ReactNode } from "react";

import PublicWaveFeedGate from "@/components/waves/PublicWaveFeedGate";
import WavesView from "@/components/waves/WavesView";

export default function WavesPageClient({
  publicFeedFallback = null,
  publicFeedWaveId = null,
  waveName,
}: {
  readonly publicFeedFallback?: ReactNode;
  readonly publicFeedWaveId?: string | null;
  readonly waveName?: string | undefined;
}) {
  return (
    <>
      {publicFeedFallback !== null && publicFeedWaveId !== null ? (
        <PublicWaveFeedGate
          key={publicFeedWaveId}
          fallback={publicFeedFallback}
          waveId={publicFeedWaveId}
          waveName={waveName}
        >
          <WavesView />
        </PublicWaveFeedGate>
      ) : (
        <WavesView />
      )}
    </>
  );
}
