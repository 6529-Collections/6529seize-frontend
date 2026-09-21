"use client";

import type { ReactNode } from "react";

import WavesLayout from "@/components/waves/layout/WavesLayout";
import PublicWaveFeedGate from "@/components/waves/PublicWaveFeedGate";
import WavesView from "@/components/waves/WavesView";

export default function WavesPageClient({
  publicFeedFallback = null,
  publicFeedWaveId = null,
}: {
  readonly publicFeedFallback?: ReactNode;
  readonly publicFeedWaveId?: string | null;
}) {
  return (
    <WavesLayout>
      {publicFeedFallback !== null && publicFeedWaveId !== null ? (
        <PublicWaveFeedGate
          fallback={publicFeedFallback}
          waveId={publicFeedWaveId}
        >
          <WavesView />
        </PublicWaveFeedGate>
      ) : (
        <WavesView />
      )}
    </WavesLayout>
  );
}
