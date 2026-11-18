"use client";

import type { PublicWaveDrop as PublicWaveDropData } from "./public-wave-drop.server";
import type { PublicWaveFeedResult } from "./public-wave-feed.server";
import PublicWaveDrop from "@/components/waves/PublicWaveDrop";
import PublicWaveFeed from "@/components/waves/PublicWaveFeed";
import PublicWaveFeedGate from "@/components/waves/PublicWaveFeedGate";
import WavesView from "@/components/waves/WavesView";
import type { SupportedLocale } from "@/i18n/locales";

export type WavesPublicPreview =
  | { readonly feed: Extract<PublicWaveFeedResult, { ok: true }> }
  | { readonly drop: PublicWaveDropData; readonly locale: SupportedLocale };

export default function WavesPageClient({
  publicPreview = null,
  waveName,
}: {
  readonly publicPreview?: WavesPublicPreview | null;
  readonly waveName?: string | undefined;
}) {
  if (!publicPreview) return <WavesView />;

  // Render the preview together with its gate so React can emit all of its
  // HTML without using scripts to fill separately streamed preview rows.
  const waveId =
    "feed" in publicPreview
      ? publicPreview.feed.waveId
      : publicPreview.drop.waveId;
  const fallback =
    "feed" in publicPreview ? (
      <PublicWaveFeed feed={publicPreview.feed} />
    ) : (
      <PublicWaveDrop drop={publicPreview.drop} locale={publicPreview.locale} />
    );
  return (
    <PublicWaveFeedGate
      key={waveId}
      fallback={fallback}
      waveId={waveId}
      waveName={waveName}
    >
      <WavesView />
    </PublicWaveFeedGate>
  );
}
