"use client";

import { useSeizeSettings } from "@/contexts/SeizeSettingsContext";
import {
  useWaveDropsLeaderboard,
  WaveDropsLeaderboardSort,
} from "@/hooks/useWaveDropsLeaderboard";
import { useWaveDecisions } from "@/hooks/waves/useWaveDecisions";
import { ArrowRightIcon } from "@heroicons/react/24/outline";
import Link from "next/link";
import { LeadingCard } from "./LeadingCard";
import { NextMintCard } from "./NextMintCard";

export function NextMintLeadingSection() {
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

  const sectionClassName = "tw-relative tw-z-10 tw-pb-8 tw-pt-20";
  const header = (
    <div className="tw-mb-8 tw-flex tw-items-end tw-justify-between">
      <div>
        <span className="tw-m-0 tw-text-xl tw-font-semibold tw-tracking-tight tw-text-white md:tw-text-2xl">
          Coming up 
        </span>
        <p className="tw-mt-1 tw-text-base tw-text-iron-500">
          Next in queue and current vote leaders
        </p>
      </div>
      <Link
        href="/waves"
        className="tw-inline-flex tw-items-center tw-gap-1.5 tw-text-sm tw-font-medium tw-text-iron-400 tw-no-underline tw-transition-colors hover:tw-text-white"
      >
        <span>View all</span>
        <ArrowRightIcon className="tw-size-4 tw-flex-shrink-0" aria-hidden />
      </Link>
    </div>
  );

  if (isFetching && !nextMint && leading.length === 0) {
    return (
      <section className={sectionClassName}>
        <div>
          {header}
          <div className="tw-flex tw-h-64 tw-items-center tw-justify-center">
            <div className="tw-text-sm tw-text-white/40">Loading...</div>
          </div>
        </div>
      </section>
    );
  }

  if (!nextMint && leading.length === 0) {
    return null;
  }

  return (
    <section className={sectionClassName}>
      <div>
        {header}
        <div className="tw-grid tw-grid-cols-1 tw-gap-8 md:tw-grid-cols-3">
          {nextMint && <NextMintCard drop={nextMint} />}
          {leading.map((drop, index) => (
            <LeadingCard key={drop.id} drop={drop} rank={index + 1} />
          ))}
        </div>
      </div>
    </section>
  );
}
