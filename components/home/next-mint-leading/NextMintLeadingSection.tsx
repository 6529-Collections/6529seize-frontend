"use client";

import { useSeizeSettings } from "@/contexts/SeizeSettingsContext";
import { useWaveDecisions } from "@/hooks/waves/useWaveDecisions";
import {
  useWaveDropsLeaderboard,
  WaveDropsLeaderboardSort,
} from "@/hooks/useWaveDropsLeaderboard";
import NextMintCard from "./NextMintCard";
import LeadingCard from "./LeadingCard";

export default function NextMintLeadingSection() {
  const { seizeSettings, isLoaded } = useSeizeSettings();
  const waveId = seizeSettings.memes_wave_id;

  const { decisionPoints, isFetching: isWinnersFetching } = useWaveDecisions({
    waveId: waveId ?? "",
    enabled: !!waveId,
  });

  const { drops, isFetching: isLeaderboardFetching } = useWaveDropsLeaderboard({
    waveId: waveId ?? "",
    sort: WaveDropsLeaderboardSort.RATING_PREDICTION,
    pausePolling: !waveId,
  });

  // Get latest winner (last decision, first place)
  const latestDecision = decisionPoints[decisionPoints.length - 1];
  const nextMint = latestDecision?.winners[0]?.drop ?? null;

  // Get top 2 from leaderboard
  const leading = drops.slice(0, 2);

  const isFetching = isWinnersFetching || isLeaderboardFetching;

  if (!isLoaded || !waveId) {
    return null;
  }

  if (isFetching && !nextMint && leading.length === 0) {
    return (
      <div className="tw-py-8">
        <div className="tw-flex tw-h-64 tw-items-center tw-justify-center">
          <div className="tw-text-sm tw-text-iron-500">Loading...</div>
        </div>
      </div>
    );
  }

  if (!nextMint && leading.length === 0) {
    return null;
  }

  return (
    <section className="tw-py-8">
      {/* Header */}
      <div className="tw-mb-4 tw-flex tw-items-center tw-justify-between">
        <h2 className="tw-m-0 tw-text-lg tw-font-semibold tw-text-iron-50">
          Next mint and what&apos;s leading
        </h2>
        <a
          href="/waves"
          className="tw-text-sm tw-text-iron-400 tw-transition-colors hover:tw-text-iron-200"
        >
          View all →
        </a>
      </div>

      {/* Grid - 3 equal columns */}
      <div className="tw-grid tw-grid-cols-1 tw-gap-4 sm:tw-grid-cols-3">
        {/* Next Mint */}
        {nextMint && <NextMintCard drop={nextMint} />}

        {/* Leading cards */}
        {leading.map((drop, index) => (
          <LeadingCard key={drop.id} drop={drop} rank={index + 1} />
        ))}
      </div>
    </section>
  );
}
