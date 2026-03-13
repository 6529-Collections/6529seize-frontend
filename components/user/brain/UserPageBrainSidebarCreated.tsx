"use client";

import { useState, type ReactNode } from "react";
import type { ApiIdentity } from "@/generated/models/ApiIdentity";
import { useWaves } from "@/hooks/useWaves";
import UserPageBrainSidebarWaveItem from "./UserPageBrainSidebarWaveItem";
import { getProfileWaveIdentity } from "./userPageBrainSidebar.helpers";

const LoadingState = () => (
  <div className="tw-space-y-2.5" aria-label="Loading created waves">
    {[0, 1, 2].map((key) => (
      <div
        key={key}
        className="tw-flex tw-items-center tw-gap-3 tw-rounded-2xl tw-border tw-border-solid tw-border-white/[0.05] tw-bg-white/[0.02] tw-p-3 tw-shadow-inner"
      >
        <div className="tw-h-10 tw-w-10 tw-shrink-0 tw-animate-pulse tw-rounded-xl tw-bg-white/[0.06]" />
        <div className="tw-min-w-0 tw-flex-1 tw-space-y-1.5">
          <div className="tw-h-3 tw-w-2/3 tw-animate-pulse tw-rounded tw-bg-white/[0.06]" />
          <div className="tw-h-2.5 tw-w-1/2 tw-animate-pulse tw-rounded tw-bg-white/[0.05]" />
        </div>
      </div>
    ))}
  </div>
);

export default function UserPageBrainSidebarCreated({
  profile,
}: {
  readonly profile: ApiIdentity;
}) {
  const [expandedIdentity, setExpandedIdentity] = useState<string | null>(null);
  const identity = getProfileWaveIdentity(profile);
  const hasIdentity = identity.length > 0;
  const { waves, status, error } = useWaves({
    identity,
    waveName: null,
    enabled: hasIdentity,
    directMessage: false,
    limit: 20,
  });
  const showAllWaves = expandedIdentity === identity;
  const visibleWaves = showAllWaves ? waves : waves.slice(0, 1);
  const remainingWavesCount = Math.max(waves.length - 1, 0);
  const showMoreLabel =
    remainingWavesCount === 1
      ? "Show 1 more"
      : `Show ${remainingWavesCount} more`;
  const shouldShowLoading = hasIdentity && status === "pending";
  const shouldShowWaves = !error && waves.length > 0;
  const shouldRenderSection = shouldShowLoading || shouldShowWaves;
  let section: ReactNode = null;

  if (shouldRenderSection) {
    let sectionContent: ReactNode = null;

    if (shouldShowLoading) {
      sectionContent = <LoadingState />;
    } else if (shouldShowWaves) {
      sectionContent = (
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
              className="tw-mt-2 tw-cursor-pointer tw-border-none tw-bg-black tw-px-1 tw-text-[10px] tw-font-semibold tw-uppercase tw-tracking-wider tw-text-iron-500 tw-transition-colors desktop-hover:hover:tw-text-iron-300"
            >
              {showAllWaves ? "Show less" : showMoreLabel}
            </button>
          )}
        </>
      );
    }

    section = (
      <section aria-labelledby="brain-created-waves-heading">
        <span
          id="brain-created-waves-heading"
          className="tw-text-xs tw-font-semibold tw-uppercase tw-tracking-wider tw-text-iron-500"
        >
          Created Waves
        </span>
        <div className="tw-mt-3 tw-space-y-2.5">{sectionContent}</div>
      </section>
    );
  }

  return section;
}
