"use client";

import type { QueryStatus } from "@tanstack/react-query";
import { useState } from "react";
import type { ApiWave } from "@/generated/models/ApiWave";
import UserPageBrainSidebarWaveItem from "./UserPageBrainSidebarWaveItem";

interface UserPageBrainSidebarCreatedProps {
  readonly identity: string;
  readonly waves: ApiWave[];
  readonly status: QueryStatus;
  readonly error: unknown;
}

export default function UserPageBrainSidebarCreated({
  identity,
  waves,
  status,
  error,
}: UserPageBrainSidebarCreatedProps) {
  const [expandedIdentity, setExpandedIdentity] = useState<string | null>(null);
  const showAllWaves = expandedIdentity === identity;
  const visibleWaves = showAllWaves ? waves : waves.slice(0, 1);
  const remainingWavesCount = Math.max(waves.length - 1, 0);
  const showMoreLabel =
    remainingWavesCount === 1
      ? "Show 1 more"
      : `Show ${remainingWavesCount} more`;
  const shouldShowLoading = status === "pending";
  const shouldShowWaves =
    (error === null || error === undefined) && waves.length > 0;
  if (!shouldShowLoading && !shouldShowWaves) {
    return null;
  }

  return (
    <section aria-labelledby="brain-created-waves-heading">
      <span
        id="brain-created-waves-heading"
        className="tw-text-xs tw-font-semibold tw-uppercase tw-tracking-wider tw-text-iron-500"
      >
        Created Waves
      </span>
      <div className="tw-mt-3 tw-space-y-2.5">
        {shouldShowLoading ? (
          <div className="tw-space-y-2.5" aria-label="Loading created waves">
            {[0, 1, 2].map((key) => (
              <div
                key={key}
                className="tw-flex tw-items-center tw-gap-3 tw-rounded-xl tw-border tw-border-solid tw-border-white/5 tw-bg-white/5 tw-p-3 tw-shadow-inner"
              >
                <div className="tw-h-10 tw-w-10 tw-shrink-0 tw-animate-pulse tw-rounded-full tw-bg-white/[0.06]" />
                <div className="tw-min-w-0 tw-flex-1 tw-space-y-1.5">
                  <div className="tw-h-3 tw-w-2/3 tw-animate-pulse tw-rounded tw-bg-white/[0.06]" />
                  <div className="tw-h-2.5 tw-w-1/2 tw-animate-pulse tw-rounded tw-bg-white/[0.05]" />
                </div>
              </div>
            ))}
          </div>
        ) : (
          <>
            {visibleWaves.map((wave) => (
              <UserPageBrainSidebarWaveItem key={wave.id} wave={wave} />
            ))}
            {waves.length > 1 && (
              <button
                type="button"
                onClick={() =>
                  setExpandedIdentity((current) =>
                    current === identity ? null : identity
                  )
                }
                className="tw-mt-2 tw-cursor-pointer tw-border-none tw-bg-black tw-px-1 tw-text-xs tw-font-semibold tw-text-iron-500 tw-transition-colors desktop-hover:hover:tw-text-iron-300"
              >
                {showAllWaves ? "Show less" : showMoreLabel}
              </button>
            )}
          </>
        )}
      </div>
    </section>
  );
}
